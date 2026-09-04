"""
scripts/import_supabase_data.py

Django management command to import your Supabase JSON exports.

Usage:
    python manage.py import_supabase_data \
        --user-profiles path/to/user_profiles.json \
        --listings      path/to/listing.json \
        --images        path/to/listingimages.json

Each JSON file should be a list of objects, e.g.:
  [{"id": "...", "email": "...", ...}, ...]

This matches the format Supabase produces when you export table data as JSON.
"""

import json
import uuid
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import User, UserProfile
from listings.models import Listing, ListingImage


def load_json(path: str) -> list:
    p = Path(path)
    if not p.exists():
        raise CommandError(f"File not found: {path}")
    with open(p) as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise CommandError(f"Expected a JSON array in {path}, got {type(data).__name__}")
    return data


class Command(BaseCommand):
    help = "Import Supabase JSON exports into Django models"

    def add_arguments(self, parser):
        parser.add_argument("--user-profiles", type=str, help="Path to user_profiles.json")
        parser.add_argument("--listings", type=str, help="Path to listing.json")
        parser.add_argument("--images", type=str, help="Path to listingimages.json")

    @transaction.atomic
    def handle(self, *args, **options):

        # ── 1. User Profiles ────────────────────────────────────────────────
        if options["user_profiles"]:
            self.stdout.write("Importing user profiles...")
            profiles = load_json(options["user_profiles"])
            created = 0
            for row in profiles:
                uid = row.get("id")
                email = row.get("email", "")
                username = row.get("username", email.split("@")[0])
                role = row.get("role", "buyer")

                # Create or get the base User record
                user, _ = User.objects.get_or_create(
                    id=uid,
                    defaults={
                        "email": email,
                        "username": username,
                        # Set unusable password — users will reset via your auth flow
                        "password": "",
                    },
                )
                user.set_unusable_password()
                user.save()

                # Create or update the UserProfile
                profile, new = UserProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "email": email,
                        "username": username,
                        "role": role,
                    },
                )
                if new:
                    created += 1

            self.stdout.write(
                self.style.SUCCESS(f"  ✓ {created} new user profiles imported ({len(profiles)} total rows)")
            )

        # ── 2. Listings ──────────────────────────────────────────────────────
        if options["listings"]:
            self.stdout.write("Importing listings...")
            listings = load_json(options["listings"])
            created = 0
            skipped = 0
            for row in listings:
                created_by_email = row.get("createdBy")
                profile = None
                if created_by_email:
                    try:
                        profile = UserProfile.objects.get(email=created_by_email)
                    except UserProfile.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f"  ⚠ No UserProfile for email {created_by_email!r} "
                                f"(listing id={row.get('id')}), leaving created_by=None"
                            )
                        )
                        skipped += 1

                listing, new = Listing.objects.update_or_create(
                    id=row.get("id"),
                    defaults={
                        "address": row.get("address"),
                        "coordinates": row.get("coordinates"),
                        "created_by": profile,
                        "active": row.get("active", False),
                        "type": row.get("type"),
                        "property_type": row.get("propertyType"),
                        "bedroom": row.get("bedroom"),
                        "bathroom": row.get("bathroom"),
                        "built_in": row.get("builtIn"),
                        "parking": row.get("parking"),
                        "lot_size": row.get("lotSize"),
                        "area": row.get("area"),
                        "price": row.get("price"),
                        "hoa": row.get("hoa"),
                        "description": row.get("description"),
                        "profile_image": row.get("profileImage"),
                        "full_name": row.get("fullName"),
                    },
                )
                if new:
                    created += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"  ✓ {created} new listings imported, {skipped} FK warnings ({len(listings)} total rows)"
                )
            )

        # ── 3. Listing Images ────────────────────────────────────────────────
        if options["images"]:
            self.stdout.write("Importing listing images...")
            images = load_json(options["images"])
            created = 0
            for row in images:
                listing_id = row.get("listing_id")
                listing = None
                if listing_id:
                    try:
                        listing = Listing.objects.get(id=listing_id)
                    except Listing.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f"  ⚠ No Listing with id={listing_id}, skipping image id={row.get('id')}"
                            )
                        )
                        continue

                img, new = ListingImage.objects.update_or_create(
                    id=row.get("id"),
                    defaults={
                        "url": row.get("url"),
                        "path": row.get("path"),
                        "listing": listing,
                    },
                )
                if new:
                    created += 1

            self.stdout.write(
                self.style.SUCCESS(f"  ✓ {created} new images imported ({len(images)} total rows)")
            )

        self.stdout.write(self.style.SUCCESS("\n✅ Import complete!"))
