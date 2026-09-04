"""accounts/serializers.py — updated to support agent role"""
from rest_framework import serializers
from .models import User, UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=["tenant", "landlord", "agent"],
        default="tenant"
    )

    class Meta:
        model = User
        fields = ("email", "username", "password", "role")

    def create(self, validated_data):
        role = validated_data.pop("role", "tenant")
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
        )
        UserProfile.objects.create(
            user=user,
            email=user.email,
            username=user.username,
            role=role,
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    # NOTE: this was previously missing — the frontend's role-change
    # dropdown was silently sending an undefined id on every PATCH
    # because the serializer never exposed the profile's primary key.
    id = serializers.UUIDField(source="user.id", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "id", "email", "username", "full_name", "role",
            "is_verified", "is_active", "created_at",
        )
