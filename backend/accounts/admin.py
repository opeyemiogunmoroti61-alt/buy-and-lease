"""accounts/admin.py"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "is_staff", "date_joined")
    ordering = ("email",)
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Custom", {"fields": ()}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("username", "email")
