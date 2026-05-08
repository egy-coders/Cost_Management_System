from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", _("Admin")
    SITE_ENGINEER = "SITE_ENGINEER", _("Site Engineer")
    PROJECT_MANAGER = "PROJECT_MANAGER", _("Project Manager")
    ACCOUNTANT = "ACCOUNTANT", _("Accountant / Finance")
    MANAGEMENT_VIEWER = "MANAGEMENT_VIEWER", _("Management Viewer")


class SupportedLanguage(models.TextChoices):
    ENGLISH = "en", _("English")
    ARABIC = "ar", _("Arabic")


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError(_("Email is required"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", UserRole.SITE_ENGINEER)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("name", "System Admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.SITE_ENGINEER)
    preferred_language = models.CharField(
        max_length=5,
        choices=SupportedLanguage.choices,
        default=SupportedLanguage.ENGLISH,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        ordering = ["name", "email"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name or self.email

    @property
    def is_admin_role(self):
        return self.role == UserRole.ADMIN or self.is_superuser
