from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


MONEY_PLACES = Decimal("0.01")


def quantize_money(value):
    return Decimal(value or 0).quantize(MONEY_PLACES, rounding=ROUND_HALF_UP)


class ExpenseUnit(models.TextChoices):
    HR = "Hr", _("Hr")
    DAY = "Day", _("Day")
    MONTH = "Month", _("Month")
    PIECE = "Piece", _("Piece")
    KG = "KG", _("KG")
    TON = "Ton", _("Ton")
    LITER = "Liter", _("Liter")
    TRIP = "Trip", _("Trip")
    LUMP_SUM = "Lump Sum", _("Lump Sum")
    OTHER = "Other", _("Other")


class PaymentStatus(models.TextChoices):
    UNPAID = "UNPAID", _("Unpaid")
    PARTIALLY_PAID = "PARTIALLY_PAID", _("Partially paid")
    PAID = "PAID", _("Paid")


class ApprovalStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    SUBMITTED = "SUBMITTED", _("Submitted")
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")


class PaymentMethod(models.TextChoices):
    CASH = "CASH", _("Cash")
    BANK_TRANSFER = "BANK_TRANSFER", _("Bank transfer")
    CHEQUE = "CHEQUE", _("Cheque")
    CARD = "CARD", _("Card")
    OTHER = "OTHER", _("Other")


class ClientPaymentType(models.TextChoices):
    DOWN_PAYMENT = "DOWN_PAYMENT", _("Down payment")
    IPA = "IPA", "IPA"
    CLIENT_INVOICE = "CLIENT_INVOICE", _("Client invoice")
    ADVANCE = "ADVANCE", _("Advance")
    OTHER = "OTHER", _("Other")


class Expense(models.Model):
    project = models.ForeignKey("projects.Project", on_delete=models.PROTECT, related_name="expenses")
    category = models.ForeignKey("projects.CostCategory", on_delete=models.PROTECT, related_name="expenses")
    vendor = models.ForeignKey("projects.Vendor", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses")
    description = models.CharField(max_length=255)
    expense_date = models.DateField()
    expense_month = models.CharField(max_length=7, db_index=True, blank=True)
    quantity = models.DecimalField(max_digits=14, decimal_places=2)
    unit = models.CharField(max_length=20, choices=ExpenseUnit.choices, default=ExpenseUnit.OTHER)
    unit_rate = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_before_vat = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    vat_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    vat_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    pending_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=25, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.DRAFT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="expenses_created")
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses_approved")
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses_rejected")
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-expense_date", "-created_at"]
        indexes = [
            models.Index(fields=["project", "expense_month"]),
            models.Index(fields=["approval_status"]),
            models.Index(fields=["payment_status"]),
        ]

    def __str__(self):
        return f"{self.project} - {self.description}"

    def save(self, *args, **kwargs):
        self.expense_month = self.expense_date.strftime("%Y-%m") if self.expense_date else ""
        self.amount_before_vat = quantize_money(Decimal(self.quantity or 0) * Decimal(self.unit_rate or 0))
        self.vat_amount = quantize_money(self.amount_before_vat * Decimal(self.vat_percentage or 0) / Decimal("100"))
        self.total_amount = quantize_money(self.amount_before_vat + self.vat_amount)
        if not self.pk:
            self.pending_amount = self.total_amount
        super().save(*args, **kwargs)


class Payment(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.PROTECT, related_name="payments")
    project = models.ForeignKey("projects.Project", on_delete=models.PROTECT, related_name="payments")
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    reference_number = models.CharField(max_length=100, blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="payments_recorded")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return f"{self.amount} for expense {self.expense_id}"

    def save(self, *args, **kwargs):
        if self.expense_id and not self.project_id:
            self.project = self.expense.project
        super().save(*args, **kwargs)


class ClientPayment(models.Model):
    project = models.ForeignKey("projects.Project", on_delete=models.PROTECT, related_name="client_payments")
    payment_type = models.CharField(max_length=30, choices=ClientPaymentType.choices, default=ClientPaymentType.CLIENT_INVOICE)
    reference_number = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    received_date = models.DateField()
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="client_payments_recorded")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-received_date", "-created_at"]

    def __str__(self):
        return f"{self.payment_type} {self.amount} - {self.project}"
