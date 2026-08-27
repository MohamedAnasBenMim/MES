from datetime import datetime, time, timedelta

from Backend.models import ActiveOperation, OperatorPerformance, UserAccount
from django.db.models import Avg, Count, Sum
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt


def get_week_start():
    today = timezone.localdate()

    return today - timedelta(days=today.weekday())


def make_aware_datetime(date_value):
    naive_datetime = datetime.combine(
        date_value,
        time.min,
    )

    if timezone.is_aware(naive_datetime):
        return naive_datetime

    return timezone.make_aware(naive_datetime)


def build_profile_image(
    request,
    user,
):
    if not user.profile_image:
        return ""

    return request.build_absolute_uri(user.profile_image.url)


@csrf_exempt
def operator_dashboard(request):
    if request.method != "GET":
        return JsonResponse(
            {"error": ("Only GET requests " "are allowed.")},
            status=405,
        )

    username = str(
        request.GET.get(
            "username",
            "",
        )
    ).strip()

    if not username:
        return JsonResponse(
            {"error": ("Username is required.")},
            status=400,
        )

    account = UserAccount.objects.filter(username__iexact=username).first()

    if not account:
        return JsonResponse(
            {"error": ("Operator not found.")},
            status=404,
        )

    week_start = get_week_start()

    week_start_datetime = make_aware_datetime(week_start)

    active_operations = ActiveOperation.objects.filter(
        username__iexact=username
    ).order_by("-id")

    active_data = []

    for operation in active_operations:
        active_data.append(
            {
                "id": operation.id,
                "order": operation.order,
                "operation": (operation.operation),
                "item": (operation.operated_item or ""),
                "machine_type": (operation.reference_operation_machine_type or ""),
                "routing_quantity": (operation.routing_quantity or 0),
                "planned_start_date": (operation.planned_start_date or ""),
                "work_center": (operation.reference_operation_work_center or ""),
                "status": (operation.operation_status or "Active"),
                "company_id": (operation.company_id or ""),
            }
        )

    current_week_records = OperatorPerformance.objects.filter(
        username__iexact=username,
        completed_at__gte=(week_start_datetime),
    )

    current_summary = current_week_records.aggregate(
        total_points=Sum("points"),
        completed_operations=Count("id"),
        delivered_quantity=Sum("qty_deliver"),
        rejected_quantity=Sum("qty_reject"),
        quality_score=Avg("quality_score"),
    )

    daily_productivity = []

    for day_offset in range(7):
        day = week_start + timedelta(days=day_offset)

        next_day = day + timedelta(days=1)

        day_start = make_aware_datetime(day)

        day_end = make_aware_datetime(next_day)

        day_count = OperatorPerformance.objects.filter(
            username__iexact=username,
            completed_at__gte=day_start,
            completed_at__lt=day_end,
        ).count()

        daily_productivity.append(
            {
                "day": day.strftime("%a"),
                "count": day_count,
            }
        )

    operator_accounts = UserAccount.objects.filter(
        role__iexact="operator",
        is_active=True,
    )

    champions = []

    for operator in operator_accounts:
        summary = OperatorPerformance.objects.filter(
            username__iexact=(operator.username),
            completed_at__gte=(week_start_datetime),
        ).aggregate(
            total_points=Sum("points"),
            completed_operations=Count("id"),
            quality_score=Avg("quality_score"),
        )

        champions.append(
            {
                "username": (operator.username),
                "display_name": (operator.display_name or operator.username),
                "role": (operator.role),
                "points": (summary["total_points"] or 0),
                "completed_operations": (summary["completed_operations"] or 0),
                "quality_score": round(
                    summary["quality_score"] or 100,
                    1,
                ),
                "avatar": (
                    build_profile_image(
                        request,
                        operator,
                    )
                ),
            }
        )

    champions.sort(
        key=lambda operator: (
            operator["points"],
            operator["quality_score"],
        ),
        reverse=True,
    )

    for index, champion in enumerate(
        champions,
        start=1,
    ):
        champion["rank"] = index

    recent_performance = current_week_records.order_by("-completed_at")[:10]

    recent_issues = []

    for performance in recent_performance:
        if performance.qty_reject and performance.qty_reject > 0:
            recent_issues.append(
                {
                    "order": (performance.order),
                    "operation": (performance.operation),
                    "rejected_quantity": (performance.qty_reject),
                    "date": (performance.completed_at.isoformat()),
                }
            )

    return JsonResponse(
        {
            "operator": {
                "username": (account.username),
                "display_name": (account.display_name or account.username),
                "job_title": (account.job_title or account.role),
                "role": (account.role),
                "language": (account.language),
                "profile_image": (
                    build_profile_image(
                        request,
                        account,
                    )
                ),
            },
            "statistics": {
                "active_operations": (active_operations.count()),
                "completed_this_week": (current_summary["completed_operations"] or 0),
                "delivered_quantity": (current_summary["delivered_quantity"] or 0),
                "rejected_quantity": (current_summary["rejected_quantity"] or 0),
                "quality_score": round(
                    current_summary["quality_score"] or 100,
                    1,
                ),
                "points": (current_summary["total_points"] or 0),
            },
            "daily_productivity": (daily_productivity),
            "active_operations": (active_data),
            "champions": (champions[:5]),
            "recent_issues": (recent_issues),
        },
        status=200,
    )
