from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from Backend.models import UserAccount, UserSessionLog

SUPPORTED_LANGUAGES = {"en"}
SUPPORTED_DATE_FORMATS = {"dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"}
SUPPORTED_TIME_FORMATS = {"12h", "24h"}
SUPPORTED_THEMES = {"light", "dark"}
LANGUAGE_ALIASES = {
    "english": "en", "french": "en", "german": "en",
    "deutsch": "en", "dutch": "en", "nederlands": "en",
}
MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def normalize_language(value):
    return "en"


def normalize_theme(value):
    return "dark" if str(value or "").strip().lower() == "dark" else "light"


def image_url(request, account):
    if not account.profile_image:
        return None
    return request.build_absolute_uri(account.profile_image.url)


def serialize_settings(request, account):
    return {
        "id": account.id,
        "username": account.username,
        "email": account.email,
        "role": account.role,
        "display_name": account.display_name or account.username,
        "job_title": account.job_title or "",
        "profile_image": image_url(request, account),
        "language": normalize_language(account.language),
        "timezone": account.timezone or "Africa/Tunis",
        "country": (account.country or "TN").upper(),
        "date_format": account.date_format or "dd/MM/yyyy",
        "time_format": account.time_format or "24h",
        "theme": normalize_theme(account.theme),
    }


def get_current_account(request):
    source = request.query_params if request.method == "GET" else request.data
    session_id = source.get("session_id")
    if not session_id:
        return None, Response({"error": "Active session is required."}, status=401)

    session = UserSessionLog.objects.filter(id=session_id, is_active=True).first()
    if not session:
        return None, Response({"error": "Session expired. Please login again."}, status=401)

    account = (
        UserAccount.objects.filter(username__iexact=session.username).first()
        or UserAccount.objects.filter(email__iexact=session.email).first()
    )
    if not account:
        return None, Response({"error": "User account not found."}, status=404)

    return account, None


def validate_timezone(value):
    value = str(value or "Africa/Tunis").strip()
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError:
        return None
    return value


@api_view(["GET", "PUT"])
@parser_classes([JSONParser, FormParser, MultiPartParser])
def user_settings(request):
    account, error_response = get_current_account(request)
    if error_response:
        return error_response

    if request.method == "GET":
        normalized_language = normalize_language(account.language)
        if account.language != normalized_language:
            account.language = normalized_language
            account.save(update_fields=["language", "modified_at"])
        return Response(serialize_settings(request, account), status=200)

    display_name = str(request.data.get("display_name", account.display_name or account.username)).strip()
    job_title = str(request.data.get("job_title", account.job_title or "")).strip()
    language = normalize_language(request.data.get("language", account.language))
    timezone_name = validate_timezone(request.data.get("timezone", account.timezone))
    country = str(request.data.get("country", account.country or "TN")).strip().upper()
    date_format = str(request.data.get("date_format", account.date_format or "dd/MM/yyyy")).strip()
    time_format = str(request.data.get("time_format", account.time_format or "24h")).strip()
    theme = normalize_theme(request.data.get("theme", account.theme or "light"))

    errors = {}
    if not display_name:
        errors["display_name"] = "Display name is required."
    elif len(display_name) > 150:
        errors["display_name"] = "Display name cannot exceed 150 characters."
    if len(job_title) > 50:
        errors["job_title"] = "Job title cannot exceed 50 characters."
    if timezone_name is None:
        errors["timezone"] = "Unsupported time zone."
    if not re_full_country(country):
        errors["country"] = "Country must be a valid two-letter code."
    if date_format not in SUPPORTED_DATE_FORMATS:
        errors["date_format"] = "Unsupported date format."
    if time_format not in SUPPORTED_TIME_FORMATS:
        errors["time_format"] = "Unsupported time format."
    if theme not in SUPPORTED_THEMES:
        errors["theme"] = "Unsupported theme."

    profile_image = request.FILES.get("profile_image")
    remove_profile_image = str(request.data.get("remove_profile_image", "false")).lower() == "true"
    if profile_image:
        if profile_image.size > MAX_PROFILE_IMAGE_SIZE:
            errors["profile_image"] = "Profile picture cannot exceed 5 MB."
        elif profile_image.content_type not in ALLOWED_IMAGE_TYPES:
            errors["profile_image"] = "Only JPG, PNG, WEBP, and GIF images are allowed."

    if errors:
        return Response({"errors": errors}, status=400)

    account.display_name = display_name
    account.job_title = job_title
    account.language = language
    account.timezone = timezone_name
    account.country = country
    account.date_format = date_format
    account.time_format = time_format
    account.theme = theme

    if remove_profile_image and account.profile_image:
        account.profile_image.delete(save=False)
        account.profile_image = None
    if profile_image:
        if account.profile_image:
            account.profile_image.delete(save=False)
        account.profile_image = profile_image

    account.save()
    return Response({"success": True, **serialize_settings(request, account)}, status=200)


def re_full_country(value):
    return len(value) == 2 and value.isalpha()
