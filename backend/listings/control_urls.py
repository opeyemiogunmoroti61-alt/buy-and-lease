"""
listings/control_urls.py

Admin-only listing routes. Mount under /api/control/listings/
in realestate/urls.py:

    path("api/control/listings/", include("listings.control_urls")),
"""

from django.urls import path
from . import views

urlpatterns = [
    path("", views.ControlListingListView.as_view(), name="control-listing-list"),
    path("<int:pk>/", views.ControlListingDetailView.as_view(), name="control-listing-detail"),
    path("reports/", views.ControlReportListView.as_view(), name="control-report-list"),
    path("reports/<int:pk>/", views.ControlReportDetailView.as_view(), name="control-report-detail"),
    path("favorites/", views.ControlFavoriteListView.as_view(), name="control-favorite-list"),
    path("inquiries/", views.ControlInquiryListView.as_view(), name="control-inquiry-list"),
]
