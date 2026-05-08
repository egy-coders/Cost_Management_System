from pathlib import Path
import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


def attachment_upload_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"attachments/{instance.related_type.lower()}/{uuid.uuid4()}{extension}"


class Attachment(models.Model):
    class RelatedType(models.TextChoices):
        EXPENSE = "EXPENSE", _("Expense")
        PAYMENT = "PAYMENT", _("Payment")
        CASH_IN = "CASH_IN", _("Cash in")

    file = models.FileField(upload_to=attachment_upload_path)
    original_file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20)
    file_size = models.PositiveBigIntegerField()
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="attachments_uploaded")
    related_type = models.CharField(max_length=20, choices=RelatedType.choices)
    related_id = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["related_type", "related_id"])]

    def __str__(self):
        return self.original_file_name
