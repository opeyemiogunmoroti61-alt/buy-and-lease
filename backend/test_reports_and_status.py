"""
test_reports_and_status.py

Tests the full loop: log in as a regular user -> report a listing.
Log in as admin -> see the report, resolve it, change a listing's status.

Run with:  python test_reports_and_status.py
Requires `requests` (pip install requests --break-system-packages if missing).

Edit the constants below to match your setup.
"""

import requests

BASE_URL = "http://127.0.0.1:8000"

ADMIN_EMAIL = "ogunmorotiopeyemi1@gmail.com"
ADMIN_PASSWORD = "Spicy@123"

# Any non-admin account (tenant/landlord/agent) that already exists.
REPORTER_EMAIL = "opeyemi.ogunmoroti@miva.edu.ng"
REPORTER_PASSWORD = "12345678"

# An existing listing id to test against — grab one from /api/listings/
LISTING_ID = 2


def login(email, password):
    res = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"email": email, "password": password},
    )
    if not res.ok:
        print(f"  Login failed for {email}: {res.status_code} {res.text}")
        return None
    return res.json().get("access")


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def main():
    print("=== 1. Log in as reporter (regular user) ===")
    reporter_token = login(REPORTER_EMAIL, REPORTER_PASSWORD)
    if not reporter_token:
        return
    print("  OK, got token")

    print(f"\n=== 2. Submit a report on listing #{LISTING_ID} ===")
    res = requests.post(
        f"{BASE_URL}/api/listings/{LISTING_ID}/report/",
        json={"reason": "wrong_status", "details": "Testing the report flow"},
        headers=auth_headers(reporter_token),
    )
    print(f"  -> {res.status_code} {res.json()}")
    if res.status_code != 201:
        print("  Report submission failed, stopping here.")
        return

    print("\n=== 3. Log in as admin ===")
    admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        return
    print("  OK, got token")

    print("\n=== 4. Fetch open reports as admin ===")
    res = requests.get(
        f"{BASE_URL}/api/control/listings/reports/?resolved=false",
        headers=auth_headers(admin_token),
    )
    print(f"  -> {res.status_code}")
    reports = res.json() if res.ok else []
    reports = reports if isinstance(reports, list) else reports.get("results", [])
    print(f"  Found {len(reports)} open report(s)")
    if not reports:
        print("  No open reports found — something's off, stopping here.")
        return
    latest_report = reports[0]
    print(f"  Latest: #{latest_report['id']} on listing #{latest_report['listing_id']} — {latest_report['reason_display']}")

    print(f"\n=== 5. Resolve report #{latest_report['id']} ===")
    res = requests.patch(
        f"{BASE_URL}/api/control/listings/reports/{latest_report['id']}/",
        json={"resolved": True},
        headers=auth_headers(admin_token),
    )
    print(f"  -> {res.status_code} {res.json()}")

    print(f"\n=== 6. Change listing #{LISTING_ID} status to 'rented' ===")
    res = requests.patch(
        f"{BASE_URL}/api/control/listings/{LISTING_ID}/",
        json={"status": "rented"},
        headers=auth_headers(admin_token),
    )
    print(f"  -> {res.status_code}, status now: {res.json().get('status')}")

    print(f"\n=== 7. Confirm listing #{LISTING_ID} disappears from PUBLIC listings ===")
    res = requests.get(f"{BASE_URL}/api/listings/")
    public_listings = res.json()
    public_listings = public_listings if isinstance(public_listings, list) else public_listings.get("results", [])
    still_visible = any(l["id"] == LISTING_ID for l in public_listings)
    print(f"  Still visible publicly: {still_visible} (should be False)")

    print(f"\n=== 8. Set it back to 'available' so you don't lose a test listing ===")
    res = requests.patch(
        f"{BASE_URL}/api/control/listings/{LISTING_ID}/",
        json={"status": "available"},
        headers=auth_headers(admin_token),
    )
    print(f"  -> {res.status_code}, status now: {res.json().get('status')}")

    print("\nDone.")


if __name__ == "__main__":
    main()