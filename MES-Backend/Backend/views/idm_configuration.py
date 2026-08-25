from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from Backend.models import IDMConfiguration, UserAccount


MANDATORY_FIELDS = [
    "document",
    "document_type",
    "entity_type",
    "entity_type_value",
    "accounting_entity",
    "accounting_entity_value",
    "invoice_number",
    "financial_company",
]

OPTIONAL_FIELDS = [
    "location",
    "location_value",
    "transaction_type",
]

ALL_FIELDS = MANDATORY_FIELDS + OPTIONAL_FIELDS


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


def serialize_idm_config(config):
    return {
        "id": config.id,
        "document": config.document,
        "document_type": config.document_type,
        "entity_type": config.entity_type,
        "entity_type_value": config.entity_type_value,
        "accounting_entity": config.accounting_entity,
        "accounting_entity_value": config.accounting_entity_value,
        "location": config.location,
        "location_value": config.location_value,
        "invoice_number": config.invoice_number,
        "transaction_type": config.transaction_type,
        "financial_company": config.financial_company,
        "created_by": config.created_by,
        "created_date": config.created_date,
        "modified_by": config.modified_by,
        "modified_date": config.modified_date,
    }


def clean_payload(data):
    cleaned = {}

    for field in ALL_FIELDS:
        value = str(data.get(field, "")).strip()

        if field in MANDATORY_FIELDS and not value:
            return None, f"{field} is required."

        if len(value) > 100:
            return None, f"{field} must not exceed 100 characters."

        cleaned[field] = value

    return cleaned, None


@api_view(["GET", "POST"])
def idm_configurations(request):
    if not is_admin_request(request):
        return Response(
            {"error": "Only admin users can access IDM configuration."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        configs = IDMConfiguration.objects.all().order_by("document_type")

        return Response(
            [serialize_idm_config(config) for config in configs],
            status=status.HTTP_200_OK,
        )

    cleaned, error = clean_payload(request.data)

    if error:
        return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

    if IDMConfiguration.objects.filter(
        document_type__iexact=cleaned["document_type"]
    ).exists():
        return Response(
            {"error": "Document Type already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    username = get_request_username(request)

    config = IDMConfiguration.objects.create(
        **cleaned,
        created_by=username,
        modified_by=username,
    )

    return Response(
        {
            "message": "IDM configuration created successfully.",
            "data": serialize_idm_config(config),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PUT", "DELETE"])
def idm_configuration_detail(request, config_id):
    if not is_admin_request(request):
        return Response(
            {"error": "Only admin users can manage IDM configuration."},
            status=status.HTTP_403_FORBIDDEN,
        )

    config = IDMConfiguration.objects.filter(id=config_id).first()

    if not config:
        return Response(
            {"error": "IDM configuration not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        config.delete()

        return Response(
            {"message": "IDM configuration deleted successfully."},
            status=status.HTTP_200_OK,
        )

    cleaned, error = clean_payload(request.data)

    if error:
        return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

    if IDMConfiguration.objects.filter(
        document_type__iexact=cleaned["document_type"]
    ).exclude(id=config.id).exists():
        return Response(
            {"error": "Document Type already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    for field, value in cleaned.items():
        setattr(config, field, value)

    config.modified_by = get_request_username(request)
    config.save()

    return Response(
        {
            "message": "IDM configuration updated successfully.",
            "data": serialize_idm_config(config),
        },
        status=status.HTTP_200_OK,
    )