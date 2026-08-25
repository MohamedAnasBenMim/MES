from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from Backend.models import ActiveOperation, IonAPICredentials, OperatorAssignment, UserAccount
from Backend.views.get_dispatch_data import (
    DISPATCH_CACHE_KEY,
    DISPATCH_CACHE_TIMEOUT,
    fetch_dispatch_data_from_infor,
    get_cached_access_token,
)



def is_supervisor(user):
    return str(user.role).lower() in ["supervisor", "admin"]


def is_operator(user):
    return str(user.role).lower() == "operator"


def get_assignment_value(data, fallback_data, key):
    value = data.get(key)

    if value:
        return value

    if fallback_data is not None:
        return fallback_data.get(key)

    return None


def get_assignment_actor(data, fallback_data=None):
    actor = UserAccount.objects.filter(
        id=get_assignment_value(data, fallback_data, "assigned_by_id")
    ).first()

    if actor and is_supervisor(actor):
        return actor

    username = str(
        get_assignment_value(data, fallback_data, "assigned_by_username") or ""
    ).strip()
    role = str(
        get_assignment_value(data, fallback_data, "assigned_by_role") or ""
    ).strip().lower()

    if username:
        username_actor = UserAccount.objects.filter(username__iexact=username).first()

        if username_actor and is_supervisor(username_actor):
            return username_actor

        if role in ["supervisor", "admin"]:
            role_actor = UserAccount.objects.filter(
                username__iexact=username,
                role__iexact=role,
            ).first()

            if role_actor:
                return role_actor

    if role in ["supervisor", "admin"]:
        role_actor = UserAccount.objects.filter(role__iexact=role).first()

        if role_actor:
            return role_actor

    if actor:
        return actor

    return None

def normalize_status(status):
    return str(status or "").strip().lower().replace("_", "").replace(" ", "")


def is_operation_active(operation):
    status = normalize_status(operation.operation_status)

    return status in [
        "active",
        "started",
        "readytostart",
    ]


def is_operation_completed_or_closed(operation):
    status = normalize_status(operation.operation_status)

    return (
        "complete" in status
        or "closed" in status
        or "cancel" in status
    )



def get_active_assignment_for_operator(operator):
    return OperatorAssignment.objects.filter(
        operator=operator,
        closed_at__isnull=True,
    ).first()


def get_active_assignment_for_operation(operation):
    return OperatorAssignment.objects.filter(
        operation=operation,
        closed_at__isnull=True,
    ).first()


def get_current_company_id():
    credentials = IonAPICredentials.objects.order_by("-created_at").first()
    return credentials.company if credentials else ""


def get_operator_active_operations(operator, include_completed=False):
    company_id = get_current_company_id()
    operations = ActiveOperation.objects.filter(
        username__iexact=operator.username,
    )

    if company_id:
        operations = operations.filter(company_id=company_id)

    operations = list(operations.order_by("planned_finish_date", "id"))

    if include_completed:
        return operations

    return [
        operation for operation in operations
        if not is_operation_completed_or_closed(operation)
    ]


def get_first_operator_active_operation(operator):
    operations = get_operator_active_operations(operator)
    return operations[0] if operations else None


def has_active_list_owner(operation, allowed_operator=None):
    owner = str(operation.username or "").strip()

    if not owner:
        return False

    if allowed_operator and owner.lower() == allowed_operator.username.lower():
        return False

    return True


def has_same_operation_in_another_active_list(operation, operator):
    return ActiveOperation.objects.filter(
        order=operation.order,
        operation=operation.operation,
    ).exclude(
        id=operation.id
    ).exclude(
        username__isnull=True
    ).exclude(
        username=""
    ).exclude(
        username__iexact=operator.username
    ).exists()


def has_same_operation_active_list_owner(operation):
    operations = ActiveOperation.objects.filter(
        order=operation.order,
        operation=operation.operation,
    ).exclude(
        id=operation.id
    ).exclude(
        username__isnull=True
    ).exclude(
        username=""
    )

    if operation.company_id:
        operations = operations.filter(company_id=operation.company_id)

    return operations.exists()


