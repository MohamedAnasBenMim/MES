import json
import random
import traceback
from datetime import timedelta

from Backend.models import PendingPasswordChange, UserAccount, UserSessionLog
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

CODE_EXPIRATION_MINUTES = 10
MAX_CODE_ATTEMPTS = 5


def read_json_body(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except (
        json.JSONDecodeError,
        UnicodeDecodeError,
    ):
        return None


def find_auth_user(username, email=""):
    User = get_user_model()

    auth_user = None

    if username:
        auth_user = User.objects.filter(username__iexact=username).first()

    if not auth_user and email:
        auth_user = User.objects.filter(email__iexact=email).first()

    return auth_user


def find_user_account(auth_user, username, email=""):
    account = None

    if username:
        account = UserAccount.objects.filter(username__iexact=username).first()

    if not account and email:
        account = UserAccount.objects.filter(email__iexact=email).first()

    if not account and auth_user:
        account = UserAccount.objects.filter(
            username__iexact=auth_user.username
        ).first()

    if not account and auth_user and auth_user.email:
        account = UserAccount.objects.filter(email__iexact=auth_user.email).first()

    return account


def mask_email(email):
    if not email or "@" not in email:
        return email

    local_part, domain = email.split("@", 1)

    if len(local_part) <= 2:
        masked_local = local_part[0] + "*" if local_part else "*"
    else:
        masked_local = local_part[0] + ("*" * (len(local_part) - 2)) + local_part[-1]

    return f"{masked_local}@{domain}"


@csrf_exempt
def request_profile_password_change_code(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": ("Only POST method allowed.")},
            status=405,
        )

    try:
        data = read_json_body(request)

        if data is None:
            return JsonResponse(
                {"error": ("Invalid JSON body.")},
                status=400,
            )

        username = str(data.get("username", "")).strip()

        email = str(data.get("email", "")).strip()

        old_password = str(data.get("old_password", ""))

        new_password = str(data.get("new_password", ""))

        confirm_password = str(data.get("confirm_password", ""))

        if not username and not email:
            return JsonResponse(
                {"error": ("Username or email is required.")},
                status=400,
            )

        if not old_password:
            return JsonResponse(
                {"error": ("Old password is required.")},
                status=400,
            )

        if not new_password:
            return JsonResponse(
                {"error": ("New password is required.")},
                status=400,
            )

        if new_password != confirm_password:
            return JsonResponse(
                {"error": ("New password and confirmation " "do not match.")},
                status=400,
            )

        auth_user = find_auth_user(
            username,
            email,
        )

        if not auth_user:
            return JsonResponse(
                {"error": "User not found."},
                status=404,
            )

        if not auth_user.is_active:
            return JsonResponse(
                {"error": ("This account is inactive.")},
                status=403,
            )

        if not auth_user.check_password(old_password):
            return JsonResponse(
                {"error": ("Old password is incorrect.")},
                status=401,
            )

        if auth_user.check_password(new_password):
            return JsonResponse(
                {
                    "error": (
                        "The new password must be " "different from the old password."
                    )
                },
                status=400,
            )

        try:
            validate_password(
                new_password,
                user=auth_user,
            )
        except ValidationError as error:
            return JsonResponse(
                {"error": " ".join(error.messages)},
                status=400,
            )

        account = find_user_account(
            auth_user,
            username,
            email,
        )

        recipient_email = (
            account.email if account and account.email else auth_user.email
        )

        if not recipient_email:
            return JsonResponse(
                {"error": ("No email address is associated " "with this account.")},
                status=400,
            )

        code = str(
            random.randint(
                100000,
                999999,
            )
        )

        PendingPasswordChange.objects.filter(
            username__iexact=auth_user.username
        ).delete()

        PendingPasswordChange.objects.filter(email__iexact=recipient_email).delete()

        pending = PendingPasswordChange.objects.create(
            username=auth_user.username,
            email=recipient_email,
            new_password_hash=make_password(new_password),
            verification_code_hash=make_password(code),
            expires_at=(timezone.now() + timedelta(minutes=(CODE_EXPIRATION_MINUTES))),
        )

        subject = "Verify your ZUM-IT MES " "password change"

        message = f"""
Hello {auth_user.username},

A request was made to change the password of your ZUM-IT MES account.

Your verification code is:

{code}

This code expires in {CODE_EXPIRATION_MINUTES} minutes.

If you did not request this password change, please ignore this email and contact the administrator.

Best regards,
ZUM IT Team
"""

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=(settings.DEFAULT_FROM_EMAIL),
                recipient_list=[recipient_email],
                fail_silently=False,
            )
        except Exception as email_error:
            pending.delete()

            traceback.print_exc()

            return JsonResponse(
                {
                    "error": ("The verification code " "could not be sent."),
                    "details": str(email_error),
                },
                status=500,
            )

        return JsonResponse(
            {
                "message": ("Verification code sent " "successfully."),
                "verification_id": pending.id,
                "email": recipient_email,
                "masked_email": mask_email(recipient_email),
                "expires_in_minutes": (CODE_EXPIRATION_MINUTES),
            },
            status=200,
        )

    except Exception as error:
        traceback.print_exc()

        return JsonResponse(
            {"error": (f"Server error: {str(error)}")},
            status=500,
        )


