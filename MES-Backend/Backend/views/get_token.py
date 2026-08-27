# views.py
import requests  # type: ignore
from Backend.utils.token_manager import get_mingle_token
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view  # type: ignore
from rest_framework.response import Response  # type: ignore


@api_view(["GET"])
def get_token(request):
    try:
        token = get_mingle_token()
    except Exception as e:
        return Response({"error": "Token fetch failed", "details": str(e)}, status=500)

    return JsonResponse({"access_token": token})