def operator_has_other_active_operation(operator, allowed_operation=None):
    operations = get_operator_active_operations(operator)

    if allowed_operation:
        operations = [
            operation for operation in operations
            if operation.id != allowed_operation.id
        ]

    return len(operations) > 0


def add_operation_to_operator_active_list(operation, operator):
    company_id = get_current_company_id()

    operation.username = operator.username

    if company_id and not operation.company_id:
        operation.company_id = company_id

    operation.save(update_fields=["username", "company_id"])


def remove_operation_from_operator_active_list(operation, operator):
    ActiveOperation.objects.filter(
        order=operation.order,
        operation=operation.operation,
        username__iexact=operator.username,
    ).update(username="")


def get_unowned_operation(order, operation_number, company_id):
    operations = ActiveOperation.objects.filter(
        order=order,
        operation=operation_number,
        company_id=company_id,
    )

    return (
        operations.filter(username="").first()
        or operations.filter(username__isnull=True).first()
    )


def get_dispatch_item_value(item, key, default=""):
    value = item.get(key, default)
    return default if value is None else value


def sync_available_operations_from_dispatch():
    company_id = get_current_company_id()

    if not company_id:
        return

    dispatch_data = cache.get(DISPATCH_CACHE_KEY)

    if dispatch_data is None:
        access_token = get_cached_access_token()

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "X-Infor-LnCompany": company_id,
        }

        dispatch_data = fetch_dispatch_data_from_infor(headers)
        cache.set(DISPATCH_CACHE_KEY, dispatch_data, DISPATCH_CACHE_TIMEOUT)

    for item in dispatch_data:
        order = str(get_dispatch_item_value(item, "Order")).strip()
        operation_number = str(get_dispatch_item_value(item, "Operation")).strip()

        if not order or not operation_number:
            continue

        operation = get_unowned_operation(order, operation_number, company_id)

        defaults = {
            "operated_item": get_dispatch_item_value(item, "OperatedItem"),
            "reference_operation_machine_type": get_dispatch_item_value(
                item,
                "ReferenceOperationMachineType",
            ),
            "routing_quantity": get_dispatch_item_value(item, "RoutingQuantity", 0),
            "planned_start_date": get_dispatch_item_value(item, "PlannedStartDate"),
            "planned_finish_date": get_dispatch_item_value(item, "PlannedFinishDate"),
            "reference_operation_work_center": get_dispatch_item_value(
                item,
                "ReferenceOperationWorkCenter",
            ),
            "operation_status": get_dispatch_item_value(item, "OperationStatus"),
        }

        if operation:
            for field, value in defaults.items():
                setattr(operation, field, value)

            operation.save(update_fields=list(defaults.keys()))
            continue

        ActiveOperation.objects.create(
            username="",
            company_id=company_id,
            order=order,
            operation=operation_number,
            **defaults,
        )




def serialize_operation(operation):
    assignment = get_active_assignment_for_operation(operation)
    active_list_owner = str(operation.username or "").strip()
    same_operation_has_owner = has_same_operation_active_list_owner(operation)

    return {
        "id": operation.id,
        "Order": operation.order,
        "Operation": operation.operation,
        "OperatedItem": operation.operated_item,
        "ReferenceOperationMachineType": operation.reference_operation_machine_type,
        "RoutingQuantity": operation.routing_quantity,
        "PlannedStartDate": operation.planned_start_date,
        "PlannedFinishDate": operation.planned_finish_date,
        "ReferenceOperationWorkCenter": operation.reference_operation_work_center,
        "OperationStatus": operation.operation_status,
        "assigned": assignment is not None or bool(active_list_owner) or same_operation_has_owner,
        "assignment_id": assignment.id if assignment else None,
        "assigned_to": active_list_owner or None,
    }


