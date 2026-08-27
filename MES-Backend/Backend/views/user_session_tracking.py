from datetime import timedelta

from Backend.models import MESDevice, UserSessionLog
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

ONLINE_THRESHOLD_SECONDS = 120


def format_duration(seconds):
    seconds = int(seconds or 0)

    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    remaining_seconds = seconds % 60

    if hours > 0:
        return f"{hours}h {minutes}min"

    if minutes > 0:
        return f"{minutes}min {remaining_seconds}s"

    return f"{remaining_seconds}s"


def get_session_status(session):
    if not session.is_active:
        return "Offline"

    if not session.last_activity:
        return "Inactive"

    limit_time = timezone.now() - timedelta(seconds=ONLINE_THRESHOLD_SECONDS)

    if session.last_activity >= limit_time:
        return "Online"

    return "Inactive"


def get_current_duration_seconds(session):
    if session.is_active:
        return session.calculate_duration_seconds()

    return session.duration_seconds or session.calculate_duration_seconds()


@api_view(["POST"])
@permission_classes([AllowAny])
def user_session_heartbeat(request):
    session_id = request.data.get("session_id")
    username = request.data.get("username", "").strip()
    device_id = str(request.data.get("device_id", "")).strip()

    if not session_id and not username:
        return Response(
            {"error": "session_id or username is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session = None

    if session_id:
        session = UserSessionLog.objects.filter(id=session_id).first()

    if session is None and username:
        session = (
            UserSessionLog.objects.filter(username__iexact=username, is_active=True)
            .order_by("-login_time")
            .first()
        )

    if session is None:
        return Response(
            {"error": "Active session not found"}, status=status.HTTP_404_NOT_FOUND
        )

    now = timezone.now()

    session.last_activity = now
    session.is_active = True
    session.duration_seconds = session.calculate_duration_seconds()
    session.save()

    device = None

    if device_id:
        device = MESDevice.objects.filter(device_id__iexact=device_id).first()

        if device and device.status == "disabled":
            return Response(
                {"error": "This device is disabled."}, status=status.HTTP_403_FORBIDDEN
            )

        if device:
            device.last_seen = now
            device.save(update_fields=["last_seen"])

    return Response(
        {
            "message": "Heartbeat updated",
            "session_id": session.id,
            "username": session.username,
            "last_activity": session.last_activity,
            "duration_seconds": session.duration_seconds,
            "duration_display": format_duration(session.duration_seconds),
            "status": get_session_status(session),
            "device_id": device.device_id if device else device_id,
            "device_last_seen": device.last_seen if device else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def user_session_logout(request):
    session_id = request.data.get("session_id")
    username = request.data.get("username", "").strip()

    if not session_id and not username:
        return Response(
            {"error": "session_id or username is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session = None

    if session_id:
        session = UserSessionLog.objects.filter(id=session_id).first()

    if session is None and username:
        session = (
            UserSessionLog.objects.filter(username__iexact=username, is_active=True)
            .order_by("-login_time")
            .first()
        )

    if session is None:
        return Response(
            {"error": "Active session not found"}, status=status.HTTP_404_NOT_FOUND
        )

    session.close_session()

    return Response(
        {
            "message": "Session closed",
            "session_id": session.id,
            "username": session.username,
            "logout_time": session.logout_time,
            "duration_seconds": session.duration_seconds,
            "duration_display": format_duration(session.duration_seconds),
            "status": "Offline",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def user_session_activity(request):
    limit = int(request.query_params.get("limit", 30))

    sessions = UserSessionLog.objects.all().order_by("-login_time")[:limit]

    data = []

    for session in sessions:
        duration_seconds = get_current_duration_seconds(session)
        session_status = get_session_status(session)

        data.append(
            {
                "id": session.id,
                "username": session.username,
                "email": session.email,
                "role": session.role,
                "login_time": session.login_time,
                "logout_time": session.logout_time,
                "last_activity": session.last_activity,
                "duration_seconds": duration_seconds,
                "duration_display": format_duration(duration_seconds),
                "status": session_status,
                "is_active": session.is_active,
                "ip_address": session.ip_address,
            }
        )

    return Response(data, status=status.HTTP_200_OK)
