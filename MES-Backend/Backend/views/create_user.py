import json
import traceback

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from ..models import UserAccount
from .generate_random_password import generate_random_password


@csrf_exempt
def create_user(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST method allowed."},
            status=405
        )

    try:
        # Read JSON or form-data
        if request.content_type and "application/json" in request.content_type:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except json.JSONDecodeError:
                return JsonResponse(
                    {"error": "Invalid JSON body."},
                    status=400
                )
        else:
            data = request.POST

        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        role = data.get("role", "operator").strip().lower()
        language = "en"
        phone_number = data.get("phone_number", "00000000").strip()

        # Required fields
        if not username:
            return JsonResponse(
                {"error": "Username is required."},
                status=400
            )

        if not email:
            return JsonResponse(
                {"error": "Email is required."},
                status=400
            )

        # Validate email format
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse(
                {"error": "Invalid email format."},
                status=400
            )

        # Validate role
        allowed_roles = ["admin", "operator", "quality", "supervisor"]

        if role not in allowed_roles:
            return JsonResponse(
                {
                    "error": "Invalid role.",
                    "allowed_roles": allowed_roles
                },
                status=400
            )

        AuthUser = get_user_model()

        # Check duplicate username
        if UserAccount.objects.filter(username__iexact=username).exists():
            return JsonResponse(
                {"error": "Username already exists."},
                status=409
            )

        if AuthUser.objects.filter(username__iexact=username).exists():
            return JsonResponse(
                {"error": "Username already exists."},
                status=409
            )

        # Check duplicate email
        if UserAccount.objects.filter(email__iexact=email).exists():
            return JsonResponse(
                {"error": f"A user with email '{email}' already exists."},
                status=409
            )

        if AuthUser.objects.filter(email__iexact=email).exists():
            return JsonResponse(
                {"error": f"A user with email '{email}' already exists."},
                status=409
            )

        # Generate password only in backend
        plain_password = generate_random_password()

        try:
            with transaction.atomic():
                auth_user = AuthUser.objects.create(
                    username=username,
                    email=email,
                )

                if hasattr(auth_user, "role"):
                    auth_user.role = role

                auth_user.set_password(plain_password)
                auth_user.save()

                user_account = UserAccount.objects.create(
                    username=username,
                    email=email,
                    role=role,
                    language=language,
                    phone_number=phone_number,
                    password=auth_user.password,  # hashed password only
                )

                subject = "Your ZUM-IT MES Account Login"
                login_url = "http://localhost:4200/login"

                message = f"""
Hello {username},

Your ZUM-IT MES account has been created successfully.

Your login credentials:

Username: {username}
Password: {plain_password}

Login here:
{login_url}

Please change your password after logging in.

Best regards,
ZUM IT Team
"""

                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )

        except Exception as mail_or_database_error:
            traceback.print_exc()
            return JsonResponse(
                {
                    "error": "User was not created because the email could not be sent.",
                    "details": str(mail_or_database_error)
                },
                status=500
            )

        return JsonResponse(
            {
                "message": "User created successfully. The password was generated and sent by email.",
                "user": {
                    "id": user_account.id,
                    "username": user_account.username,
                    "email": user_account.email,
                    "role": user_account.role,
                    "language": user_account.language,
                    "phone_number": user_account.phone_number,
                }
            },
            status=201
        )

    except Exception as e:
        traceback.print_exc()
        return JsonResponse(
            {"error": f"Server error: {str(e)}"},
            status=500
        )
