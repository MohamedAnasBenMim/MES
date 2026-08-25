import json
import traceback

from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from ..models import UserAccount


@csrf_exempt
def profile_change_password(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST method allowed."},
            status=405
        )

    try:
        data = json.loads(request.body.decode("utf-8"))

        username = data.get("username", "").strip()
        old_password = data.get("old_password", "")
        new_password = data.get("new_password", "")
        confirm_password = data.get("confirm_password", "")

        if not username:
            return JsonResponse(
                {"error": "Username is required."},
                status=400
            )

        if not old_password:
            return JsonResponse(
                {"error": "Old password is required."},
                status=400
            )

        if not new_password:
            return JsonResponse(
                {"error": "New password is required."},
                status=400
            )

        if new_password != confirm_password:
            return JsonResponse(
                {"error": "New password and confirmation do not match."},
                status=400
            )

        if len(new_password) < 8:
            return JsonResponse(
                {"error": "Password must contain at least 8 characters."},
                status=400
            )

        User = get_user_model()

        auth_user = User.objects.filter(username__iexact=username).first()

        if not auth_user:
            return JsonResponse(
                {"error": "User not found in auth_app_user."},
                status=404
            )

        if not auth_user.check_password(old_password):
            return JsonResponse(
                {"error": "Old password is incorrect."},
                status=401
            )

        # Important: this updates the REAL login password
        auth_user.set_password(new_password)
        auth_user.save()

        # Sync Backend_useraccount password hash too
        user_account = UserAccount.objects.filter(username__iexact=auth_user.username).first()

        if not user_account and auth_user.email:
            user_account = UserAccount.objects.filter(email__iexact=auth_user.email).first()

        if user_account:
            user_account.password = auth_user.password
            user_account.save()

        return JsonResponse(
            {"message": "Password changed successfully. Please login again."},
            status=200
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON body."},
            status=400
        )

    except Exception as e:
        traceback.print_exc()
        return JsonResponse(
            {"error": f"Server error: {str(e)}"},
            status=500
        )