# from django.contrib.auth.models import AbstractUser

# class User(AbstractUser):
#     pass  # Extend later if needed
#     print("Hello ")

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    role = models.CharField(max_length=100, blank=True, null=True)  # Add this field
