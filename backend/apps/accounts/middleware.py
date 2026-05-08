from .i18n import activate_request_language


class UserLocaleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        language = activate_request_language(request, getattr(request, "user", None))
        response = self.get_response(request)
        response.headers["Content-Language"] = getattr(request, "LANGUAGE_CODE", language)
        return response
