from django.db import connection
from django.http import JsonResponse


def health_check(request):
    database_status = "ok"

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        database_status = "error"

    status_code = 200 if database_status == "ok" else 503

    return JsonResponse(
        {
            "status": "ok" if database_status == "ok" else "error",
            "database": database_status,
        },
        status=status_code,
    )
