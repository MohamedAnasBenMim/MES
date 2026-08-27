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


def generate_random_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(random.choices(chars, k=length))
