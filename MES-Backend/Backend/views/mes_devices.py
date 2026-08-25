from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from Backend.models import MESDevice, UserAccount


MANDATORY_FIELDS = [
    "device_name",
    "device_type",
    "mac_address",
]

OPTIONAL_FIELDS = [
    "device_id",
    "ip_address",
]

DEVICE_TYPES = [
    "PC",
    "Tablet",
    "Scanner",
]


def get_request_username(request):
    return (
        request.data.get("username")
        or request.query_params.get("username")
        or ""
    ).strip()


def is_admin_request(request):
    username = get_request_username(request)

    if not username:
        return False

    return UserAccount.objects.filter(
        username__iexact=username,
        role__iexact="admin",
    ).exists()


def serialize_device(device):
    return {
        "id": device.id,
        "device_id": device.device_id,
        "device_name": device.device_name,
        "device_type": device.device_type,
        "mac_address": device.mac_address,
        "ip_address": device.ip_address,
        "status": device.status,
        "last_login": device.last_login,
        "last_seen": device.last_seen,
        "disabled_date": device.disabled_date,
        "disabled_by": device.disabled_by,
        "disable_reason": device.disable_reason,
        "created_date": device.created_date,
        "created_by": device.created_by,
        "last_updated_date": device.last_updated_date,
        "last_updated_by": device.last_updated_by,
    }


def normalize_mac_address(value):
    return str(value or "").strip().upper()


def clean_payload(data):
    cleaned = {}

    for field in MANDATORY_FIELDS + OPTIONAL_FIELDS:
        value = str(data.get(field, "")).strip()

        if field in MANDATORY_FIELDS and not value:
            return None, f"{field} is required."

        if len(value) > 100:
            return None, f"{field} must not exceed 100 characters."

        cleaned[field] = value

    cleaned["mac_address"] = normalize_mac_address(cleaned["mac_address"])

    if cleaned["device_type"] not in DEVICE_TYPES:
        return None, "Device Type must be PC, Tablet, or Scanner."

    return cleaned, None


def generate_device_id():
    last_device = MESDevice.objects.order_by("-id").first()
    next_id = (last_device.id + 1) if last_device else 1
    return f"DEV-{next_id:06d}"

@api_view(["GET", "POST"])
def mes_devices(request):
    if not is_admin_request(request):
        return Response(
            {"error": "Only admin users can manage MES devices."},
            status=status.HTTP_403_FORBIDDEN,
        )

    username = get_request_username(request)

    if request.method == "GET":
        devices = MESDevice.objects.all().order_by("device_name")

        search = request.query_params.get("search", "").strip()
        device_status = request.query_params.get("status", "").strip().lower()

        if search:
            devices = devices.filter(device_name__icontains=search)

        if device_status in ["active", "disabled"]:
            devices = devices.filter(status=device_status)

        return Response(
            [serialize_device(device) for device in devices],
            status=status.HTTP_200_OK,
        )

    cleaned, error = clean_payload(request.data)

    if error:
        return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

    device_id = cleaned.get("device_id") or generate_device_id()

    if MESDevice.objects.filter(device_id__iexact=device_id).exists():
        return Response(
            {"error": "Device ID already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if MESDevice.objects.filter(mac_address__iexact=cleaned["mac_address"]).exists():
        return Response(
            {"error": "MAC Address already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    device = MESDevice.objects.create(
        device_id=device_id,
        device_name=cleaned["device_name"],
        device_type=cleaned["device_type"],
        mac_address=cleaned["mac_address"],
        ip_address=cleaned.get("ip_address") or None,
        status="active",
        created_by=username,
        last_updated_by=username,
    )

    return Response(
        {
            "message": "MES device created successfully.",
            "data": serialize_device(device),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PUT"])
def mes_device_detail(request, device_id):
    if not is_admin_request(request):
        return Response(
            {"error": "Only admin users can manage MES devices."},
            status=status.HTTP_403_FORBIDDEN,
        )

    device = MESDevice.objects.filter(id=device_id).first()

    if not device:
        return Response(
            {"error": "MES device not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(serialize_device(device), status=status.HTTP_200_OK)

    cleaned, error = clean_payload(request.data)

    if error:
        return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

    new_device_id = cleaned.get("device_id") or device.device_id

    if MESDevice.objects.filter(device_id__iexact=new_device_id).exclude(id=device.id).exists():
        return Response(
            {"error": "Device ID already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if MESDevice.objects.filter(mac_address__iexact=cleaned["mac_address"]).exclude(id=device.id).exists():
        return Response(
            {"error": "MAC Address already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    device.device_id = new_device_id
    device.device_name = cleaned["device_name"]
    device.device_type = cleaned["device_type"]
    device.mac_address = cleaned["mac_address"]
    device.ip_address = cleaned.get("ip_address") or None
    device.last_updated_by = get_request_username(request)
    device.save()

    return Response(
        {
            "message": "MES device updated successfully.",
            "data": serialize_device(device),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def disable_mes_device(request, device_id):
    if not is_admin_request(request):
        return Response(
            {"error": "Only admin users can disable MES devices."},
            status=status.HTTP_403_FORBIDDEN,
        )

    reason = str(request.data.get("disable_reason", "")).strip()

    if not reason:
        return Response(
            {"error": "Disable reason is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    device = MESDevice.objects.filter(id=device_id).first()

    if not device:
        return Response(
            {"error": "MES device not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    username = get_request_username(request)

    device.status = "disabled"
    device.disabled_date = timezone.now()
    device.disabled_by = username
    device.disable_reason = reason
    device.last_updated_by = username
    device.save()

    return Response(
        {
            "message": "MES device disabled successfully.",
            "data": serialize_device(device),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def enable_mes_device(request, device_id):
    if not is_admin_request(request):
        return Response(
            {"error": "Only admin users can enable MES devices."},
            status=status.HTTP_403_FORBIDDEN,
        )

    device = MESDevice.objects.filter(id=device_id).first()

    if not device:
        return Response(
            {"error": "MES device not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    device.status = "active"
    device.last_updated_by = get_request_username(request)
    device.save()

    return Response(
        {
            "message": "MES device enabled successfully.",
            "data": serialize_device(device),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def update_mes_device_last_seen(request):
    device_id = str(request.data.get("device_id", "")).strip()

    if not device_id:
        return Response(
            {"error": "Device ID is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    device = MESDevice.objects.filter(device_id__iexact=device_id).first()

    if not device:
        return Response(
            {"error": "MES device not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if device.status == "disabled":
        return Response(
            {"error": "This device is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    device.last_seen = timezone.now()
    device.save(update_fields=["last_seen"])

    return Response(
        {
            "message": "MES device last seen updated successfully.",
            "data": serialize_device(device),
        },
        status=status.HTTP_200_OK,
    )