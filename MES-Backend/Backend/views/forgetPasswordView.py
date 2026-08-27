from Backend.models import UserAccount
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class ForgetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        User = get_user_model()
        auth_user = User.objects.filter(email__iexact=email).first()
        user_account = UserAccount.objects.filter(email__iexact=email).first()

        # We return the same message even if the email does not exist
        # because it is more secure.
        success_message = {
            "message": "If this email exists, a new password has been sent."
        }

        if not auth_user and not user_account:
            return Response(success_message, status=status.HTTP_200_OK)

        # Generate new random password
        new_password = get_random_string(
            length=10,
            allowed_chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$",
        )

        # Save the new password in every user table where the account exists.
        if auth_user:
            auth_user.set_password(new_password)
            auth_user.save()

        if user_account:
            user_account.password = make_password(new_password)
            user_account.save()

        recipient_email = user_account.email if user_account else auth_user.email

        # Send email
        send_mail(
            subject="Your new password",
            message=f"""
Hello,

Your new password is:

{new_password}

Please login and change your password after connecting.

Regards,
Smart MES Team
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=False,
        )

        return Response(success_message, status=status.HTTP_200_OK)
