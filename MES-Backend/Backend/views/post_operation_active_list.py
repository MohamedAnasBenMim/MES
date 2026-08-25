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
import json
import string
import random
from ..models import IonAPICredentials 
import traceback
from django.core.mail import send_mail
from Backend.models import ActiveOperation



@csrf_exempt
def post_operation_active_list(request):

    # Step : Get company code dynamically
    company_response = requests.get('http://localhost:8000/api/get_ionapi_credential/')
    if company_response.status_code != 200:
        return Response({'error': 'Failed to get company'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    companyId = company_response.json().get('company')
    if not companyId:
        return Response({'error': 'Company code missing in credentials'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Step : Get company code dynamically


    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            operation = ActiveOperation(
                username=data.get('username', ''),
                company_id=companyId,  
                order=data.get('Order', ''),
                operation=data.get('Operation', ''),
                operated_item=data.get('OperatedItem', ''),
                reference_operation_machine_type=data.get('ReferenceOperationMachineType', ''),
                routing_quantity=data.get('RoutingQuantity', 0),
                planned_start_date=data.get('PlannedStartDate', ''),
                planned_finish_date=data.get('PlannedFinishDate', ''),
                reference_operation_work_center=data.get('ReferenceOperationWorkCenter', ''),
                operation_status=data.get('OperationStatus', '')
            )
            operation.save()

            return JsonResponse({
                'message': 'Operation saved to Active List successfully!',
                'data': {
                    'id': operation.id,
                    'order': operation.order,
                    'operation': operation.operation,
                    'company_id': operation.company_id
                }
            }, status=201)

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

