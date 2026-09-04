"""listings/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    path("", views.ListingListCreateView.as_view(), name="listing-list"),
    path("mine/", views.MyListingsView.as_view(), name="my-listings"),
    path("images/<path:path>/", views.delete_listing_image, name="delete-image"),
    path("favorites/mine/", views.MyFavoritesView.as_view(), name="my-favorites"),
    path("inquiries/received/", views.MyReceivedInquiriesView.as_view(), name="my-received-inquiries"),
    path("inquiries/<int:pk>/", views.MyInquiryDetailView.as_view(), name="my-inquiry-detail"),
    path("<int:pk>/", views.ListingDetailView.as_view(), name="listing-detail"),
    path("<int:listing_id>/images/", views.upload_listing_image, name="upload-image"),
    path("<int:listing_id>/report/", views.report_listing, name="report-listing"),
    path("<int:listing_id>/favorite/", views.toggle_favorite, name="toggle-favorite"),
    path("<int:listing_id>/inquire/", views.create_inquiry, name="create-inquiry"),
]

