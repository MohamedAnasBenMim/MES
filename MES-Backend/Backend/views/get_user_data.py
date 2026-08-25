from django.contrib.auth import get_user_model
from django.http import JsonResponse

from ..models import UserAccount


def get_auth_role(auth_user):
    role = getattr(auth_user, "role", None)

    if auth_user.is_superuser or auth_user.is_staff:
        return "admin"

    if role:
        return str(role).lower()

    return "operator"


def sync_account_from_auth_user(auth_user):
    account = UserAccount.objects.filter(username__iexact=auth_user.username).first()

    if not account and auth_user.email:
        account = UserAccount.objects.filter(email__iexact=auth_user.email).first()

    role = get_auth_role(auth_user)
    email = auth_user.email or f"{auth_user.username}@no-email.local"

    if account:
        account.username = auth_user.username
        account.email = email
        account.role = role

        account.language = "en"

        if not account.phone_number:
            account.phone_number = "00000000"

        account.password = auth_user.password
        account.save()
        return account

    return UserAccount.objects.create(
        username=auth_user.username,
        email=email,
        role=role,
        language="en",
        phone_number="00000000",
        password=auth_user.password,
    )


def get_user_data(request, user_id):
    if request.method != "GET":
        return JsonResponse({"error": "Only GET method allowed"}, status=405)

    AuthUser = get_user_model()

    try:
        user = UserAccount.objects.filter(id=user_id).first()

        if not user:
            auth_user = AuthUser.objects.filter(id=user_id).first()
            if auth_user:
                user = sync_account_from_auth_user(auth_user)

        if not user:
            return JsonResponse({"error": "User not found"}, status=404)

        profile_image = ""
        if user.profile_image:
            profile_image = request.build_absolute_uri(user.profile_image.url)

        user_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "language": user.language,
            "phone_number": user.phone_number,
            "profile_image": profile_image,
        }

        return JsonResponse(user_data, safe=False)

    except Exception as e:
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)
