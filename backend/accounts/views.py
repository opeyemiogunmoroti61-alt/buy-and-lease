"""accounts/views.py"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserProfileSerializer
from .models import UserProfile
from .permissions import IsAdmin


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """POST /api/auth/register/"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {"email": user.email, "username": user.username},
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """GET /api/auth/me/ — returns the logged-in user's profile"""
    try:
        profile = request.user.profile
        return Response(UserProfileSerializer(profile).data)
    except Exception:
        return Response({"detail": "Profile not found."}, status=404)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """PATCH /api/auth/profile/update/ — update username and full_name"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        return Response({"detail": "Profile not found."}, status=404)

    allowed_fields = ["username", "full_name"]
    data = {k: v for k, v in request.data.items() if k in allowed_fields}

    # Check username uniqueness
    new_username = data.get("username")
    if new_username and new_username != profile.username:
        if UserProfile.objects.filter(username=new_username).exclude(user=request.user).exists():
            return Response({"username": ["This username is already taken."]}, status=400)
        profile.username = new_username
        # Also update the User model username
        request.user.username = new_username
        request.user.save()

    if "full_name" in data:
        profile.full_name = data["full_name"]

    profile.save()
    return Response(UserProfileSerializer(profile).data)


# ─────────────────────────────────────────────────────────────────────────
# CONTROL PANEL VIEWS (admin-only) — mounted under /api/control/users/
# ─────────────────────────────────────────────────────────────────────────

class ControlUserListView(generics.ListAPIView):
    """
    GET /api/control/users/
    Admin-only. Returns all user profiles.
    Optional filter: ?role=tenant|landlord|agent|admin
    Optional search: ?search=<email or username>
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = UserProfile.objects.all().select_related("user").order_by("-created_at")
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(email__icontains=search) | qs.filter(username__icontains=search)
        return qs


class ControlUserDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/control/users/<user_id>/   — retrieve a profile
    PATCH /api/control/users/<user_id>/   — change role, e.g. {"role": "agent"}
    Admin-only. Looked up by the underlying User's UUID pk.

    NOTE: no DELETE here on purpose — deleting a user is destructive
    (cascades to their listings). Use the /toggle/ endpoint below to
    suspend a user instead of deleting them.
    """
    queryset = UserProfile.objects.select_related("user").all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdmin]
    lookup_field = "user_id"
    lookup_url_kwarg = "user_id"

    def update(self, request, *args, **kwargs):
        # Restrict PATCH to the role field only, to avoid accidentally
        # letting the control panel overwrite email/username here too
        # (those go through the normal profile-update flow).
        allowed = {"role"}
        stray = set(request.data.keys()) - allowed
        if stray:
            return Response(
                {"detail": f"Only 'role' can be updated here. Unexpected fields: {sorted(stray)}"},
                status=400,
            )
        return super().update(request, *args, **kwargs)


@api_view(["PATCH"])
@permission_classes([IsAdmin])
def control_toggle_user_active(request, user_id):
    """
    PATCH /api/control/users/<user_id>/toggle/
    Suspends or reactivates a user's ability to log in, by flipping
    Django's built-in User.is_active flag. A suspended user's existing
    JWTs still work until they expire (SimpleJWT doesn't check
    is_active mid-token by default) — for immediate effect you'd also
    need to blacklist their outstanding tokens, which isn't set up yet.
    """
    try:
        profile = UserProfile.objects.select_related("user").get(user_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)

    if profile.user_id == request.user.id:
        return Response({"detail": "You can't suspend your own account."}, status=400)

    profile.user.is_active = not profile.user.is_active
    profile.user.save(update_fields=["is_active"])
    return Response({"is_active": profile.user.is_active})


@api_view(["PATCH"])
@permission_classes([IsAdmin])
def control_toggle_user_verified(request, user_id):
    """PATCH /api/control/users/<user_id>/verify/ — toggle the verified badge."""
    try:
        profile = UserProfile.objects.get(user_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)

    profile.is_verified = not profile.is_verified
    profile.save(update_fields=["is_verified"])
    return Response({"is_verified": profile.is_verified})