def serialize_assignment(assignment):
    return {
        "id": assignment.id,
        "operator_id": assignment.operator_id,
        "operator_name": assignment.operator.username,
        "operation_id": assignment.operation_id,
        "operation": serialize_operation(assignment.operation),
        "assigned_by_id": assignment.assigned_by_id,
        "assigned_by_name": assignment.assigned_by.username,
        "assigned_at": assignment.assigned_at,
        "closed_at": assignment.closed_at,
        "closed_reason": assignment.closed_reason,
        "notes": assignment.notes,
        "status": assignment.status,
    }


def serialize_operator(operator):
    active_operations = get_operator_active_operations(operator)
    assignment = get_active_assignment_for_operator(operator)
    current_operation = active_operations[0] if active_operations else None

    return {
        "id": operator.id,
        "row_id": f"operator-{operator.id}",
        "username": operator.username,
        "email": operator.email,
        "role": operator.role,
        "status": "busy" if active_operations else "available",
        "active_operation_count": len(active_operations),
        "current_operation": serialize_operation(current_operation) if current_operation else None,
        "current_assignment": serialize_assignment(assignment) if assignment else None,
    }


def serialize_operator_operation_row(operator, operation, active_operation_count):
    assignment = get_active_assignment_for_operation(operation)

    return {
        "id": operator.id,
        "row_id": f"operator-{operator.id}-operation-{operation.id}",
        "username": operator.username,
        "email": operator.email,
        "role": operator.role,
        "status": "busy",
        "active_operation_count": active_operation_count,
        "current_operation": serialize_operation(operation),
        "current_assignment": serialize_assignment(assignment) if assignment else None,
    }


def serialize_operator_rows(operator):
    active_operations = get_operator_active_operations(operator)

    if not active_operations:
        return [serialize_operator(operator)]

    return [
        serialize_operator_operation_row(
            operator,
            operation,
            len(active_operations),
        )
        for operation in active_operations
    ]


def validate_assignment(operator, operation):
    if not operator:
        return Response({"error": "Operator not found."}, status=404)

    if not is_operator(operator):
        return Response({"error": "Selected user is not an operator."}, status=400)

    if not operation:
        return Response({"error": "Operation not found."}, status=404)

    if not is_operation_active(operation):
        return Response({"error": "Operation is not active."}, status=400)

    if is_operation_completed_or_closed(operation):
        return Response({"error": "Operation is completed or closed."}, status=400)

    if operator_has_other_active_operation(operator):
        return Response({"error": "Operator already has an active operation."}, status=400)

    if get_active_assignment_for_operator(operator):
        return Response({"error": "Operator already has an active assignment."}, status=400)

    if has_active_list_owner(operation, allowed_operator=operator):
        return Response({"error": "Operation is already in another operator active list."}, status=400)

    if has_same_operation_in_another_active_list(operation, operator):
        return Response({"error": "Operation is already in another operator active list."}, status=400)

    if get_active_assignment_for_operation(operation):
        return Response({"error": "Operation already has an active assignment."}, status=400)

    return None



@api_view(["GET"])
def operators(request):
    users = UserAccount.objects.filter(role__iexact="operator").order_by("username")
    rows = []

    for user in users:
        rows.extend(serialize_operator_rows(user))

    return Response(rows)


@api_view(["GET"])
def active_operations(request):
    try:
        sync_available_operations_from_dispatch()
    except Exception:
        pass

    operations = ActiveOperation.objects.all().order_by("planned_finish_date", "id")
    operations = [
    op for op in operations
    if is_operation_active(op) and not is_operation_completed_or_closed(op)
]
    return Response([serialize_operation(op) for op in operations])


