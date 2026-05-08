from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import UserChangeForm, UserCreationForm
from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    ordering = ("email",)
    list_display = ("email", "name", "role", "preferred_language", "is_active", "is_staff")
    list_filter = ("role", "preferred_language", "is_active", "is_staff")
    search_fields = ("email", "name")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("name", "role", "preferred_language")}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "role", "preferred_language", "password1", "password2", "is_staff", "is_superuser"),
            },
        ),
    )
