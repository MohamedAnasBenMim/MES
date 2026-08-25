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
def get_nc_data(request):
    # Step 1: Get access token
    token_response = requests.get('http://localhost:8000/api/get-token/')

    if token_response.status_code != 200:
        return Response({'error': 'Failed to get token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    access_token = token_response.json().get('access_token')

    # Step 2: Get company code dynamically
    company_response = requests.get('http://localhost:8000/api/get_ionapi_credential/')
    if company_response.status_code != 200:
        return Response({'error': 'Failed to get company'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    company_code = company_response.json().get('company')
    if not company_code:
        return Response({'error': 'Company code missing in credentials'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Step 3: Prepare headers
    headers = {

        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "X-Infor-LnCompany": company_code ,
        "X-Infor-LnIdentity": "zumtech2"
    }

    # Step 4: Fetch from Infor API
    url = 'https://mingle-ionapi.eu1.inforcloudsuite.com/LDE4VNS7C63W3JGC_DEM/LN/lnapi/odata/qmapi.ncmNonConformanceReport/NonConformanceReports'
    all_results = []

    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return Response({'error': 'Failed to fetch NC data from Infor', 'status': response.status_code}, status=status.HTTP_502_BAD_GATEWAY)

        data = response.json()
        all_results.extend(data.get('value', []))
        url = data.get('@odata.nextLink')  # Paginate

    return Response(all_results, status=status.HTTP_200_OK)
