from rest_framework_simplejwt.authentication import JWTAuthentication

from .i18n import activate_request_language


class LocalizedJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, _token = result
            activate_request_language(request, user)
        return result
