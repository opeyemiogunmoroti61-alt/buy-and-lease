from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from listings.views import control_stats

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/listings/", include("listings.urls")),
    path("api/control/listings/", include("listings.control_urls")),
    path("api/control/users/", include("accounts.control_urls")),
    path("api/control/users/", include("accounts.control_urls")),
    path("api/control/stats/", control_stats, name="control-stats"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
