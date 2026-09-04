"""listings/admin.py"""
from django.contrib import admin
from .models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0
    fields = ("url", "path")


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("id", "address", "type", "property_type", "price", "active", "created_at")
    list_filter = ("active", "type", "property_type")
    search_fields = ("address", "full_name", "description")
    inlines = [ListingImageInline]


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ("id", "listing", "url", "created_at")
