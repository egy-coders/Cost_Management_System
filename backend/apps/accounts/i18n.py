from django.conf import settings
from django.utils import translation


SUPPORTED_LANGUAGE_CODES = {code for code, _label in settings.LANGUAGES}
DEFAULT_LANGUAGE = "en"


def normalize_language(language):
    code = (language or "").strip().lower().replace("_", "-")
    if code.startswith("ar"):
        return "ar"
    if code.startswith("en"):
        return "en"
    return None


def language_from_accept_header(header):
    for item in (header or "").split(","):
        code = normalize_language(item.split(";", 1)[0])
        if code in SUPPORTED_LANGUAGE_CODES:
            return code
    return None


def language_from_request(request, user=None):
    if user and getattr(user, "is_authenticated", False):
        preferred = normalize_language(getattr(user, "preferred_language", ""))
        if preferred:
            return preferred

    query_language = normalize_language(request.GET.get("lang") or request.GET.get("language"))
    if query_language:
        return query_language

    header_language = language_from_accept_header(request.headers.get("Accept-Language", ""))
    if header_language:
        return header_language

    return normalize_language(settings.LANGUAGE_CODE) or DEFAULT_LANGUAGE


def activate_request_language(request, user=None):
    language = language_from_request(request, user)
    translation.activate(language)
    request.LANGUAGE_CODE = language
    return language
