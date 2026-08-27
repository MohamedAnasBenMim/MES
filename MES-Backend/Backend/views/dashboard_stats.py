from datetime import timedelta

from django.apps import apps
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserAccount


def get_model_by_candidates(app_label, candidates):
    for model_name in candidates:
        try:
            return apps.get_model(app_label, model_name)
        except LookupError:
            continue
    return None


def get_first_existing_field(model, candidates):
    if not model:
        return None

    model_fields = [field.name for field in model._meta.fields]

    for field_name in candidates:
        if field_name in model_fields:
            return field_name

    return None


def safe_count_by_field(model, field_name):
    if not model or not field_name:
        return []

    try:
        queryset = (
            model.objects.values(field_name)
            .annotate(count=Count("id"))
            .order_by(field_name)
        )

        return [
            {
                "label": item[field_name] or "Unknown",
                "count": item["count"],
            }
            for item in queryset
        ]
    except Exception:
        return []


def safe_sum_by_fields(model, group_field, quantity_field):
    if not model or not group_field or not quantity_field:
        return []

    try:
        queryset = (
            model.objects.values(group_field)
            .annotate(total=Sum(quantity_field))
            .order_by(group_field)
        )

        return [
            {
                "label": item[group_field] or "Unknown",
                "count": item["total"] or 0,
            }
            for item in queryset
        ]
    except Exception:
        return []


def user_registration_by_month():
    try:
        queryset = (
            UserAccount.objects.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        return [
            {
                "month": (
                    item["month"].strftime("%b %Y") if item["month"] else "Unknown"
                ),
                "count": item["count"],
            }
            for item in queryset
        ]
    except Exception:
        return []


def daily_completed_orders():
    completed_order_model = get_model_by_candidates(
        "Backend",
        [
            "CompletedOrder",
            "Order",
            "Operation",
            "OperationActiveList",
            "ProductionOrder",
        ],
    )

    if not completed_order_model:
        return []

    date_field = get_first_existing_field(
        completed_order_model,
        [
            "completed_at",
            "completion_date",
            "updated_at",
            "created_at",
            "date",
        ],
    )

    status_field = get_first_existing_field(
        completed_order_model,
        [
            "status",
            "state",
        ],
    )

    if not date_field:
        return []

    try:
        last_7_days = timezone.now() - timedelta(days=7)

        queryset = completed_order_model.objects.all()

        if status_field:
            queryset = queryset.filter(**{f"{status_field}__icontains": "complete"})

        queryset = (
            queryset.filter(**{f"{date_field}__gte": last_7_days})
            .annotate(day=TruncDate(date_field))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        return [
            {
                "day": item["day"].strftime("%d %b") if item["day"] else "Unknown",
                "count": item["count"],
            }
            for item in queryset
        ]
    except Exception:
        return []


@api_view(["GET"])
def dashboard_stats(request):
    users = UserAccount.objects.all()

    total_users = users.count()
    total_admins = users.filter(role__iexact="admin").count()
    total_operators = users.filter(role__iexact="operator").count()
    total_quality = users.filter(role__iexact="quality").count()
    total_supervisors = users.filter(role__iexact="supervisor").count()

    # 1. Users by role
    users_by_role = [
        {"role": "Admin", "count": total_admins},
        {"role": "Operator", "count": total_operators},
        {"role": "Quality", "count": total_quality},
        {"role": "Supervisor", "count": total_supervisors},
    ]

    # 2. User registration over time
    registrations_by_month = user_registration_by_month()

    # 3. Non-conformances by status
    nc_model = get_model_by_candidates(
        "Backend",
        [
            "NonConformance",
            "NonConformanceReport",
            "NC",
            "Nc",
            "QualityNC",
            "NonConformanceData",
        ],
    )

    nc_status_field = get_first_existing_field(
        nc_model,
        [
            "status",
            "state",
            "nc_status",
        ],
    )

    non_conformances_by_status = safe_count_by_field(nc_model, nc_status_field)

    # 4. Inventory by stock point
    inventory_model = get_model_by_candidates(
        "Backend",
        [
            "Inventory",
            "InventoryItem",
            "Stock",
            "StockPointInventory",
            "WarehouseInventory",
            "ItemInventory",
        ],
    )

    stock_point_field = get_first_existing_field(
        inventory_model,
        [
            "stock_point",
            "stockpoint",
            "warehouse",
            "warehouse_name",
            "location",
            "name",
        ],
    )

    quantity_field = get_first_existing_field(
        inventory_model,
        [
            "quantity",
            "qty",
            "stock_quantity",
            "available_quantity",
            "on_hand",
            "total_quantity",
        ],
    )

    inventory_by_stock_point = safe_sum_by_fields(
        inventory_model, stock_point_field, quantity_field
    )

    # 5. Operations activity
    operation_model = get_model_by_candidates(
        "Backend",
        [
            "Operation",
            "OperationActiveList",
            "ActiveOperation",
            "ManufacturingOperation",
            "ProductionOperation",
        ],
    )

    operation_status_field = get_first_existing_field(
        operation_model,
        [
            "status",
            "state",
            "operation_status",
        ],
    )

    operations_activity = safe_count_by_field(operation_model, operation_status_field)

    # 6. Daily completed orders
    completed_orders_by_day = daily_completed_orders()

    return Response(
        {
            "total_users": total_users,
            "total_admins": total_admins,
            "total_operators": total_operators,
            "total_quality": total_quality,
            "total_supervisors": total_supervisors,
            "users_by_role": users_by_role,
            "registrations_by_month": registrations_by_month,
            "non_conformances_by_status": non_conformances_by_status,
            "inventory_by_stock_point": inventory_by_stock_point,
            "operations_activity": operations_activity,
            "completed_orders_by_day": completed_orders_by_day,
        }
    )
