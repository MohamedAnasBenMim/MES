import logging
from typing import Any

import requests
from Backend.models import IonAPICredentials
from Backend.utils.token_manager import get_mingle_token
from requests import RequestException
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)

WAREHOUSES_URL = (
    "https://mingle-ionapi.eu1.inforcloudsuite.com/"
    "LDE4VNS7C63W3JGC_DEM/"
    "LN/lnapi/odata/"
    "whapi.wmdWarehouse/WarehousesMasterData"
)

REQUEST_TIMEOUT_SECONDS = 30
DEFAULT_PAGE_SIZE = 10
ALLOWED_PAGE_SIZES = {5, 10, 20, 50}

WAREHOUSE_FIELDS = (
    "Warehouse,"
    "Description,"
    "WarehouseType,"
    "MESControlled,"
    "WMSControlled,"
    "InventoryManagement"
)


def get_latest_credentials() -> IonAPICredentials | None:
    return IonAPICredentials.objects.order_by("-created_at").first()


def parse_positive_integer(
    raw_value: str | None,
    default: int,
) -> int:
    try:
        parsed_value = int(raw_value or default)

        if parsed_value > 0:
            return parsed_value

        return default
    except (TypeError, ValueError):
        return default


def read_api_value(
    item: dict[str, Any],
    field_name: str,
) -> Any:
    if field_name in item:
        return item[field_name]

    expected_key = field_name.lower()

    for actual_key, value in item.items():
        if actual_key.lower() == expected_key:
            return value

    return None


def normalize_boolean(value: Any) -> bool | str | None:
    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return value

    if isinstance(value, int):
        return value == 1

    normalized = str(value).strip().lower()

    true_values = {
        "true",
        "yes",
        "y",
        "1",
        "enabled",
        "active",
        "controlled",
    }

    false_values = {
        "false",
        "no",
        "n",
        "0",
        "disabled",
        "inactive",
        "not controlled",
    }

    if normalized in true_values:
        return True

    if normalized in false_values:
        return False

    return str(value)


def normalize_warehouse(
    item: dict[str, Any],
) -> dict[str, Any]:
    return {
        "Warehouse": read_api_value(
            item,
            "Warehouse",
        ),
        "Description": read_api_value(
            item,
            "Description",
        ),
        "WarehouseType": read_api_value(
            item,
            "WarehouseType",
        ),
        "MESControlled": normalize_boolean(
            read_api_value(
                item,
                "MESControlled",
            )
        ),
        "WMSControlled": normalize_boolean(
            read_api_value(
                item,
                "WMSControlled",
            )
        ),
        "InventoryManagement": normalize_boolean(
            read_api_value(
                item,
                "InventoryManagement",
            )
        ),
    }


def matches_boolean_filter(
    actual_value: Any,
    selected_value: str,
) -> bool:
    if not selected_value:
        return True

    selected = selected_value.strip().lower()
    normalized_actual = normalize_boolean(actual_value)

    if selected in {"yes", "true", "1"}:
        return normalized_actual is True

    if selected in {"no", "false", "0"}:
        return normalized_actual is False

    return True


def matches_search(
    warehouse: dict[str, Any],
    search_term: str,
) -> bool:
    if not search_term:
        return True

    normalized_search = search_term.strip().lower()

    warehouse_code = str(warehouse.get("Warehouse") or "").lower()

    description = str(warehouse.get("Description") or "").lower()

    return normalized_search in warehouse_code or normalized_search in description


def matches_warehouse_type(
    warehouse: dict[str, Any],
    selected_type: str,
) -> bool:
    if not selected_type:
        return True

    actual_type = str(warehouse.get("WarehouseType") or "").strip().lower()

    return actual_type == selected_type.strip().lower()


def apply_filters(
    warehouses: list[dict[str, Any]],
    search_term: str,
    warehouse_type: str,
    mes_controlled: str,
    wms_controlled: str,
    inventory_management: str,
) -> list[dict[str, Any]]:
    filtered: list[dict[str, Any]] = []

    for warehouse in warehouses:
        if not matches_search(
            warehouse,
            search_term,
        ):
            continue

        if not matches_warehouse_type(
            warehouse,
            warehouse_type,
        ):
            continue

        if not matches_boolean_filter(
            warehouse.get("MESControlled"),
            mes_controlled,
        ):
            continue

        if not matches_boolean_filter(
            warehouse.get("WMSControlled"),
            wms_controlled,
        ):
            continue

        if not matches_boolean_filter(
            warehouse.get("InventoryManagement"),
            inventory_management,
        ):
            continue

        filtered.append(warehouse)

    return filtered


