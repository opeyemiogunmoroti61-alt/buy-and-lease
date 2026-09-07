"""listings/views.py"""
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from .models import Listing, ListingImage, ListingReport, Favorite, Inquiry
from .serializers import (
    ListingSerializer, ListingWriteSerializer, ListingImageSerializer,
    ListingReportCreateSerializer, ListingReportSerializer,
    FavoriteSerializer, InquiryCreateSerializer, InquirySerializer,
)
from accounts.permissions import IsAdmin, IsOwnerOrAdmin
from django.utils import timezone
from django.db.models.functions import Cast
from django.db.models import IntegerField


class ListingListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/listings/         — list all active, available listings (public)
    POST /api/listings/         — create a listing (auth required)

    Real filters, applied server-side:
      ?type=Sell|Rent|Shortlet
      ?property_type=Condo|Town House|Single Family House|...
      ?bedroom=2   → "2 or more" (bedroom is stored as free text, so
                      non-numeric junk like "Studio" is safely excluded
                      rather than causing an error)
      ?bathroom=2  → same "N or more" semantics
      ?parking=1   → parking is a real numeric field, straightforward gte
    """
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["address", "description", "full_name"]
    ordering_fields = ["price", "created_at", "area"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Listing.objects.filter(active=True, status="available").prefetch_related("images")

        type_param = self.request.query_params.get("type")
        if type_param:
            qs = qs.filter(type=type_param)

        property_type_param = self.request.query_params.get("property_type")
        if property_type_param:
            qs = qs.filter(property_type=property_type_param)

        parking_param = self.request.query_params.get("parking")
        if parking_param and parking_param.isdigit():
            qs = qs.filter(parking__gte=int(parking_param))

        # bedroom/bathroom are free-text CharFields (agents sometimes
        # type "Studio", "3+", etc.) — only attempt the numeric "N or
        # more" comparison against rows that are actually plain digits,
        # so junk data doesn't 500 the request or silently corrupt results.
        bedroom_param = self.request.query_params.get("bedroom")
        if bedroom_param and bedroom_param.isdigit():
            qs = qs.filter(bedroom__regex=r"^\d+$").annotate(
                _bedroom_num=Cast("bedroom", IntegerField())
            ).filter(_bedroom_num__gte=int(bedroom_param))

        bathroom_param = self.request.query_params.get("bathroom")
        if bathroom_param and bathroom_param.isdigit():
            qs = qs.filter(bathroom__regex=r"^\d+$").annotate(
                _bathroom_num=Cast("bathroom", IntegerField())
            ).filter(_bathroom_num__gte=int(bathroom_param))

        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ListingWriteSerializer
        return ListingSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        serializer.save(created_by=profile)


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/listings/<id>/   — retrieve (public)
    PATCH  /api/listings/<id>/   — update (owner or admin only)
    DELETE /api/listings/<id>/   — delete (owner or admin only)

    NOTE: previously this only checked IsAuthenticated, which let ANY
    logged-in user edit or delete ANY listing by guessing the id. Now
    uses IsOwnerOrAdmin, which checks object-level ownership.
    """
    queryset = Listing.objects.prefetch_related("images")
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.AllowAny()]


