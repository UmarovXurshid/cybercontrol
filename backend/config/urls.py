from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.views.static import serve as serve_media
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.core.urls')),
    path('bot/', include('apps.bot.urls')),
    # DEBUG=0'da ham ishlashi kerak - django.conf.urls.static.static() faqat DEBUG=True'da
    # url qo'shadi, media fayllar esa nginx orqali shu joyga proxy qilinadi
    re_path(r'^media/(?P<path>.*)$', serve_media, {'document_root': settings.MEDIA_ROOT}),
]
