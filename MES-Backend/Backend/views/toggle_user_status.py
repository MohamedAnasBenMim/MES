from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from Backend.models import UserAccount, UserSessionLog


@api_view(["POST"])
def toggle_user_status(request, user_id):
    try:
        user_account = UserAccount.objects.get(id=user_id)
    except UserAccount.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    user_account.is_active = not user_account.is_active

    if user_account.is_active:
        user_account.failed_login_attempts = 0
        user_account.last_failed_login = None

    user_account.save()

    AuthUser = get_user_model()

    auth_user = (
        AuthUser.objects.filter(username__iexact=user_account.username).first()
        or AuthUser.objects.filter(email__iexact=user_account.email).first()
    )

    if auth_user:
        auth_user.is_active = user_account.is_active
        auth_user.save()

    if not user_account.is_active:
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

    return Response(
        {
            "message": (
                "User reactivated successfully"
                if user_account.is_active
                else "User deactivated successfully"
            ),
            "user": {
                "id": user_account.id,
                "username": user_account.username,
                "email": user_account.email,
                "role": user_account.role,
                "is_active": user_account.is_active,
                "failed_login_attempts": user_account.failed_login_attempts,
            }
        },
        status=status.HTTP_200_OK
    )