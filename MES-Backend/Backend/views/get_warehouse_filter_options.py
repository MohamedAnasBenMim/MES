import logging
from typing import Any

import requests
from requests import RequestException
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from Backend.models import IonAPICredentials
from Backend.utils.token_manager import get_mingle_token


logger = logging.getLogger(__name__)

WAREHOUSES_URL = (
    "https://mingle-ionapi.eu1.inforcloudsuite.com/"
    "LDE4VNS7C63W3JGC_DEM/"
    "LN/lnapi/odata/"
    "whapi.wmdWarehouse/WarehousesMasterData"
)

REQUEST_TIMEOUT_SECONDS = 30


def get_latest_credentials() -> IonAPICredentials | None:
    return (
        IonAPICredentials.objects
        .order_by("-created_at")
        .first()
    )


def read_api_value(
    item: dict[str, Any],
    field_name: str,
) -> Any:
    if field_name in item:
        return item[field_name]

    normalized_expected = field_name.lower()

    for actual_key, value in item.items():
        if actual_key.lower() == normalized_expected:
            return value

    return None


@api_view(["GET"])
def get_warehouse_filter_options(request):
    credentials = get_latest_credentials()

    if credentials is None:
        return Response(
            {"warehouse_types": []},
            status=status.HTTP_200_OK,
        )

    company_code = (credentials.company or "").strip()

    if not company_code:
        return Response(
            {"warehouse_types": []},
            status=status.HTTP_200_OK,
        )

    try:
        access_token = get_mingle_token()
    except Exception:
        logger.exception(
            "Unable to generate the Infor access token."
        )
        return Response(
            {"warehouse_types": []},
            status=status.HTTP_200_OK,
        )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "X-Infor-LnCompany": company_code,
    }

    params = {
        "$select": "WarehouseType",
        "$orderby": "WarehouseType asc",
        "$top": 1000,
    }

    warehouse_types: set[str] = set()
    next_url: str | None = WAREHOUSES_URL

    try:
        while next_url:
            response = requests.get(
                next_url,
                headers=headers,
                params=params if next_url == WAREHOUSES_URL else None,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )

            if not response.ok:
                break

            payload = response.json()

            if isinstance(payload, dict):
                items = payload.get("value", [])
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            warehouse_type = read_api_value(
                                item,
                                "WarehouseType",
                            )
                            if warehouse_type not in [None, ""]:
                                warehouse_types.add(
                                    str(warehouse_type)
                                )

                next_url = payload.get("@odata.nextLink")
            else:
                next_url = None

        return Response(
            {
                "warehouse_types": sorted(
                    warehouse_types,
                    key=lambda value: value.lower()
                )
            },
            status=status.HTTP_200_OK,
        )

    except RequestException:
        logger.exception(
            "Unable to load warehouse filter options."
        )
        return Response(
            {"warehouse_types": []},
            status=status.HTTP_200_OK,
        )