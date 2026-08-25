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
# import json
# import string
# import random
# from .models import UserAccount
# import traceback
# from django.core.mail import send_mail


@api_view(['GET'])
def get_related_nc_data(request):
    # Step 1: Get access token
    token_response = requests.get('http://localhost:8000/api/get-token/')
    if token_response.status_code != 200:
        return Response(
            {'error': 'Failed to get token'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    access_token = token_response.json().get('access_token')

    # Step 2: Validate input parameters
    order_number = request.GET.get("order_id")
    operation = request.GET.get("operation")
    # order_number = 'J10000045'
    # operation = 10

    if not order_number or not operation:
        return Response(
            {"error": "Missing 'order_id' or 'operation' parameter"},
            status=status.HTTP_400_BAD_REQUEST
        )

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

    # Step 4: Construct initial URL
    url = (
        "https://mingle-ionapi.eu1.inforcloudsuite.com/"
        "LDE4VNS7C63W3JGC_DEM/LN/lnapi/odata/"
        f"qmapi.ncmNonConformanceReport/NonConformanceReports"
        f"?$filter=OriginOrder eq '{order_number}' and Operation eq {operation}"
        f"&$select=NonConformanceReport,NonConformingMaterialReportStatus"
        f"&$orderby=NonConformanceReport"
    )

    # Step 5: Recursive pagination loop to fetch all results
    all_results = []

    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return Response(
                {'error': 'Failed to fetch NC data from Infor', 'status': response.status_code},
                status=status.HTTP_502_BAD_GATEWAY
            )

        data = response.json()
        all_results.extend(data.get('value', []))
        url = data.get('@odata.nextLink')  # Handle pagination

    # Step 6: Return all fetched NC data
    return Response(all_results, status=status.HTTP_200_OK)
