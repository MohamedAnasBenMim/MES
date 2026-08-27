# views.py
import json
import random
import string
import traceback

import requests  # type: ignore
from Backend.models import IonAPICredentials
from Backend.utils.token_manager import get_mingle_token
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view  # type: ignore
from rest_framework.response import Response  # type: ignore

from ..models import UserAccount


def get_ionapi_credential(request):
    if request.method == "GET":
        record = IonAPICredentials.objects.order_by("-created_at").first()
        if record:
            data = {
                "id": record.id,
                "ti": record.ti,
                "cn": record.cn,
                "dt": record.dt,
                "ci": record.ci,
                "cs": record.cs,
                "iu": record.iu,
                "pu": record.pu,
                "oa": record.oa,
                "ot": record.ot,
                "or": record.or_field,
                "sc": record.sc,
                "ev": record.ev,
                "v": record.v,
                "company": record.company,
                "created_at": record.created_at,
                "filename": record.filename,
            }
            return JsonResponse(data)
        else:
            return JsonResponse({"error": "No records found"}, status=404)
