from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
from rest_framework import status

@api_view(['GET'])
def get_ping_dispatch(request):
    # Step 1: Get token
    token_response = requests.get('http://localhost:8000/api/get-token/')
    if token_response.status_code != 200:
        return Response({'error': 'Failed to get token'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    access_token = token_response.json().get('access_token')
    if not access_token:
        return Response({'error': 'Access token missing'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Step 2: Get company code dynamically
    company_response = requests.get('http://127.0.0.1:8000/api/get_ionapi_credential/')
    if company_response.status_code != 200:
        return Response({'error': 'Failed to get company code'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    company_code = company_response.json().get('company')
    if not company_code:
        return Response({'error': 'Company code missing in credentials'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Step 3: Prepare headers
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
        'X-Infor-LnCompany': company_code,
    }

    # Step 4: Call Infor API
    url = 'https://mingle-ionapi.eu1.inforcloudsuite.com/LDE4VNS7C63W3JGC_DEM/LN/lnapi/odata/tiapi.sfcProductionOrder/Orders?%24select=Order&%24orderby=Order'

    while url:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return Response({'error': 'Failed to fetch dispatch data'}, status=status.HTTP_502_BAD_GATEWAY)

        json_data = response.json()
        results = json_data.get('value', [])

        if results:  # Found at least one record
            return Response({'message': 'API reachable and at least one record exists!'}, status=status.HTTP_200_OK)

        url = json_data.get('@odata.nextLink')  # Continue to next page if exists

    # No records found after all pages
    return Response({'error': 'API reachable but no active dispatch records found'}, status=status.HTTP_404_NOT_FOUND)
