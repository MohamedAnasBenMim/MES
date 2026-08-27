import requests  # type: ignore
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view  # type: ignore
from rest_framework.response import Response  # type: ignore

TOKEN_CACHE_KEY = "infor_access_token_cache"
COMPANY_CACHE_KEY = "infor_company_code_cache"
DISPATCH_CACHE_KEY = "infor_dispatch_data_cache"

TOKEN_CACHE_TIMEOUT = 50 * 60  # 50 minutes
COMPANY_CACHE_TIMEOUT = 10 * 60  # 10 minutes
DISPATCH_CACHE_TIMEOUT = 5 * 60  # 5 minutes


def get_cached_access_token(force_refresh=False):
    if not force_refresh:
        cached_token = cache.get(TOKEN_CACHE_KEY)
        if cached_token:
            return cached_token

    token_response = requests.get("http://localhost:8000/api/get-token/", timeout=20)

    if token_response.status_code != 200:
        raise Exception("Failed to get token")

    access_token = token_response.json().get("access_token")

    if not access_token:
        raise Exception("Access token missing")

    cache.set(TOKEN_CACHE_KEY, access_token, TOKEN_CACHE_TIMEOUT)

    return access_token


def get_cached_company_code(force_refresh=False):
    if not force_refresh:
        cached_company = cache.get(COMPANY_CACHE_KEY)
        if cached_company:
            return cached_company

    company_response = requests.get(
        "http://127.0.0.1:8000/api/get_ionapi_credential/", timeout=20
    )

    company_response.raise_for_status()

    company_code = company_response.json().get("company")

    if not company_code:
        raise Exception("Company code missing in credentials")

    cache.set(COMPANY_CACHE_KEY, company_code, COMPANY_CACHE_TIMEOUT)

    return company_code


def get_active_operations_set(username):
    active_response = requests.get(
        f"http://127.0.0.1:8000/api/get_operation_active_list/?username={username}",
        timeout=20,
    )

    active_data = active_response.json() if active_response.status_code == 200 else []

    active_set = set(
        (str(item.get("Order")), str(item.get("Operation"))) for item in active_data
    )

    return active_set


def fetch_dispatch_data_from_infor(headers):
    url = (
        "https://mingle-ionapi.eu1.inforcloudsuite.com/"
        "LDE4VNS7C63W3JGC_DEM/LN/lnapi/odata/"
        "tiapi.sfcProductionOrder/Operations?"
        "%24filter=OperationStatus%20eq%20tiapi.sfcProductionOrder.OperationStatus%27Active%27"
        "%20or%20OperationStatus%20eq%20tiapi.sfcProductionOrder.OperationStatus%27Started%27"
        "%20or%20OperationStatus%20eq%20tiapi.sfcProductionOrder.OperationStatus%27ReadyToStart%27"
    )

    all_results = []

    while url:
        response = requests.get(url, headers=headers, timeout=60)

        if response.status_code == 401:
            raise PermissionError("Infor token expired or unauthorized")

        if response.status_code != 200:
            raise Exception(
                f"Failed to fetch dispatch data from Infor: {response.status_code}"
            )

        json_data = response.json()
        all_results.extend(json_data.get("value", []))

        url = json_data.get("@odata.nextLink")

    return all_results


@api_view(["GET"])
def get_dispatch_data(request):
    username = request.query_params.get("username", "").strip()

    if not username:
        return Response(
            {"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    refresh = request.query_params.get("refresh", "false").lower() == "true"

    try:
        company_code = get_cached_company_code(force_refresh=refresh)
        active_set = get_active_operations_set(username)

        cached_dispatch_data = None if refresh else cache.get(DISPATCH_CACHE_KEY)

        if cached_dispatch_data is not None:
            all_results = cached_dispatch_data
            source = "cache"
        else:
            access_token = get_cached_access_token(force_refresh=refresh)

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "X-Infor-LnCompany": company_code,
            }

            try:
                all_results = fetch_dispatch_data_from_infor(headers)

            except PermissionError:
                cache.delete(TOKEN_CACHE_KEY)

                access_token = get_cached_access_token(force_refresh=True)

                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                    "X-Infor-LnCompany": company_code,
                }

                all_results = fetch_dispatch_data_from_infor(headers)

            cache.set(DISPATCH_CACHE_KEY, all_results, DISPATCH_CACHE_TIMEOUT)
            source = "infor"

        filtered_results = [
            item
            for item in all_results
            if (str(item.get("Order")), str(item.get("Operation"))) not in active_set
        ]

        return Response(
            {
                "source": source,
                "count": len(filtered_results),
                "data": filtered_results,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {
                "error": "Failed to fetch dispatch data",
                "details": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
