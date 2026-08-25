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


@api_view(['POST'])
def post_nc_attachment(request):
    payload = request.data

    # Step 1: Get token
    token_response = requests.get('http://localhost:8000/api/get-token/')
    if token_response.status_code != 200:
        return Response({'error': 'Failed to get token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    access_token = token_response.json().get('access_token')

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

    # Step 3: POST to Infor API
    infor_url ="https://mingle-ionapi.eu1.inforcloudsuite.com/LDE4VNS7C63W3JGC_DEM/IDM/api/items"
    try:
        response = requests.post(infor_url, json=payload, headers=headers)
        response.raise_for_status()
        return Response(response.json(), status=status.HTTP_201_CREATED)
    except requests.exceptions.RequestException as e:
        print("Error posting to Infor API:", e)
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)