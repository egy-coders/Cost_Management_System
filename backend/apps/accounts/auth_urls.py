from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, logout_view, me_view


urlpatterns = [
    path("login/", LoginView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", logout_view, name="logout"),
    path("me/", me_view, name="me"),
]
