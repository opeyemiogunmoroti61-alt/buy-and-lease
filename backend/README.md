# Real Estate Django — Migrated from Supabase

## What was migrated

| Supabase                    | Django                                  |
|-----------------------------|-----------------------------------------|
| `public.listing`            | `listings.Listing` model                |
| `public.listingimages`      | `listings.ListingImage` model           |
| `public.user_profiles`      | `accounts.UserProfile` model            |
| `auth.users`                | `accounts.User` (AbstractUser + UUID)   |
| Supabase Auth (JWT)         | `djangorestframework-simplejwt`         |
| Row Level Security (RLS)    | DRF permission classes on each view     |
| Storage buckets (image URLs)| URLs kept as-is; optional: django-storages + S3 |

---

## 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+ running locally (or a hosted DB)
- pip

---

## 2. Install dependencies

```bash
cd realestate_django
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `SECRET_KEY` — any long random string (use `python -c "import secrets; print(secrets.token_hex(50))"`)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` — your PostgreSQL connection details

---

## 4. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE realestate_db;"
```

---

## 5. Run Django migrations

```bash
python manage.py migrate
```

This creates all tables: `accounts_user`, `user_profiles`, `listing`, `listingimages`.

---

## 6. Import your Supabase data (JSON exports)

If you have JSON files from your Supabase backup:

```bash
python manage.py import_supabase_data \
    --user-profiles exports/user_profiles.json \
    --listings      exports/listing.json \
    --images        exports/listingimages.json
```

Run in this order (user profiles first, then listings, then images) to satisfy FK constraints.

---

## 7. Create a superuser (admin)

```bash
python manage.py createsuperuser
```

---

## 8. Start the dev server

```bash
python manage.py runserver
```

---

## API Endpoints

| Method | URL                          | Description                        | Auth     |
|--------|------------------------------|------------------------------------|----------|
| POST   | `/api/auth/register/`        | Register new user                  | Public   |
| POST   | `/api/auth/login/`           | Login → returns JWT tokens         | Public   |
| POST   | `/api/auth/token/refresh/`   | Refresh access token               | Public   |
| GET    | `/api/auth/me/`              | Get current user profile           | Required |
| GET    | `/api/listings/`             | List all active listings           | Public   |
| POST   | `/api/listings/`             | Create a listing                   | Required |
| GET    | `/api/listings/<id>/`        | Get listing detail                 | Public   |
| PATCH  | `/api/listings/<id>/`        | Update listing                     | Required |
| DELETE | `/api/listings/<id>/`        | Delete listing                     | Required |
| GET    | `/api/listings/mine/`        | My listings                        | Required |
| GET    | `/admin/`                    | Django admin panel                 | Staff    |

### Authentication header (after login)
```
Authorization: Bearer <access_token>
```

---

## Updating your frontend

Replace Supabase client calls like this:

| Supabase                                      | Django API                              |
|-----------------------------------------------|-----------------------------------------|
| `supabase.auth.signUp()`                      | `POST /api/auth/register/`              |
| `supabase.auth.signInWithPassword()`          | `POST /api/auth/login/`                 |
| `supabase.from('listing').select()`           | `GET /api/listings/`                   |
| `supabase.from('listing').insert()`           | `POST /api/listings/`                  |
| `supabase.from('listing').eq('id', x)`        | `GET /api/listings/<id>/`              |
| `supabase.storage.from('bucket').upload()`    | Use `POST /api/listings/` with `url` field (or add django-storages) |

---

## Optional: Image storage with S3 (replaces Supabase Storage)

1. Uncomment `django-storages` and `boto3` in `requirements.txt` and install
2. Add to `settings.py`:
   ```python
   DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
   AWS_STORAGE_BUCKET_NAME = env('AWS_BUCKET')
   AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
   AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
   ```
3. Switch `ListingImage.url` to an `ImageField` instead of `CharField`
