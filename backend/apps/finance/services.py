from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from apps.accounts.models import UserRole
from apps.audit.models import ApprovalAction, ApprovalLog

from .models import ApprovalStatus, Expense, Payment, PaymentStatus, quantize_money


def update_expense_payment_totals(expense):
    totals = expense.payments.aggregate(total=Sum("amount"))
    paid_amount = quantize_money(totals["total"] or Decimal("0"))
    expense.paid_amount = paid_amount
    expense.pending_amount = quantize_money(expense.total_amount - paid_amount)
    if paid_amount <= 0:
        expense.payment_status = PaymentStatus.UNPAID
    elif paid_amount < expense.total_amount:
        expense.payment_status = PaymentStatus.PARTIALLY_PAID
    else:
        expense.payment_status = PaymentStatus.PAID
    expense.save(update_fields=["paid_amount", "pending_amount", "payment_status", "updated_at"])
    return expense


def create_approval_log(expense, action, user, from_status="", to_status="", comment=""):
    return ApprovalLog.objects.create(
        expense=expense,
        action=action,
        from_status=from_status or "",
        to_status=to_status or "",
        user=user,
        comment=comment or "",
    )


@transaction.atomic
def submit_expense(expense, user):
    if expense.approval_status not in [ApprovalStatus.DRAFT, ApprovalStatus.REJECTED]:
        raise ValidationError(_("Only draft or rejected expenses can be submitted."))
    from_status = expense.approval_status
    expense.approval_status = ApprovalStatus.SUBMITTED
    expense.submitted_at = timezone.now()
    expense.rejection_reason = ""
    expense.save(update_fields=["approval_status", "submitted_at", "rejection_reason", "updated_at"])
    create_approval_log(expense, ApprovalAction.SUBMITTED, user, from_status, ApprovalStatus.SUBMITTED)
    return expense


@transaction.atomic
def approve_expense(expense, user, comment=""):
    if expense.approval_status != ApprovalStatus.SUBMITTED:
        raise ValidationError(_("Only submitted expenses can be approved."))
    from_status = expense.approval_status
    expense.approval_status = ApprovalStatus.APPROVED
    expense.approved_by = user
    expense.approved_at = timezone.now()
    expense.rejected_by = None
    expense.rejected_at = None
    expense.rejection_reason = ""
    expense.save(
        update_fields=[
            "approval_status",
            "approved_by",
            "approved_at",
            "rejected_by",
            "rejected_at",
            "rejection_reason",
            "updated_at",
        ]
    )
    create_approval_log(expense, ApprovalAction.APPROVED, user, from_status, ApprovalStatus.APPROVED, comment)
    return expense


@transaction.atomic
def reject_expense(expense, user, reason):
    if expense.approval_status != ApprovalStatus.SUBMITTED:
        raise ValidationError(_("Only submitted expenses can be rejected."))
    if not reason:
        raise ValidationError(_("Rejection reason is required."))
    from_status = expense.approval_status
    expense.approval_status = ApprovalStatus.REJECTED
    expense.rejected_by = user
    expense.rejected_at = timezone.now()
    expense.rejection_reason = reason
    expense.approved_by = None
    expense.approved_at = None
    expense.save(
        update_fields=[
            "approval_status",
            "rejected_by",
            "rejected_at",
            "rejection_reason",
            "approved_by",
            "approved_at",
            "updated_at",
        ]
    )
    create_approval_log(expense, ApprovalAction.REJECTED, user, from_status, ApprovalStatus.REJECTED, reason)
    return expense


def validate_payment_business_rules(expense, amount, user):
    if amount <= 0:
        raise ValidationError({"amount": _("Payment amount must be greater than zero.")})
    if expense.approval_status in [ApprovalStatus.DRAFT, ApprovalStatus.REJECTED]:
        raise ValidationError(_("Cannot pay draft or rejected expenses."))
    if expense.approval_status != ApprovalStatus.APPROVED:
        raise ValidationError(_("Only approved expenses can be paid."))
    pending = quantize_money(expense.pending_amount)
    if amount > pending and user.role != UserRole.ADMIN and not user.is_superuser:
        raise ValidationError({"amount": _("Payment exceeds the pending amount.")})


@transaction.atomic
def record_payment(validated_data, user):
    expense = validated_data["expense"]
    amount = quantize_money(validated_data["amount"])
    validate_payment_business_rules(expense, amount, user)
    payment = Payment.objects.create(paid_by=user, project=expense.project, **validated_data)
    update_expense_payment_totals(expense)
    create_approval_log(expense, ApprovalAction.PAYMENT_ADDED, user, expense.approval_status, expense.approval_status, _("Payment %(amount)s") % {"amount": payment.amount})
    return payment


@transaction.atomic
def delete_payment(payment):
    expense = payment.expense
    payment.delete()
    update_expense_payment_totals(expense)
