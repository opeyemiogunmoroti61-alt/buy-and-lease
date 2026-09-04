"""
accounts/control_urls.py

Admin-only user management routes. Mount under /api/control/users/
in realestate/urls.py:

    path("api/control/users/", include("accounts.control_urls")),
"""

from django.urls import path
from . import views

urlpatterns = [
    path("", views.ControlUserListView.as_view(), name="control-user-list"),
    path("<uuid:user_id>/", views.ControlUserDetailView.as_view(), name="control-user-detail"),
    path("<uuid:user_id>/toggle/", views.control_toggle_user_active, name="control-user-toggle"),
    path("<uuid:user_id>/verify/", views.control_toggle_user_verified, name="control-user-verify"),
]
