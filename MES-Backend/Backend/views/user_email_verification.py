import json
import random
import traceback
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from Backend.models import UserAccount, PendingUserVerification
from .generate_random_password import generate_random_password


ALLOWED_ROLES = ["admin", "operator", "quality", "supervisor"]
CODE_EXPIRATION_MINUTES = 10
MAX_CODE_ATTEMPTS = 5


def read_request_data(request):
    if request.content_type and "application/json" in request.content_type:
        try:
            return json.loads(request.body.decode("utf-8"))
        except json.JSONDecodeError:
            return None

    return request.POST


def validate_user_creation_data(data):
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    role = data.get("role", "operator").strip().lower()
    language = "en"
    phone_number = data.get("phone_number", "00000000").strip()

    if not username:
        return None, JsonResponse({"error": "Username is required."}, status=400)

    if not email:
        return None, JsonResponse({"error": "Email is required."}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return None, JsonResponse({"error": "Invalid email format."}, status=400)

    if role not in ALLOWED_ROLES:
        return None, JsonResponse(
            {"error": "Invalid role.", "allowed_roles": ALLOWED_ROLES},
            status=400
        )

    AuthUser = get_user_model()

    if UserAccount.objects.filter(username__iexact=username).exists():
        return None, JsonResponse({"error": "Username already exists."}, status=409)

    if AuthUser.objects.filter(username__iexact=username).exists():
        return None, JsonResponse({"error": "Username already exists."}, status=409)

    if UserAccount.objects.filter(email__iexact=email).exists():
        return None, JsonResponse(
            {"error": f"A user with email '{email}' already exists."},
            status=409
        )

    if AuthUser.objects.filter(email__iexact=email).exists():
        return None, JsonResponse(
            {"error": f"A user with email '{email}' already exists."},
            status=409
        )

    return {
        "username": username,
        "email": email,
        "role": role,
        "language": language,
        "phone_number": phone_number,
    }, None


@csrf_exempt
def send_user_verification_code(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed."}, status=405)

    try:
        data = read_request_data(request)

        if data is None:
          return JsonResponse({"error": "Invalid JSON body."}, status=400)

        validated_data, error_response = validate_user_creation_data(data)

        if error_response:
            return error_response

        code = str(random.randint(100000, 999999))

        # Remove old pending verifications for same username/email
        PendingUserVerification.objects.filter(
            email__iexact=validated_data["email"]
        ).delete()

        PendingUserVerification.objects.filter(
            username__iexact=validated_data["username"]
        ).delete()

        pending = PendingUserVerification.objects.create(
            username=validated_data["username"],
            email=validated_data["email"],
            role=validated_data["role"],
            language="en",
            phone_number=validated_data["phone_number"],
            verification_code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=CODE_EXPIRATION_MINUTES),
        )

        subject = "Verify your ZUM-IT MES email"
        message = f"""
Hello {validated_data["username"]},

A ZUM-IT MES account is being created for this email.

Your verification code is:

{code}

This code will expire in {CODE_EXPIRATION_MINUTES} minutes.

If you did not expect this email, please ignore it.

Best regards,
ZUM IT Team
"""

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[validated_data["email"]],
                fail_silently=False,
            )
        except Exception as email_error:
            pending.delete()
            traceback.print_exc()
            return JsonResponse(
                {
                    "error": "Verification code could not be sent.",
                    "details": str(email_error),
                },
                status=500
            )

        return JsonResponse(
            {
                "message": "Verification code sent successfully.",
                "verification_id": pending.id,
                "email": pending.email,
                "expires_in_minutes": CODE_EXPIRATION_MINUTES,
            },
            status=200
        )

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)


@csrf_exempt
def verify_user_and_create(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST method allowed."}, status=405)

    try:
        data = read_request_data(request)

        if data is None:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        verification_id = data.get("verification_id")
        code = str(data.get("code", "")).strip()

        if not verification_id:
            return JsonResponse({"error": "Verification ID is required."}, status=400)

        if not code:
            return JsonResponse({"error": "Verification code is required."}, status=400)

        try:
            pending = PendingUserVerification.objects.get(id=verification_id)
        except PendingUserVerification.DoesNotExist:
            return JsonResponse(
                {"error": "Verification request not found. Please request a new code."},
                status=404
            )

        if pending.is_expired():
            pending.delete()
            return JsonResponse(
                {"error": "Verification code expired. Please request a new code."},
                status=400
            )

        if pending.attempts >= MAX_CODE_ATTEMPTS:
            pending.delete()
            return JsonResponse(
                {"error": "Too many failed attempts. Please request a new code."},
                status=400
            )

        if not check_password(code, pending.verification_code_hash):
            pending.attempts += 1
            pending.save()

            remaining_attempts = MAX_CODE_ATTEMPTS - pending.attempts

            return JsonResponse(
                {
                    "error": "Invalid verification code.",
                    "remaining_attempts": remaining_attempts,
                },
                status=400
            )

        AuthUser = get_user_model()

        # Re-check duplicates before creation
        if UserAccount.objects.filter(username__iexact=pending.username).exists():
            return JsonResponse({"error": "Username already exists."}, status=409)

        if AuthUser.objects.filter(username__iexact=pending.username).exists():
            return JsonResponse({"error": "Username already exists."}, status=409)

        if UserAccount.objects.filter(email__iexact=pending.email).exists():
            return JsonResponse(
                {"error": f"A user with email '{pending.email}' already exists."},
                status=409
            )

        if AuthUser.objects.filter(email__iexact=pending.email).exists():
            return JsonResponse(
                {"error": f"A user with email '{pending.email}' already exists."},
                status=409
            )

        plain_password = generate_random_password()

        try:
            with transaction.atomic():
                auth_user = AuthUser.objects.create(
                    username=pending.username,
                    email=pending.email,
                )

                if hasattr(auth_user, "role"):
                    auth_user.role = pending.role

                auth_user.set_password(plain_password)
                auth_user.save()

                user_account = UserAccount.objects.create(
                    username=pending.username,
                    email=pending.email,
                    role=pending.role,
                    language="en",
                    phone_number=pending.phone_number,
                    password=auth_user.password,
                )

                login_url = "http://localhost:4200/login"

                subject = "Your ZUM-IT MES Account Login"

                message = f"""
Hello {pending.username},

Your ZUM-IT MES account has been created successfully.

Your login credentials:

Username: {pending.username}
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
                    recipient_list=[pending.email],
                    fail_silently=False,
                )

                pending.delete()

        except Exception as mail_or_database_error:
            traceback.print_exc()
            return JsonResponse(
                {
                    "error": "User was not created because the account email could not be sent.",
                    "details": str(mail_or_database_error),
                },
                status=500
            )

        return JsonResponse(
            {
                "message": "Email verified and user created successfully.",
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
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)
