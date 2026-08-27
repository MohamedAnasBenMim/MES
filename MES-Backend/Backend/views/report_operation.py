# views.py
import xml.etree.ElementTree as ET

import requests  # type: ignore
from Backend.models import (
    ActiveOperation,
    IonAPICredentials,
    OperatorAssignment,
    OperatorPerformance,
)
from Backend.utils.token_manager import get_mingle_token
from Backend.views.get_dispatch_data import DISPATCH_CACHE_KEY
from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view  # type: ignore
from rest_framework.response import Response  # type: ignore

POINTS_PER_COMPLETED_OPERATION = 100
POINTS_PER_DELIVERED_UNIT = 2
POINTS_PER_REJECTED_UNIT = 5
ZERO_REJECTION_BONUS = 25


def extract_infor_message(response_text):
    if not response_text:
        return ""

    try:
        root = ET.fromstring(response_text)
    except ET.ParseError:
        return response_text

    for element in root.iter():
        if element.tag.endswith("faultstring") and element.text:
            return element.text

    for element in root.iter():
        if element.tag.endswith("messageText") and element.text:
            return element.text

    return response_text


def is_already_completed_message(message):
    return "already completed" in str(message or "").lower()


def close_local_active_operation(
    order_id,
    operation_number,
    username=None,
    active_operation_id=None,
):
    operations = ActiveOperation.objects.filter(
        order=order_id,
        operation=operation_number,
    )

    if active_operation_id:
        operations = operations.filter(id=active_operation_id)
    elif username:
        operations = operations.filter(username__iexact=username)
    else:
        return

    with transaction.atomic():
        for active_operation in operations.select_for_update():
            OperatorAssignment.objects.filter(
                operation=active_operation,
                closed_at__isnull=True,
            ).update(
                closed_at=timezone.now(),
                closed_reason="completed",
                status="completed",
            )

            active_operation.username = ""
            active_operation.operation_status = "Completed"
            active_operation.save(update_fields=["username", "operation_status"])

    cache.delete(DISPATCH_CACHE_KEY)


def calculate_quality_score(
    delivered_quantity,
    rejected_quantity,
):
    total_quantity = delivered_quantity + rejected_quantity

    if total_quantity <= 0:
        return 100

    quality = (delivered_quantity / total_quantity) * 100

    return round(
        max(
            min(quality, 100),
            0,
        ),
        2,
    )


def calculate_operator_points(
    delivered_quantity,
    rejected_quantity,
):
    points = (
        POINTS_PER_COMPLETED_OPERATION
        + int(delivered_quantity * POINTS_PER_DELIVERED_UNIT)
        - int(rejected_quantity * POINTS_PER_REJECTED_UNIT)
    )

    if rejected_quantity == 0:
        points += ZERO_REJECTION_BONUS

    return max(points, 0)