@api_view(["POST"])
def operator_assignments(request):
    supervisor = get_assignment_actor(request.data, request.query_params)
    operator = UserAccount.objects.filter(id=request.data.get("operator_id")).first()

    if not supervisor or not is_supervisor(supervisor):
        return Response({"error": "Only a supervisor or admin can assign operators."}, status=403)

    try:
        with transaction.atomic():
            operation = ActiveOperation.objects.select_for_update().filter(
                id=request.data.get("operation_id")
            ).first()

            validation_error = validate_assignment(operator, operation)
            if validation_error:
                return validation_error

            add_operation_to_operator_active_list(operation, operator)

            assignment = OperatorAssignment.objects.create(
                operator=operator,
                operation=operation,
                assigned_by=supervisor,
                notes=request.data.get("notes", ""),
                status="assigned",
            )
    except IntegrityError:
        return Response({"error": "Assignment already exists."}, status=400)

    return Response(serialize_assignment(assignment), status=201)


@api_view(["PUT", "DELETE"])
def operator_assignment_detail(request, assignment_id):
    assignment = OperatorAssignment.objects.filter(id=assignment_id).first()

    if not assignment:
        return Response({"error": "Assignment not found."}, status=404)

    supervisor = get_assignment_actor(request.data, request.query_params)

    if not supervisor or not is_supervisor(supervisor):
        return Response({"error": "Only a supervisor or admin can update assignments."}, status=403)
    if assignment.closed_at:
        return Response({"error": "Assignment is already closed."}, status=400)

    if request.method == "DELETE":
        with transaction.atomic():
            remove_operation_from_operator_active_list(
                assignment.operation,
                assignment.operator,
            )

            assignment.closed_at = timezone.now()
            assignment.closed_reason = "removed"
            assignment.notes = request.data.get("notes", assignment.notes)
            assignment.status = "closed"
            assignment.save()

        return Response(serialize_assignment(assignment))

    new_operation_id = request.data.get("operation_id")

    if new_operation_id:
        new_operation = ActiveOperation.objects.filter(id=new_operation_id).first()

        if not new_operation:
            return Response({"error": "Operation not found."}, status=404)

        if not is_operation_active(new_operation):
            return Response({"error": "Operation is not active."}, status=400)

        if is_operation_completed_or_closed(new_operation):
            return Response({"error": "Operation is completed or closed."}, status=400)

        if get_active_assignment_for_operation(new_operation):
            return Response({"error": "Operation already has an active assignment."}, status=400)

        if has_active_list_owner(new_operation, allowed_operator=assignment.operator):
            return Response({"error": "Operation is already in another operator active list."}, status=400)

        if has_same_operation_in_another_active_list(new_operation, assignment.operator):
            return Response({"error": "Operation is already in another operator active list."}, status=400)

        if operator_has_other_active_operation(
            assignment.operator,
            allowed_operation=assignment.operation,
        ):
            return Response({"error": "Operator already has another active operation."}, status=400)

        with transaction.atomic():
            remove_operation_from_operator_active_list(
                assignment.operation,
                assignment.operator,
            )

            assignment.closed_at = timezone.now()
            assignment.closed_reason = "reassigned"
            assignment.status = "closed"
            assignment.save()

            add_operation_to_operator_active_list(
                new_operation,
                assignment.operator,
            )

            new_assignment = OperatorAssignment.objects.create(
                operator=assignment.operator,
                operation=new_operation,
                assigned_by=supervisor,
                notes=request.data.get("notes", ""),
                status="assigned",
            )

        return Response(serialize_assignment(new_assignment))

    assignment.notes = request.data.get("notes", assignment.notes)
    assignment.status = request.data.get("status", assignment.status)
    assignment.save()

    return Response(serialize_assignment(assignment))


@api_view(["GET"])
def operator_assignment_history(request):
    operator_id = request.GET.get("operator_id")

    assignments = OperatorAssignment.objects.select_related(
        "operator",
        "operation",
        "assigned_by",
    ).order_by("-assigned_at")

    if operator_id:
        assignments = assignments.filter(operator_id=operator_id)

    return Response([serialize_assignment(item) for item in assignments])
