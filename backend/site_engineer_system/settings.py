from datetime import timedelta
import os
from pathlib import Path
from urllib.parse import urlparse


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
load_env_file(BASE_DIR / ".env", override=True)


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def csv_list(value):
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def first_env(*names, default=None):
    for name in names:
        value = os.getenv(name)
        if value not in [None, ""]:
            return value
    return default


def database_from_url(database_url):
    parsed = urlparse(database_url)
    if parsed.scheme in {"postgres", "postgresql"}:
        return {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed.path.lstrip("/"),
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "",
            "PORT": str(parsed.port or 5432),
        }
    if parsed.scheme == "sqlite":
        db_path = parsed.path or "db.sqlite3"
        if db_path.startswith("/") and len(db_path) > 1 and db_path[2:3] == ":":
            db_path = db_path[1:]
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": db_path if db_path == ":memory:" else str(Path(db_path)),
        }
    raise ValueError("Unsupported DATABASE_URL scheme.")


def build_database_config():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_from_url(database_url)

    explicit_engine = os.getenv("DB_ENGINE", "").lower()
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

    return {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }


SECRET_KEY = first_env("DJANGO_SECRET_KEY", "SECRET_KEY", default="dev-only-change-me")
DEBUG = env_bool("DJANGO_DEBUG", env_bool("DEBUG", True))
ALLOWED_HOSTS = csv_list(first_env("DJANGO_ALLOWED_HOSTS", "ALLOWED_HOSTS", default="localhost,127.0.0.1,backend"))

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
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
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

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOW_CREDENTIALS = True

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