def fetch_all_warehouses(
    headers: dict[str, str],
) -> list[dict[str, Any]]:
    warehouses: list[dict[str, Any]] = []

    next_url: str | None = WAREHOUSES_URL
    first_request = True

    while next_url:
        params = None

        if first_request:
            params = {
                "$select": WAREHOUSE_FIELDS,
                "$orderby": "Warehouse asc",
                "$top": 1000,
            }

        response = requests.get(
            next_url,
            headers=headers,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        if response.status_code in {401, 403}:
            raise PermissionError("Infor authorization failed.")

        response.raise_for_status()

        payload = response.json()

        if isinstance(payload, dict):
            page_items = payload.get("value", [])

            if isinstance(page_items, list):
                warehouses.extend(item for item in page_items if isinstance(item, dict))

            next_url = payload.get("@odata.nextLink")
        elif isinstance(payload, list):
            warehouses.extend(item for item in payload if isinstance(item, dict))

            next_url = None
        else:
            next_url = None

        first_request = False

    return warehouses


@api_view(["GET"])
def get_warehouses(request):
    credentials = get_latest_credentials()

    if credentials is None:
        return Response(
            {
                "error": (
                    "Unable to retrieve warehouse data. "
                    "ION API credentials are not configured."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    company_code = (credentials.company or "").strip()

    if not company_code:
        return Response(
            {
                "error": (
                    "Unable to retrieve warehouse data. "
                    "The LN company code is not configured."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    search_term = request.query_params.get(
        "search",
        "",
    ).strip()

    warehouse_type = request.query_params.get(
        "warehouse_type",
        "",
    ).strip()

    mes_controlled = request.query_params.get(
        "mes_controlled",
        "",
    ).strip()

    wms_controlled = request.query_params.get(
        "wms_controlled",
        "",
    ).strip()

    inventory_management = request.query_params.get(
        "inventory_management",
        "",
    ).strip()

    page = parse_positive_integer(
        request.query_params.get("page"),
        1,
    )

    page_size = parse_positive_integer(
        request.query_params.get("page_size"),
        DEFAULT_PAGE_SIZE,
    )

    if page_size not in ALLOWED_PAGE_SIZES:
        page_size = DEFAULT_PAGE_SIZE

    try:
        access_token = get_mingle_token()
    except Exception:
        logger.exception("Unable to generate the Infor token.")

        return Response(
            {"error": ("Authorization error while accessing " "LN warehouse data.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "X-Infor-LnCompany": company_code,
    }

    try:
        raw_warehouses = fetch_all_warehouses(headers)

        warehouses = [normalize_warehouse(item) for item in raw_warehouses]

        warehouses.sort(key=lambda item: str(item.get("Warehouse") or "").lower())

        warehouse_types = sorted(
            {
                str(item.get("WarehouseType")).strip()
                for item in warehouses
                if item.get("WarehouseType") not in {None, ""}
            },
            key=str.lower,
        )

        filtered_warehouses = apply_filters(
            warehouses=warehouses,
            search_term=search_term,
            warehouse_type=warehouse_type,
            mes_controlled=mes_controlled,
            wms_controlled=wms_controlled,
            inventory_management=inventory_management,
        )

        total_count = len(filtered_warehouses)

        total_pages = max(
            1,
            (total_count + page_size - 1) // page_size,
        )

        if page > total_pages:
            page = total_pages

        start_index = (page - 1) * page_size

        end_index = start_index + page_size

        page_items = filtered_warehouses[start_index:end_index]

        return Response(
            {
                "value": page_items,
                "count": len(page_items),
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_previous": page > 1,
                "has_next": page < total_pages,
                "search": search_term,
                "warehouse_types": warehouse_types,
            },
            status=status.HTTP_200_OK,
        )

    except PermissionError:
        return Response(
            {"error": ("Authorization error while accessing " "LN warehouse data.")},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    except RequestException as exception:
        logger.exception("Unable to retrieve Warehouse Master data.")

        return Response(
            {
                "error": ("Unable to retrieve warehouse data."),
                "detail": str(exception),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    except ValueError:
        logger.exception("Infor returned an invalid JSON response.")

        return Response(
            {"error": ("Unable to retrieve warehouse data.")},
            status=status.HTTP_502_BAD_GATEWAY,
        )
