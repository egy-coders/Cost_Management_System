from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class ProjectStatus(models.TextChoices):
    ACTIVE = "ACTIVE", _("Active")
    ON_HOLD = "ON_HOLD", _("On hold")
    COMPLETED = "COMPLETED", _("Completed")
    CANCELLED = "CANCELLED", _("Cancelled")


class Project(models.Model):
    name = models.CharField(max_length=180)
    code = models.CharField(max_length=60, unique=True)
    client_name = models.CharField(max_length=180)
    location = models.CharField(max_length=180, blank=True)
    description = models.TextField(blank=True)
    currency = models.CharField(max_length=10, default="SAR")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=ProjectStatus.choices, default=ProjectStatus.ACTIVE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="projects_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_memberships")
    role_in_project = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "user")
        ordering = ["project__name", "user__name"]

    def __str__(self):
        return f"{self.user} on {self.project}"


class CostCategory(models.Model):
    name = models.CharField(max_length=120, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Cost categories"

    def __str__(self):
        return self.name


class VendorType(models.TextChoices):
    SUPPLIER = "SUPPLIER", _("Supplier")
    SUBCONTRACTOR = "SUBCONTRACTOR", _("Subcontractor")
    EQUIPMENT_PROVIDER = "EQUIPMENT_PROVIDER", _("Equipment provider")
    LABOUR_TEAM = "LABOUR_TEAM", _("Labour team")
    TRANSPORTATION_PROVIDER = "TRANSPORTATION_PROVIDER", _("Transportation provider")
    OTHER = "OTHER", _("Other")


class Vendor(models.Model):
    name = models.CharField(max_length=180)
    vendor_type = models.CharField(max_length=40, choices=VendorType.choices, default=VendorType.OTHER)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    tax_number = models.CharField(max_length=80, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
