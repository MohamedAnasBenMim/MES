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



@api_view(['POST'])
def post_initiate_materials(request):
    # Step 1: Get token
    token_response = requests.get('http://localhost:8000/api/get-token/')
    if token_response.status_code != 200:
        return Response({'error': 'Failed to get token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    access_token = token_response.json().get('access_token')
    order_number = request.data.get('order_id')   
    Position = request.data.get('position')   

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
        'Content-Type': 'application/json',
        'If-Match': '*',  # Added based on the UI showing If-Match field
        'Content-Language': 'en-US'  # Added based on the UI showing Content-Language field
    }

    # Step 3: Format URL correctly - ensure proper URL encoding
    base_url = "https://mingle-ionapi.eu1.inforcloudsuite.com/LDE4VNS7C63W3JGC_DEM/LN/lnapi/odata/"
    # Use proper URL encoding for the order parameter
    order_part = f"tiapi.sfcProductionOrder/Materials(Order='{order_number}',Position={Position})"
    action_part = "tiapi.sfcProductionOrder.InitiateInventoryIssue"
    infor_url = f"{base_url}{order_part}/{action_part}"
    
  
    # Use empty payload since this appears to be an action call
    # From the UI, it seems this might not need a body payload
    try:
        response = requests.post(infor_url, headers=headers)
        if response.status_code in [200, 201, 202, 204]:
            # Some APIs return empty responses for success
            try:
                return Response(response.json(), status=status.HTTP_200_OK)
            except ValueError:  # JSON decoding failed
                return Response({"status": "success", "message": "Order completed"}, 
                               status=response.status_code)
        else:
            error_detail = f"Error {response.status_code}: {response.text}"
            # print(f"API Error: {error_detail}")
            return Response({'error': error_detail}, 
                           status=status.HTTP_502_BAD_GATEWAY)
    except requests.exceptions.RequestException as e:
        print("Error posting to Infor API:", e)
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)