class MyListingsView(generics.ListAPIView):
    """GET /api/listings/mine/  — listings owned by the current user"""
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return Listing.objects.none()
        return Listing.objects.filter(created_by=profile).prefetch_related("images")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_listing_image(request, listing_id):
    """
    POST /api/listings/<id>/images/
    Accepts multipart/form-data with an 'image' file field.

    Uses Django's storage abstraction (default_storage) instead of raw
    file I/O — this is what makes Cloudflare R2 actually work. The old
    version wrote directly to local disk with open()/os.makedirs(),
    which would have silently ignored any S3/R2 config entirely. With
    default_storage, this saves to R2 in production (when R2 env vars
    are set) and to local disk in dev (when they're not) — same code,
    the STORAGES setting in settings.py decides which one happens.
    """
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response({'detail': 'Listing not found'}, status=404)

    # Owner or admin can upload
    profile = getattr(request.user, 'profile', None)
    is_owner = listing.created_by == profile
    is_admin = bool(profile and profile.role == "admin")
    if not (is_owner or is_admin):
        return Response({'detail': 'Unauthorized'}, status=403)

    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'detail': 'No image provided'}, status=400)

    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if image_file.content_type not in allowed_types:
        return Response({'detail': 'Invalid file type'}, status=400)

    # Validate file size (5MB max)
    if image_file.size > 5 * 1024 * 1024:
        return Response({'detail': 'File too large (max 5MB)'}, status=400)

    ext = os.path.splitext(image_file.name)[1].lower()
    filename = f"{uuid.uuid4()}{ext}"
    relative_path = f"listings/{listing_id}/{filename}"

    saved_path = default_storage.save(relative_path, image_file)
    url = default_storage.url(saved_path)
    # default_storage.url() returns an absolute URL with S3Storage
    # (R2), but a relative /media/... path with local FileSystemStorage
    # — only make it absolute in that second case.
    if url.startswith("/"):
        url = request.build_absolute_uri(url)

    img = ListingImage.objects.create(
        listing=listing,
        url=url,
        path=saved_path,
    )

    return Response({'url': img.url, 'path': img.path}, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_listing_image(request, path):
    """
    DELETE /api/listings/images/<path>/
    Deletes via Django's storage abstraction (works for both R2 and
    local disk, unlike the old raw os.path/os.remove calls which only
    ever worked against local disk).
    """
    try:
        img = ListingImage.objects.get(path=path)
    except ListingImage.DoesNotExist:
        return Response({'detail': 'Image not found'}, status=404)

    # Owner or admin can delete
    profile = getattr(request.user, 'profile', None)
    is_owner = img.listing and img.listing.created_by == profile
    is_admin = bool(profile and profile.role == "admin")
    if not (is_owner or is_admin):
        return Response({'detail': 'Unauthorized'}, status=403)

    if default_storage.exists(img.path):
        default_storage.delete(img.path)

    img.delete()
    return Response(status=204)


# ─────────────────────────────────────────────────────────────────────────
# CONTROL PANEL VIEWS (admin-only) — mounted under /api/control/listings/
# ─────────────────────────────────────────────────────────────────────────

class ControlListingListView(generics.ListAPIView):
    """
    GET /api/control/listings/
    Admin-only. Returns ALL listings regardless of `active` status,
    with optional filters:
      ?active=true|false
      ?type=Sell|Rent
      ?search=<text>  (address, description, full_name)
    """
    serializer_class = ListingSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["address", "description", "full_name"]
    ordering_fields = ["price", "created_at", "area", "active"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Listing.objects.all().prefetch_related("images")
        active_param = self.request.query_params.get("active")
        if active_param is not None:
            qs = qs.filter(active=active_param.lower() == "true")
        type_param = self.request.query_params.get("type")
        if type_param:
            qs = qs.filter(type=type_param)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class ControlListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/control/listings/<id>/   — retrieve any listing
    PATCH  /api/control/listings/<id>/   — moderate (e.g. {"active": true})
    DELETE /api/control/listings/<id>/   — remove any listing
    Admin-only.
    """
    queryset = Listing.objects.prefetch_related("images")
    serializer_class = ListingSerializer
    permission_classes = [IsAdmin]


@api_view(["GET"])
@permission_classes([IsAdmin])
def control_stats(request):
    """
    GET /api/control/stats/
    Admin-only. Aggregate counts for the overview tab.
    """
    from accounts.models import UserProfile  # local import avoids a circular import at module load time

    listings_qs = Listing.objects.all()
    profiles_qs = UserProfile.objects.all()

    return Response({
        "total_users": profiles_qs.count(),
        "landlords": profiles_qs.filter(role="landlord").count(),
        "agents": profiles_qs.filter(role="agent").count(),
        "seekers": profiles_qs.filter(role="tenant").count(),
        "admins": profiles_qs.filter(role="admin").count(),
        "total_listings": listings_qs.count(),
        "active_listings": listings_qs.filter(active=True).count(),
        "pending_listings": listings_qs.filter(active=False).count(),
    })


# ─────────────────────────────────────────────────────────────────────────
# LISTING REPORTS
# ─────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_listing(request, listing_id):
    """
    POST /api/listings/<id>/report/
    Any logged-in user can flag a listing (wrong status, suspected
    fraud, duplicate, etc). Body: {"reason": "...", "details": "..."}
    """
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response({"detail": "Listing not found."}, status=404)

    profile = getattr(request.user, "profile", None)
    serializer = ListingReportCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(listing=listing, reporter=profile)
        return Response({"detail": "Report submitted. Thank you."}, status=201)
    return Response(serializer.errors, status=400)


class ControlReportListView(generics.ListAPIView):
    """
    GET /api/control/listings/reports/
    Admin-only. Optional filter: ?resolved=true|false
    """
    serializer_class = ListingReportSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = ListingReport.objects.select_related("listing", "reporter", "resolved_by")
        resolved_param = self.request.query_params.get("resolved")
        if resolved_param is not None:
            qs = qs.filter(resolved=resolved_param.lower() == "true")
        return qs


class ControlReportDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/control/listings/reports/<id>/
    PATCH /api/control/listings/reports/<id>/  — body: {"resolved": true}
    Admin-only. Marking resolved stamps resolved_at / resolved_by
    automatically; un-resolving clears both.
    """
    queryset = ListingReport.objects.select_related("listing", "reporter", "resolved_by")
    serializer_class = ListingReportSerializer
    permission_classes = [IsAdmin]

    def update(self, request, *args, **kwargs):
        allowed = {"resolved"}
        stray = set(request.data.keys()) - allowed
        if stray:
            return Response(
                {"detail": f"Only 'resolved' can be updated here. Unexpected fields: {sorted(stray)}"},
                status=400,
            )
        instance = self.get_object()
        instance.resolved = bool(request.data.get("resolved"))
        if instance.resolved:
            instance.resolved_at = timezone.now()
            instance.resolved_by = getattr(request.user, "profile", None)
        else:
            instance.resolved_at = None
            instance.resolved_by = None
        instance.save()
        return Response(self.get_serializer(instance).data)


# ─────────────────────────────────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, listing_id):
    """
    POST /api/listings/<id>/favorite/
    Toggles the current user's favorite on this listing.
    Returns {"favorited": true|false}.
    """
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response({"detail": "Listing not found."}, status=404)

    profile = getattr(request.user, "profile", None)
    if not profile:
        return Response({"detail": "Profile not found."}, status=400)

    favorite = Favorite.objects.filter(listing=listing, user=profile).first()
    if favorite:
        favorite.delete()
        return Response({"favorited": False})
    Favorite.objects.create(listing=listing, user=profile)
    return Response({"favorited": True}, status=201)


class MyFavoritesView(generics.ListAPIView):
    """GET /api/listings/favorites/mine/ — the current user's saved listings."""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return Favorite.objects.none()
        return Favorite.objects.filter(user=profile).select_related("listing")


class ControlFavoriteListView(generics.ListAPIView):
    """GET /api/control/listings/favorites/ — admin-only engagement log."""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAdmin]
    queryset = Favorite.objects.select_related("listing", "user").all()


# ─────────────────────────────────────────────────────────────────────────
# INQUIRIES
# ─────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def create_inquiry(request, listing_id):
    """
    POST /api/listings/<id>/inquire/
    Open to anonymous visitors as well as logged-in users — matches
    how most real estate platforms maximize lead volume. If the
    requester is authenticated, their profile is attached as `sender`
    automatically (frontend can pre-fill name/email from their account,
    but the name/email fields are still captured on the inquiry itself
    so it isn't dependent on profile completeness).
    """
    try:
        listing = Listing.objects.get(id=listing_id)
    except Listing.DoesNotExist:
        return Response({"detail": "Listing not found."}, status=404)

    serializer = InquiryCreateSerializer(data=request.data)
    if serializer.is_valid():
        sender = None
        if request.user and request.user.is_authenticated:
            sender = getattr(request.user, "profile", None)
        serializer.save(listing=listing, sender=sender)
        return Response({"detail": "Inquiry sent."}, status=201)
    return Response(serializer.errors, status=400)


class MyReceivedInquiriesView(generics.ListAPIView):
    """
    GET /api/listings/inquiries/received/
    Inquiries submitted on listings the current user owns — powers an
    owner's "Inquiries" tab on their dashboard.
    """
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return Inquiry.objects.none()
        return Inquiry.objects.filter(listing__created_by=profile).select_related(
            "listing", "sender"
        )


class MyInquiryDetailView(generics.RetrieveUpdateAPIView):
    """
    PATCH /api/listings/inquiries/<id>/  — body: {"read": true}
    Owner marking an inquiry on their own listing as read.
    """
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return Inquiry.objects.none()
        return Inquiry.objects.filter(listing__created_by=profile)

    def update(self, request, *args, **kwargs):
        allowed = {"read"}
        stray = set(request.data.keys()) - allowed
        if stray:
            return Response(
                {"detail": f"Only 'read' can be updated here."}, status=400
            )
        instance = self.get_object()
        instance.read = bool(request.data.get("read"))
        instance.save(update_fields=["read"])
        return Response(self.get_serializer(instance).data)


class ControlInquiryListView(generics.ListAPIView):
    """
    GET /api/control/listings/inquiries/
    Admin-only. Full platform-wide inquiry log. Optional ?read=true|false
    """
    serializer_class = InquirySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Inquiry.objects.select_related("listing", "sender")
        read_param = self.request.query_params.get("read")
        if read_param is not None:
            qs = qs.filter(read=read_param.lower() == "true")
        return qs
