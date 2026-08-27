import traceback

import requests
from Backend.models import ActiveOperation
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def get_operation_active_list(request):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET requests are allowed."}, status=405)

    username = request.GET.get("username")
    if not username:
        return JsonResponse({"error": "Username is required."}, status=400)

    # Step: Fetch companyId from backend API
    try:
        company_response = requests.get(
            "http://localhost:8000/api/get_ionapi_credential/"
        )
        company_response.raise_for_status()
        company_data = company_response.json()
        companyId = company_data.get("company")

        if not companyId:
            return JsonResponse(
                {"error": "Company code missing in credentials"}, status=500
            )
    except Exception as e:
        traceback.print_exc()
        return JsonResponse(
            {"error": f"Failed to fetch company code: {str(e)}"}, status=500
        )

    # Fetch active operations for this username and company
    try:
        operations = ActiveOperation.objects.filter(
            username=username, company_id=companyId
        ).order_by("-id")

        data = [
            {
                "id": op.id,
                "Order": op.order,
                "Operation": op.operation,
                "OperatedItem": op.operated_item,
                "ReferenceOperationMachineType": op.reference_operation_machine_type,
                "RoutingQuantity": op.routing_quantity,
                "PlannedStartDate": op.planned_start_date,
                "PlannedFinishDate": op.planned_finish_date,
                "ReferenceOperationWorkCenter": op.reference_operation_work_center,
                "OperationStatus": op.operation_status,
            }
            for op in operations
        ]
        return JsonResponse(data, safe=False, status=200)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