@csrf_exempt
def verify_profile_password_change_code(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": ("Only POST method allowed.")},
            status=405,
        )

    try:
        data = read_json_body(request)

        if data is None:
            return JsonResponse(
                {"error": ("Invalid JSON body.")},
                status=400,
            )

        verification_id = data.get("verification_id")

        code = str(data.get("code", "")).strip()

        if not verification_id:
            return JsonResponse(
                {"error": ("Verification ID is required.")},
                status=400,
            )

        if not code:
            return JsonResponse(
                {"error": ("Verification code is required.")},
                status=400,
            )

        if not code.isdigit() or len(code) != 6:
            return JsonResponse(
                {"error": ("Verification code must contain " "exactly 6 digits.")},
                status=400,
            )

        try:
            pending = PendingPasswordChange.objects.get(id=verification_id)
        except PendingPasswordChange.DoesNotExist:
            return JsonResponse(
                {
                    "error": (
                        "Verification request not found. " "Please request a new code."
                    )
                },
                status=404,
            )

        if pending.is_expired():
            pending.delete()

            return JsonResponse(
                {"error": ("Verification code expired. " "Please request a new code.")},
                status=400,
            )

        if pending.attempts >= MAX_CODE_ATTEMPTS:
            pending.delete()

            return JsonResponse(
                {"error": ("Too many failed attempts. " "Please request a new code.")},
                status=400,
            )

        if not check_password(
            code,
            pending.verification_code_hash,
        ):
            pending.attempts += 1
            pending.save(
                update_fields=[
                    "attempts",
                    "updated_at",
                ]
            )

            remaining_attempts = max(
                MAX_CODE_ATTEMPTS - pending.attempts,
                0,
            )

            if remaining_attempts == 0:
                pending.delete()

            return JsonResponse(
                {
                    "error": ("Invalid verification code."),
                    "remaining_attempts": (remaining_attempts),
                },
                status=400,
            )

        auth_user = find_auth_user(
            pending.username,
            pending.email,
        )

        if not auth_user:
            pending.delete()

            return JsonResponse(
                {"error": "User not found."},
                status=404,
            )

        account = find_user_account(
            auth_user,
            pending.username,
            pending.email,
        )

        with transaction.atomic():
            auth_user.password = pending.new_password_hash

            auth_user.save(update_fields=["password"])

            if account:
                account.password = pending.new_password_hash

                account.save(
                    update_fields=[
                        "password",
                        "modified_at",
                    ]
                )

            active_sessions = UserSessionLog.objects.filter(
                username__iexact=(auth_user.username),
                is_active=True,
            )

            for session in active_sessions:
                session.close_session()

            pending.delete()

        return JsonResponse(
            {"message": ("Password changed successfully. " "Please login again.")},
            status=200,
        )

    except Exception as error:
        traceback.print_exc()

        return JsonResponse(
            {"error": (f"Server error: {str(error)}")},
            status=500,
        )
