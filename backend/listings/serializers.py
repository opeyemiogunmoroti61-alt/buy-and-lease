"""listings/serializers.py"""
from rest_framework import serializers
from .models import Listing, ListingImage, ListingReport, Favorite, Inquiry


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ("id", "url", "path", "created_at")


class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)
    poster_role = serializers.CharField(source="created_by.role", read_only=True)  # ← ADD THIS
    favorite_count = serializers.IntegerField(source="favorited_by.count", read_only=True)

    class Meta:
        model = Listing
        fields = (
            "id", "created_at", "address", "coordinates",
            "created_by_email", "poster_role", "active", "status", "type", "property_type",
            "bedroom", "bathroom", "built_in", "parking",
            "lot_size", "area", "price", "hoa", "price_per_night", "min_nights",
            "description", "profile_image", "full_name",
            "images", "favorite_count",
        )


class ListingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        exclude = ("created_by",)
        extra_kwargs = {
            "address": {"required": False},
            "coordinates": {"required": False},
            "type": {"required": False, "allow_null": True},
            "property_type": {"required": False, "allow_null": True},
            "bedroom": {"required": False, "allow_null": True},
            "bathroom": {"required": False, "allow_null": True},
            "built_in": {"required": False, "allow_null": True},
            "parking": {"required": False, "allow_null": True},
            "lot_size": {"required": False, "allow_null": True},
            "area": {"required": False, "allow_null": True},
            "price": {"required": False, "allow_null": True},
            "hoa": {"required": False, "allow_null": True},
            "price_per_night": {"required": False, "allow_null": True},
            "min_nights": {"required": False, "allow_null": True},
            "description": {"required": False, "allow_null": True},
            "active": {"required": False},
            "status": {"required": False},
            "profile_image": {"required": False, "allow_null": True},
            "full_name": {"required": False, "allow_null": True},
        }


# ─────────────────────────────────────────────────────────────────────────
# LISTING REPORTS
# ─────────────────────────────────────────────────────────────────────────

class ListingReportCreateSerializer(serializers.ModelSerializer):
    """Used by the public-facing 'report this listing' endpoint."""

    class Meta:
        model = ListingReport
        fields = ("reason", "details")


class ListingReportSerializer(serializers.ModelSerializer):
    """Used by the admin control panel to review reports."""

    listing_id = serializers.IntegerField(source="listing.id", read_only=True)
    listing_address = serializers.CharField(source="listing.address", read_only=True)
    reporter_email = serializers.CharField(
        source="reporter.email", read_only=True, default=None
    )
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)
    resolved_by_email = serializers.CharField(
        source="resolved_by.email", read_only=True, default=None
    )

    class Meta:
        model = ListingReport
        fields = (
            "id", "listing_id", "listing_address", "reporter_email",
            "reason", "reason_display", "details", "created_at",
            "resolved", "resolved_at", "resolved_by_email",
        )


# ─────────────────────────────────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────────────────────────────────

class FavoriteSerializer(serializers.ModelSerializer):
    """Used both for a user's own 'Saved Listings' and the admin log."""

    listing_id = serializers.IntegerField(source="listing.id", read_only=True)
    listing_address = serializers.CharField(source="listing.address", read_only=True)
    listing_price = serializers.FloatField(source="listing.price", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Favorite
        fields = ("id", "listing_id", "listing_address", "listing_price", "user_email", "created_at")


# ─────────────────────────────────────────────────────────────────────────
# INQUIRIES
# ─────────────────────────────────────────────────────────────────────────

class InquiryCreateSerializer(serializers.ModelSerializer):
    """Public-facing 'Contact Agent/Landlord' submission."""

    class Meta:
        model = Inquiry
        fields = ("name", "email", "phone", "message")


class InquirySerializer(serializers.ModelSerializer):
    """Used by the owner's dashboard and the admin control panel."""

    listing_id = serializers.IntegerField(source="listing.id", read_only=True)
    listing_address = serializers.CharField(source="listing.address", read_only=True)
    sender_email = serializers.CharField(source="sender.email", read_only=True, default=None)

    class Meta:
        model = Inquiry
        fields = (
            "id", "listing_id", "listing_address", "sender_email",
            "name", "email", "phone", "message", "created_at", "read",
        )
