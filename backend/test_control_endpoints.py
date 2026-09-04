"""
test_control_endpoints.py

Quick smoke test for the /api/control/ endpoints.
Run with:  python test_control_endpoints.py

Requires `requests` (pip install requests --break-system-packages if missing).
Edit BASE_URL / EMAIL / PASSWORD below to match your setup.
"""

import requests

BASE_URL = "http://127.0.0.1:8000"
EMAIL = "ogunmorotiopeyemi1@gmail.com"
PASSWORD = "Spicy@123"


def main():
    # ── 1. Log in as the admin user ─────────────────────────────────────
    login_url = f"{BASE_URL}/api/auth/login/"
    resp = requests.post(login_url, json={"email": EMAIL, "password": PASSWORD})
    print(f"[LOGIN] {login_url} -> {resp.status_code}")
    if resp.status_code != 200:
        print("Login failed. Response body:")
        print(resp.text)
        return

    access = resp.json().get("access")
    if not access:
        print("No 'access' token in login response. Full body:")
        print(resp.json())
        return
    print("Got access token (first 20 chars):", access[:20], "...")

    headers = {"Authorization": f"Bearer {access}"}

    # ── 2. Confirm /me/ reports role=admin ──────────────────────────────
    me_url = f"{BASE_URL}/api/auth/me/"
    resp = requests.get(me_url, headers=headers)
    print(f"\n[ME] {me_url} -> {resp.status_code}")
    print(resp.json())
    role = resp.json().get("role")
    if role != "admin":
        print(f"⚠️  Expected role='admin', got role={role!r}. Control endpoints will 403.")

    # ── 3. Hit /api/control/listings/ ───────────────────────────────────
    listings_url = f"{BASE_URL}/api/control/listings/"
    resp = requests.get(listings_url, headers=headers)
    print(f"\n[CONTROL LISTINGS] {listings_url} -> {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        count = len(data) if isinstance(data, list) else data.get("count", "?")
        print(f"OK — returned {count} listings (includes inactive ones, unlike public /api/listings/)")
    else:
        print(resp.text)

    # ── 4. Hit /api/control/users/ ──────────────────────────────────────
    users_url = f"{BASE_URL}/api/control/users/"
    resp = requests.get(users_url, headers=headers)
    print(f"\n[CONTROL USERS] {users_url} -> {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        count = len(data) if isinstance(data, list) else data.get("count", "?")
        print(f"OK — returned {count} user profiles")
    else:
        print(resp.text)

    # ── 5. Negative test: hit /api/control/ WITHOUT a token ─────────────
    resp = requests.get(listings_url)
    print(f"\n[NO AUTH] {listings_url} -> {resp.status_code} (should be 401/403)")


if __name__ == "__main__":
    main()