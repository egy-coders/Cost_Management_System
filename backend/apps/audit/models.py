from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class ApprovalAction(models.TextChoices):
    CREATED = "CREATED", _("Created")
    SUBMITTED = "SUBMITTED", _("Submitted")
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")
    UPDATED = "UPDATED", _("Updated")
    PAYMENT_ADDED = "PAYMENT_ADDED", _("Payment added")


class ApprovalLog(models.Model):
    expense = models.ForeignKey("finance.Expense", on_delete=models.CASCADE, related_name="approval_logs")
    action = models.CharField(max_length=30, choices=ApprovalAction.choices)
    from_status = models.CharField(max_length=30, blank=True)
    to_status = models.CharField(max_length=30, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="approval_logs")
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.expense_id}"
