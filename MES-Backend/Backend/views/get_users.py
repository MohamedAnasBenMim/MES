from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserAccount


def get_auth_role(auth_user):
    role = getattr(auth_user, "role", None)

    if auth_user.is_superuser or auth_user.is_staff:
        return "admin"

    if role:
        return str(role).lower()

    return "operator"


def sync_auth_users_to_user_accounts():
    AuthUser = get_user_model()

    for auth_user in AuthUser.objects.all():
        account = UserAccount.objects.filter(
            username__iexact=auth_user.username
        ).first()

        if not account and auth_user.email:
            account = UserAccount.objects.filter(email__iexact=auth_user.email).first()

        role = get_auth_role(auth_user)
        email = auth_user.email or f"{auth_user.username}@no-email.local"

        if account:
            account.username = auth_user.username
            account.email = email
            account.role = role
            account.is_active = auth_user.is_active

            account.language = "en"

            if not account.phone_number:
                account.phone_number = "00000000"

            account.password = auth_user.password
            account.save()
        else:
            UserAccount.objects.create(
                username=auth_user.username,
                email=email,
                role=role,
                language="en",
                phone_number="00000000",
                password=auth_user.password,
                is_active=auth_user.is_active,
            )


@api_view(["GET"])
def get_users(request):
    sync_auth_users_to_user_accounts()

    users = UserAccount.objects.all().order_by("id")

    data = []

    for user in users:
        profile_image = ""
        if user.profile_image:
            profile_image = request.build_absolute_uri(user.profile_image.url)

        data.append(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "language": user.language,
                "phone_number": user.phone_number,
                "profile_image": profile_image,
                "is_active": user.is_active,
            }
        )

    return Response(data)
