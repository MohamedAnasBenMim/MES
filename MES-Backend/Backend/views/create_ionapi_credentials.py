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


@csrf_exempt
def create_ionapi_credentials(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

    try:
        data = json.loads(request.body)

        # Save credentials
        credentials = IonAPICredentials(
            ti=data.get('ti', ''),
            cn=data.get('cn', ''),
            dt=data.get('dt', ''),
            ci=data.get('ci', ''),
            cs=data.get('cs', ''),
            iu=data.get('iu', ''),
            pu=data.get('pu', ''),
            oa=data.get('oa', ''),
            ot=data.get('ot', ''),
            or_field=data.get('or', ''),
            sc=data.get('sc', []),
            ev=data.get('ev', ''),
            v=data.get('v', ''),
            company=data.get('company', ''),
            filename=data.get('filename', '')
        )
        credentials.save()

        # Get token
        token = get_mingle_token()
        if not token:
            return JsonResponse({
                'error': 'Failed to get API token.',
                'data': {
                    'id': credentials.id,
                    'cn': credentials.cn,
                    'ti': credentials.ti
                }
            }, status=400)

        # Ping API
        ping_url = 'http://127.0.0.1:8000/api/get_ping_dispatch/'
        try:
            ping_response = requests.get(
                ping_url,
                headers={'Authorization': f'Bearer {token}'},
                timeout=5
            )
            if ping_response.status_code == 200:
                return JsonResponse({
                    'message': 'IonAPI credentials saved and API is reachable!',
                    'data': {
                        'id': credentials.id,
                        'cn': credentials.cn,
                        'ti': credentials.ti
                    }
                }, status=201)
            else:
                return JsonResponse({
                    'error': f'API ping failed (status {ping_response.status_code}).',
                    'data': {
                        'id': credentials.id,
                        'cn': credentials.cn,
                        'ti': credentials.ti
                    }
                }, status=502)  # Bad gateway = API not reachable
        except requests.RequestException as e:
            return JsonResponse({
                'error': f'API ping failed: {str(e)}',
                'data': {
                    'id': credentials.id,
                    'cn': credentials.cn,
                    'ti': credentials.ti
                }
            }, status=502)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({'error': str(e), 'data': None}, status=400)
