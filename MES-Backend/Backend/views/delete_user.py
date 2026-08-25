import traceback

from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserAccount


def find_auth_user_for_account(account):
    AuthUser = get_user_model()

    auth_user = AuthUser.objects.filter(username__iexact=account.username).first()

    if not auth_user and account.email:
        auth_user = AuthUser.objects.filter(email__iexact=account.email).first()

    return auth_user


@api_view(["DELETE"])
def delete_user(request, user_id):
    try:
        AuthUser = get_user_model()

        account = UserAccount.objects.filter(id=user_id).first()
        auth_user = None

        if account:
            auth_user = find_auth_user_for_account(account)
        else:
            auth_user = AuthUser.objects.filter(id=user_id).first()

            if auth_user:
                account = UserAccount.objects.filter(username__iexact=auth_user.username).first()

                if not account and auth_user.email:
                    account = UserAccount.objects.filter(email__iexact=auth_user.email).first()

        if not account and not auth_user:
            return Response({"error": "User not found."}, status=404)

        deleted_username = None

        if account:
            deleted_username = account.username
            account.delete()

        if auth_user:
            deleted_username = deleted_username or auth_user.username
            auth_user.delete()

        return Response(
            {
                "message": "User deleted successfully.",
                "username": deleted_username,
            },
            status=200
        )

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Server error: {str(e)}"}, status=500)