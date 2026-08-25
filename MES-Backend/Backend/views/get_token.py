# views.py
from rest_framework.decorators import api_view # type: ignore
from rest_framework.response import Response # type: ignore
import requests  # type: ignore
from Backend.utils.token_manager import get_mingle_token
from django.http import JsonResponse
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def get_token(request):
    try:
        token = get_mingle_token()
    except Exception as e:
        return Response({"error": "Token fetch failed", "details": str(e)}, status=500)

    return JsonResponse({'access_token': token})