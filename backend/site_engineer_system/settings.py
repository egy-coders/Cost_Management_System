from datetime import timedelta
import os
from pathlib import Path

import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent


def load_env_file(path, override=False):
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if override or key not in os.environ:
            os.environ[key] = value.strip().strip('"').strip("'")


load_env_file(BASE_DIR.parent / ".env")
load_env_file(BASE_DIR / ".env")


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return csv_list(os.getenv(name, default))


def csv_list(value):
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def first_env(*names, default=None):
    for name in names:
        value = os.getenv(name)
        if value not in [None, ""]:
            return value
    return default


def sqlite_database_config():
    return {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }


def build_database_config():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return dj_database_url.parse(
            database_url,
            conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", "600")),
        )

    explicit_engine = os.getenv("DB_ENGINE", "").strip().lower()
    if explicit_engine in {"sqlite", "sqlite3"}:
        return sqlite_database_config()

    legacy_postgres_env_present = any(os.getenv(name) for name in ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_HOST"])
    use_postgres = explicit_engine in {"postgres", "postgresql"} or (not explicit_engine and legacy_postgres_env_present)

    if use_postgres:
        return {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": first_env("DB_NAME", "POSTGRES_DB", default="site_engineer_management"),
            "USER": first_env("DB_USER", "POSTGRES_USER", default="site_engineer"),
            "PASSWORD": first_env("DB_PASSWORD", "POSTGRES_PASSWORD", default="site_engineer_password"),
            "HOST": first_env("DB_HOST", "POSTGRES_HOST", default="db"),
            "PORT": first_env("DB_PORT", "POSTGRES_PORT", default="5432"),
        }

    return sqlite_database_config()


SECRET_KEY = first_env("DJANGO_SECRET_KEY", "SECRET_KEY", default="dev-only-change-me")
DEBUG = env_bool("DJANGO_DEBUG", env_bool("DEBUG", False))
ALLOWED_HOSTS = csv_list(
    first_env(
        "DJANGO_ALLOWED_HOSTS",
        "ALLOWED_HOSTS",
        default="localhost,127.0.0.1,backend,.railway.app,.up.railway.app",
    )
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "apps.accounts",
    "apps.projects",
    "apps.finance",
    "apps.attachments",
    "apps.audit",
    "apps.dashboard",
    "apps.reports",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "apps.accounts.middleware.UserLocaleMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "site_engineer_system.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "site_engineer_system.wsgi.application"

DATABASES = {"default": build_database_config()}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("ar", "Arabic"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = os.getenv("TIME_ZONE", "Africa/Cairo")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.accounts.authentication.LocalizedJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": int(os.getenv("API_PAGE_SIZE", "20")),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

ATTACHMENT_MAX_FILE_SIZE_MB = int(os.getenv("ATTACHMENT_MAX_FILE_SIZE_MB", "10"))
ATTACHMENT_ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "xlsx", "docx"}
