# views.py
from rest_framework.decorators import api_view # type: ignore
from rest_framework.response import Response # type: ignore
import requests  # type: ignore
from Backend.utils.token_manager import get_mingle_token
from django.http import JsonResponse
from rest_framework import status
from Backend.models import IonAPICredentials
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password


@api_view(['GET'])

def get_operation_data(request):
    order_number = request.GET.get("order_id")
    operation = request.GET.get("operation")

    if not order_number or not operation:
        return Response({"error": "Missing 'order_number' parameter"}, status=400)

    url = (
        f"https://mingle-ionapi.eu1.inforcloudsuite.com/"
        f"LDE4VNS7C63W3JGC_DEM/LN/lnapi/odata/"
        f"tiapi.sfcProductionOrder/Operations(Order='{order_number}',Operation={operation})"
    )

    try:
        token = get_mingle_token()
    except Exception as e:
        return Response({"error": "Token fetch failed", "details": str(e)}, status=500)

      # Step 2: Get company code dynamically
    company_response = requests.get('http://127.0.0.1:8000/api/get_ionapi_credential/')
    company_response.raise_for_status()
    company_code = company_response.json().get('company')

    if not company_code:
        return Response({'error': 'Company code missing in credentials'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Step 3: Prepare headers
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
        'X-Infor-LnCompany': company_code,
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        # Use entire response, don't assume "value"
        data = response.json()
        return Response(data)

    except requests.exceptions.HTTPError as http_err:
        return Response({
            "error": "HTTP error occurred",
            "details": str(http_err),
            "status_code": response.status_code,
            "response_text": response.text,
            "url": url
        }, status=response.status_code)
    except requests.exceptions.RequestException as e:
        return Response({
            "error": "Request failed",
            "details": str(e)
        }, status=500)
    