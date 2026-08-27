import traceback

from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserAccount


def normalize_role(role):
    if not role:
        return None

    role = role.strip().lower()

    role_aliases = {
        "admin": "admin",
        "administrator": "admin",
        "operator": "operator",
        "quality": "quality",
        "quality technicien": "quality",
        "quality technician": "quality",
        "qualitytechnicien": "quality",
        "quality_technicien": "quality",
        "supervisor": "supervisor",
    }

    return role_aliases.get(role)


def find_auth_user_for_account(account):
    AuthUser = get_user_model()

    auth_user = AuthUser.objects.filter(username__iexact=account.username).first()

    if not auth_user and account.email:
        auth_user = AuthUser.objects.filter(email__iexact=account.email).first()

    return auth_user


def resolve_user_account(user_id):
    AuthUser = get_user_model()

    account = UserAccount.objects.filter(id=user_id).first()

    if account:
        return account

    auth_user = AuthUser.objects.filter(id=user_id).first()

    if not auth_user:
        return None

    account = UserAccount.objects.filter(username__iexact=auth_user.username).first()

    if not account and auth_user.email:
        account = UserAccount.objects.filter(email__iexact=auth_user.email).first()

    if account:
        return account

    role = getattr(auth_user, "role", None)

    if auth_user.is_superuser or auth_user.is_staff:
        role = "admin"

    role = normalize_role(role) or "operator"

    email = auth_user.email or f"{auth_user.username}@no-email.local"

    return UserAccount.objects.create(
        username=auth_user.username,
        email=email,
        role=role,
        language="en",
        phone_number="00000000",
        password=auth_user.password,
    )


@api_view(["POST", "PUT", "PATCH"])
def update_user(request, user_id):
    try:
        account = resolve_user_account(user_id)

        if not account:
            return Response({"error": "User not found."}, status=404)

        AuthUser = get_user_model()
        auth_user = find_auth_user_for_account(account)

        old_username = account.username
        old_email = account.email

        data = request.data

        # Keep old values if fields are empty or not sent
        username = data.get("username", "").strip() or account.username
        email = data.get("email", "").strip() or account.email
        role_input = data.get("role", "").strip()
        language = "en"
        phone_number = (
            data.get("phone_number", "").strip() or account.phone_number or "00000000"
        )

        role = normalize_role(role_input) if role_input else account.role

        if not username:
            return Response({"error": "Username is required."}, status=400)

        if not email:
            return Response({"error": "Email is required."}, status=400)

        # Check username duplicate only if username changed
        if username.lower() != account.username.lower():
            if (
                UserAccount.objects.filter(username__iexact=username)
                .exclude(id=account.id)
                .exists()
            ):
                return Response({"error": "Username already exists."}, status=409)

            auth_username_query = AuthUser.objects.filter(username__iexact=username)

            if auth_user:
                auth_username_query = auth_username_query.exclude(id=auth_user.id)

            if auth_username_query.exists():
                return Response({"error": "Username already exists."}, status=409)

        # Check email duplicate only if email changed
        if email.lower() != account.email.lower():
            if (
                UserAccount.objects.filter(email__iexact=email)
                .exclude(id=account.id)
                .exists()
            ):
                return Response({"error": "Email already exists."}, status=409)

            auth_email_query = AuthUser.objects.filter(email__iexact=email)

            if auth_user:
                auth_email_query = auth_email_query.exclude(id=auth_user.id)

            if auth_email_query.exists():
                return Response({"error": "Email already exists."}, status=409)

        # Update UserAccount
        account.username = username
        account.email = email
        account.role = role
        account.language = language
        account.phone_number = phone_number

        # Important:
        # We do NOT update password here.
        # Password must be changed using profile-change-password endpoint.

        if "profile_image" in request.FILES:
            account.profile_image = request.FILES["profile_image"]

        account.save()

        # Sync Django auth user
        if not auth_user:
            auth_user = AuthUser.objects.filter(username__iexact=old_username).first()

        if not auth_user and old_email:
            auth_user = AuthUser.objects.filter(email__iexact=old_email).first()

        if not auth_user:
            auth_user = AuthUser.objects.create(
                username=username,
                email=email,
            )

        auth_user.username = username
        auth_user.email = email

        if hasattr(auth_user, "role"):
            auth_user.role = role

        # Important:
        # We do NOT call auth_user.set_password() here.

        auth_user.save()

        profile_image = ""

        if account.profile_image:
            profile_image = request.build_absolute_uri(account.profile_image.url)

        return Response(
            {
                "message": "User updated successfully. Password was not changed.",
                "user": {
                    "id": account.id,
                    "username": account.username,
                    "email": account.email,
                    "role": account.role,
                    "language": account.language,
                    "phone_number": account.phone_number,
                    "profile_image": profile_image,
                },
            },
            status=200,
        )

    except Exception as e:
        traceback.print_exc()
        return Response({"error": f"Server error: {str(e)}"}, status=500)
