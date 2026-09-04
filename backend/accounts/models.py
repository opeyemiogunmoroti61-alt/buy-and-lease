"""
accounts/models.py

Replaces two Supabase constructs:
  - auth.users         → Django's built-in AbstractUser (handles passwords, JWT, sessions)
  - public.user_profiles → UserProfile model (one-to-one with User)

Supabase had user_profiles.id = auth.uid() (UUID).
Django uses BigAutoField by default; we keep UUID here to preserve your
existing data ids during import.
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user — drop-in replacement for Supabase auth.users.
    Email is the login identifier (matches Supabase behaviour).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)

    # Use email instead of username for login
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    """
    Mirrors public.user_profiles from Supabase.

    Supabase columns:
        id          uuid  PK  (was auth.uid())
        created_at  timestamptz
        email       varchar  UNIQUE
        username    varchar  UNIQUE
        role        text
    """

    ROLE_CHOICES = [
    ("tenant", "Tenant / Seeker"),
    ("landlord", "Landlord"),
    ("agent", "Agent"),
    ("admin", "Admin"),
]
    # One-to-one link to our custom User model
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
        primary_key=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=255, unique=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)  # ← ADD THIS
    role = models.TextField(choices=ROLE_CHOICES, default="tenant")
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "user_profiles"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.username} ({self.role})"
