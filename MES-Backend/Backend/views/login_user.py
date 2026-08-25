from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import check_password
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from Backend.models import MESDevice, UserAccount, UserSessionLog


MAX_FAILED_LOGIN_ATTEMPTS = 3


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")

    return ip


def is_admin_user(auth_user=None, user_account=None):
    if auth_user is not None:
        if auth_user.is_superuser or auth_user.is_staff:
            return True

        auth_role = getattr(auth_user, "role", "")
        if str(auth_role).lower() == "admin":
            return True

    if user_account is not None:
        if str(user_account.role).lower() == "admin":
            return True

    return False


def find_auth_user_and_account(username):
    User = get_user_model()

    auth_user = None
    user_account = None

    if "@" in username:
        auth_user = User.objects.filter(email__iexact=username).first()
        user_account = UserAccount.objects.filter(email__iexact=username).first()
    else:
        auth_user = User.objects.filter(username__iexact=username).first()
        user_account = UserAccount.objects.filter(username__iexact=username).first()

    if auth_user and not user_account:
        user_account = (
            UserAccount.objects.filter(username__iexact=auth_user.username).first()
            or UserAccount.objects.filter(email__iexact=auth_user.email).first()
        )

    if user_account and not auth_user:
        auth_user = (
            User.objects.filter(username__iexact=user_account.username).first()
            or User.objects.filter(email__iexact=user_account.email).first()
        )

    return auth_user, user_account


def register_failed_login_attempt(auth_user=None, user_account=None):
    if is_admin_user(auth_user, user_account):
        return {
            "locked": False,
            "attempts": 0,
            "remaining": MAX_FAILED_LOGIN_ATTEMPTS,
            "message": "Invalid username or password",
        }

    if user_account is None:
        return {
            "locked": False,
            "attempts": 0,
            "remaining": MAX_FAILED_LOGIN_ATTEMPTS,
            "message": "Invalid username or password",
        }

    user_account.failed_login_attempts += 1
    user_account.last_failed_login = timezone.now()

    remaining_attempts = MAX_FAILED_LOGIN_ATTEMPTS - user_account.failed_login_attempts

    if user_account.failed_login_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
        user_account.is_active = False
        user_account.save()

        if auth_user:
            auth_user.is_active = False
            auth_user.save()

        active_sessions = UserSessionLog.objects.filter(
            username__iexact=user_account.username,
            is_active=True
        )

        for session in active_sessions:
            session.logout_time = timezone.now()
            session.last_activity = timezone.now()
            session.is_active = False
            session.duration_seconds = session.calculate_duration_seconds()
            session.save()

        return {
            "locked": True,
            "attempts": user_account.failed_login_attempts,
            "remaining": 0,
            "message": "Your account has been deactivated after 3 failed login attempts. Please contact the administrator.",
        }

    user_account.save()

    return {
        "locked": False,
        "attempts": user_account.failed_login_attempts,
        "remaining": remaining_attempts,
        "message": f"Invalid username or password. Remaining attempts: {remaining_attempts}",
    }


def reset_failed_login_attempts(user_account=None):
    if user_account:
        user_account.failed_login_attempts = 0
        user_account.last_failed_login = None
        user_account.save()


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    device_id = str(request.data.get("device_id", "")).strip()

    print("LOGIN USERNAME RECEIVED:", username)

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    User = get_user_model()

    auth_user_candidate, user_account = find_auth_user_and_account(username)

    if auth_user_candidate and not auth_user_candidate.is_active:
        return Response(
            {"error": "This account is deactivated. Please contact the administrator."},
            status=status.HTTP_403_FORBIDDEN
        )

    if user_account and not user_account.is_active:
        return Response(
            {"error": "This account is deactivated. Please contact the administrator."},
            status=status.HTTP_403_FORBIDDEN
        )

    login_username = username

    if auth_user_candidate:
        login_username = auth_user_candidate.username

    user = authenticate(username=login_username, password=password)

    print("AUTHENTICATED USER:", user)

    valid_user_account_login = False

    if user is None and user_account:
        if check_password(password, user_account.password):
            valid_user_account_login = True

    if user is None and not valid_user_account_login:
        failed_result = register_failed_login_attempt(
            auth_user=auth_user_candidate,
            user_account=user_account
        )

        return Response(
            {
                "error": failed_result["message"],
                "failed_login_attempts": failed_result["attempts"],
                "remaining_attempts": failed_result["remaining"],
                "account_locked": failed_result["locked"],
            },
            status=status.HTTP_403_FORBIDDEN if failed_result["locked"] else status.HTTP_401_UNAUTHORIZED
        )

    if user is not None and not user.is_active:
        return Response(
            {"error": "This account is deactivated. Please contact the administrator."},
            status=status.HTTP_403_FORBIDDEN
        )

    if user is not None:
        user_account = (
            UserAccount.objects.filter(username__iexact=user.username).first()
            or UserAccount.objects.filter(email__iexact=user.email).first()
            or user_account
        )

    if user_account is not None and not user_account.is_active:
        return Response(
            {"error": "This account is deactivated. Please contact the administrator."},
            status=status.HTTP_403_FORBIDDEN
        )

    role = ""

    if user_account is not None:
        role = user_account.role or ""

    if user is not None and not role:
        role = getattr(user, "role", "") or ""

    if user is not None and (user.is_superuser or user.is_staff):
        role = "admin"

    role = role.lower()

    response_user = user_account or user

    login_time = timezone.now()
    device = None

    if device_id:
        device = MESDevice.objects.filter(device_id__iexact=device_id).first()

        if device and device.status == "disabled":
            return Response(
                {"error": "This device is disabled."},
                status=status.HTTP_403_FORBIDDEN
            )

        if device:
            device.last_login = login_time
            device.last_seen = login_time
            device.ip_address = get_client_ip(request)
            device.last_updated_by = response_user.username
            device.save(
                update_fields=[
                    "last_login",
                    "last_seen",
                    "ip_address",
                    "last_updated_by",
                    "last_updated_date",
                ]
            )

    preferred_language = "en"
    if user_account is not None:
        if user_account.language != "en":
            user_account.language = "en"
            user_account.save(update_fields=["language", "modified_at"])

    reset_failed_login_attempts(user_account)

    old_sessions = UserSessionLog.objects.filter(
        username__iexact=response_user.username,
        is_active=True
    )

    for old_session in old_sessions:
        old_session.logout_time = timezone.now()
        old_session.last_activity = timezone.now()
        old_session.is_active = False
        old_session.duration_seconds = old_session.calculate_duration_seconds()
        old_session.save()

    session_log = UserSessionLog.objects.create(
        username=response_user.username,
        email=response_user.email,
        role=role,
        login_time=login_time,
        last_activity=login_time,
        is_active=True,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", ""),
    )

    return Response(
        {
            "message": "Login successful",
            "session_id": session_log.id,
            "device_id": device.device_id if device else device_id,
            "device_last_login": device.last_login if device else None,
            "device_last_seen": device.last_seen if device else None,
            "user": {
                "id": response_user.id,
                "username": response_user.username,
                "email": response_user.email,
                "role": role,
                "language": preferred_language,
                "preferred_language": preferred_language,
                "is_staff": bool(user and user.is_staff),
                "is_superuser": bool(user and user.is_superuser),
                "is_active": bool(user_account.is_active if user_account else user.is_active),
            },
        },
        status=status.HTTP_200_OK
    )