@api_view(["POST"])
def report_operation(request):
    try:
        order_id = str(request.data["order_id"]).strip()
        operation = str(request.data["operation"]).strip()
        qty_deliver = float(request.data["qty_deliver"])
        qty_reject = float(request.data.get("qty_reject", 0))

        username = str(request.data.get("username", "")).strip()
        active_operation_id = request.data.get("active_operation_id")

        login_code = str(request.data.get("login_code", "zumtech2")).strip()

    except KeyError as error:
        return Response(
            {"error": f"Missing field: {error.args[0]}"},
            status=400,
        )

    except (TypeError, ValueError):
        return Response(
            {"error": ("Delivered and rejected quantities must be numeric.")},
            status=400,
        )

    if not username:
        return Response(
            {"error": "Username is required."},
            status=400,
        )

    if not order_id or not operation:
        return Response(
            {"error": "Order and operation are required."},
            status=400,
        )

    if qty_deliver < 0 or qty_reject < 0:
        return Response(
            {"error": "Quantities cannot be negative."},
            status=400,
        )

    token_response = requests.get(
        "http://localhost:8000/api/get-token/",
        timeout=30,
    )

    if token_response.status_code != 200:
        return Response(
            {"error": ("Failed to get token.")},
            status=500,
        )

    access_token = token_response.json().get("access_token")

    if not access_token:
        return Response(
            {"error": ("Token not found " "in response.")},
            status=500,
        )

    try:
        company_response = requests.get(
            ("http://127.0.0.1:8000/" "api/get_ionapi_credential/"),
            timeout=30,
        )

        company_response.raise_for_status()

        company_code = company_response.json().get("company")

    except requests.RequestException:
        return Response(
            {"error": ("Unable to load " "company credentials.")},
            status=500,
        )

    if not company_code:
        return Response(
            {"error": ("Company code missing " "in credentials.")},
            status=500,
        )

    soap_payload = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns="http://www.infor.com/businessinterface/IWMStdReportOperation">
  <soapenv:Header>
    <Activation>
      <company>{company_code}</company>
    </Activation>
  </soapenv:Header>
  <soapenv:Body>
    <ReportOperation>
      <ReportOperationRequest>
        <DataArea>
          <IWMStdReportOperation>
            <LoginCode>{login_code}</LoginCode>
            <Operation>{operation}</Operation>
            <ProductionOrder>{order_id}</ProductionOrder>
            <Complete>yes</Complete>
            <QtyDeliver>{qty_deliver}</QtyDeliver>
            <QtyReject>{qty_reject}</QtyReject>
            <BackFlush>no</BackFlush>
            <PostSubassyToInv>no</PostSubassyToInv>
            <DirectProcessQuarantine>yes</DirectProcessQuarantine>
          </IWMStdReportOperation>
        </DataArea>
      </ReportOperationRequest>
    </ReportOperation>
  </soapenv:Body>
</soapenv:Envelope>"""

    soap_url = (
        "https://mingle-ionapi.eu1."
        "inforcloudsuite.com/"
        "LDE4VNS7C63W3JGC_DEM/"
        "LN/c4ws/services/"
        "IWMStdReportOperation"
    )

    headers = {
        "Authorization": (f"Bearer {access_token}"),
        "Content-Type": ("text/xml;charset=UTF-8"),
        "Accept": "text/xml",
        "SOAPAction": ("ReportOperation"),
    }

    try:
        response = requests.post(
            soap_url,
            data=soap_payload.encode("utf-8"),
            headers=headers,
            timeout=60,
        )

    except requests.RequestException as error:
        return Response(
            {"error": str(error)},
            status=502,
        )

    message = extract_infor_message(response.text)

    if not (200 <= response.status_code < 300) and not is_already_completed_message(
        message
    ):
        return Response(
            {
                "error": "Infor rejected the operation report.",
                "status": response.status_code,
                "message": message,
                "response": response.text,
            },
            status=response.status_code,
        )

    close_local_active_operation(
        order_id,
        operation,
        username=username,
        active_operation_id=active_operation_id,
    )

    if is_already_completed_message(message):
        return Response(
            {
                "success": True,
                "status": 200,
                "message": message,
                "local_status": "closed_as_completed",
            },
            status=status.HTTP_200_OK,
        )

    quality_score = calculate_quality_score(
        qty_deliver,
        qty_reject,
    )

    points = calculate_operator_points(
        qty_deliver,
        qty_reject,
    )

    performance = OperatorPerformance.objects.create(
        username=username,
        company_id=company_code,
        order=order_id,
        operation=operation,
        qty_deliver=qty_deliver,
        qty_reject=qty_reject,
        quality_score=quality_score,
        points=points,
        completed_at=timezone.now(),
    )

    return Response(
        {
            "success": True,
            "message": "Operation reported successfully.",
            "performance": {
                "id": performance.id,
                "points": points,
                "quality_score": quality_score,
            },
            "infor_status": response.status_code,
        },
        status=status.HTTP_200_OK,
    )
