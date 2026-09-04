"""
accounts/permissions.py

Custom DRF permission classes.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allows access only to users whose UserProfile.role == "admin".
    Use this to gate every endpoint under /api/control/.
    """

    message = "You do not have permission to access this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.role == "admin")


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: allows access if the requesting user's
    profile is the object's `created_by`, OR if the user is an admin.

    Use on views where `obj.created_by` is a UserProfile (e.g. Listing).
    Safe (GET/HEAD/OPTIONS) requests are allowed for anyone reaching
    has_object_permission (combine with a view-level permission for
    public read access if needed).
    """

    def has_permission(self, request, view):
        # Must be authenticated to reach object-level checks for write ops.
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return False
        if profile.role == "admin":
            return True
        # NOTE: Listing.created_by is a FK to UserProfile with
        # to_field="email", so obj.created_by_id actually holds the
        # email string, not profile.pk (which is the User UUID).
        # Compare the related objects directly so Django resolves
        # the to_field correctly regardless of what it points to.
        return obj.created_by_id is not None and obj.created_by == profile