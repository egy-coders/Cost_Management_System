from decimal import Decimal

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from apps.accounts.serializers import MeSerializer
from apps.projects.serializers import CostCategorySerializer, ProjectSerializer, VendorSerializer
from apps.projects.selectors import user_can_access_project

from .models import (
    ApprovalStatus,
    ClientPayment,
    ClientPaymentType,
    Expense,
    ExpenseUnit,
    Payment,
    PaymentMethod,
    quantize_money,
)
from .services import record_payment, update_expense_payment_totals


class ExpenseSerializer(serializers.ModelSerializer):
    project_detail = ProjectSerializer(source="project", read_only=True)
    category_detail = CostCategorySerializer(source="category", read_only=True)
    vendor_detail = VendorSerializer(source="vendor", read_only=True)
    created_by_detail = MeSerializer(source="created_by", read_only=True)
    approved_by_detail = MeSerializer(source="approved_by", read_only=True)
    rejected_by_detail = MeSerializer(source="rejected_by", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "project",
            "project_detail",
            "category",
            "category_detail",
            "vendor",
            "vendor_detail",
            "description",
            "expense_date",
            "expense_month",
            "quantity",
            "unit",
            "unit_rate",
            "amount_before_vat",
            "vat_percentage",
            "vat_amount",
            "total_amount",
            "paid_amount",
            "pending_amount",
            "payment_status",
            "approval_status",
            "created_by",
            "created_by_detail",
            "submitted_at",
            "approved_by",
            "approved_by_detail",
            "approved_at",
            "rejected_by",
            "rejected_by_detail",
            "rejected_at",
            "rejection_reason",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "expense_month",
            "amount_before_vat",
            "vat_amount",
            "total_amount",
            "paid_amount",
            "pending_amount",
            "payment_status",
            "created_by",
            "submitted_at",
            "approved_by",
            "approved_at",
            "rejected_by",
            "rejected_at",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]

    def validate_unit(self, value):
        if value not in ExpenseUnit.values:
            raise serializers.ValidationError(_("Invalid unit."))
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project") or getattr(self.instance, "project", None)
        if project and request and not user_can_access_project(request.user, project.id):
            raise serializers.ValidationError(_("You are not assigned to this project."))
        if attrs.get("quantity", getattr(self.instance, "quantity", None)) is not None:
            quantity = Decimal(attrs.get("quantity", getattr(self.instance, "quantity", 0)))
            if quantity <= 0:
                raise serializers.ValidationError({"quantity": _("Quantity must be greater than zero.")})
        unit_rate = Decimal(attrs.get("unit_rate", getattr(self.instance, "unit_rate", 0)) or 0)
        if unit_rate < 0:
            raise serializers.ValidationError({"unit_rate": _("Unit rate must be zero or greater.")})
        vat_percentage = Decimal(attrs.get("vat_percentage", getattr(self.instance, "vat_percentage", 0)) or 0)
        if vat_percentage < 0 or vat_percentage > 100:
            raise serializers.ValidationError({"vat_percentage": _("VAT percentage must be between 0 and 100.")})
        return attrs

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        update_expense_payment_totals(instance)
        return instance


class ExpensePreviewSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=14, decimal_places=2)
    unit_rate = serializers.DecimalField(max_digits=14, decimal_places=2)
    vat_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)

    def to_representation(self, instance):
        amount_before_vat = quantize_money(Decimal(instance["quantity"]) * Decimal(instance["unit_rate"]))
        vat_amount = quantize_money(amount_before_vat * Decimal(instance["vat_percentage"]) / Decimal("100"))
        return {
            "amount_before_vat": amount_before_vat,
            "vat_amount": vat_amount,
            "total_amount": quantize_money(amount_before_vat + vat_amount),
        }


class PaymentSerializer(serializers.ModelSerializer):
    expense_detail = ExpenseSerializer(source="expense", read_only=True)
    project_detail = ProjectSerializer(source="project", read_only=True)
    paid_by_detail = MeSerializer(source="paid_by", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "expense",
            "expense_detail",
            "project",
            "project_detail",
            "payment_date",
            "amount",
            "payment_method",
            "reference_number",
            "paid_by",
            "paid_by_detail",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project", "paid_by", "created_at", "updated_at"]

    def validate_payment_method(self, value):
        if value not in PaymentMethod.values:
            raise serializers.ValidationError(_("Invalid payment method."))
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        expense = attrs.get("expense") or getattr(self.instance, "expense", None)
        if not expense:
            raise serializers.ValidationError({"expense": _("Expense is required.")})
        if self.instance and expense.id != self.instance.expense_id:
            raise serializers.ValidationError({"expense": _("Changing the linked expense is not supported.")})
        if request and not user_can_access_project(request.user, expense.project_id):
            raise serializers.ValidationError(_("You are not assigned to this project."))
        amount = Decimal(attrs.get("amount", getattr(self.instance, "amount", 0)) or 0)
        if amount <= 0:
            raise serializers.ValidationError({"amount": _("Payment amount must be greater than zero.")})
        if expense.approval_status in [ApprovalStatus.DRAFT, ApprovalStatus.REJECTED]:
            raise serializers.ValidationError(_("Cannot pay draft or rejected expense."))
        if expense.approval_status != ApprovalStatus.APPROVED:
            raise serializers.ValidationError(_("Only approved expenses can be paid."))
        if self.instance:
            existing_amount = Decimal(self.instance.amount or 0)
            pending_with_existing = expense.pending_amount + existing_amount
            if request and amount > pending_with_existing and request.user.role != "ADMIN" and not request.user.is_superuser:
                raise serializers.ValidationError({"amount": _("Payment exceeds the pending amount.")})
        return attrs

    def create(self, validated_data):
        return record_payment(validated_data, self.context["request"].user)

    def update(self, instance, validated_data):
        old_expense = instance.expense
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.project = instance.expense.project
        instance.save()
        update_expense_payment_totals(old_expense)
        if instance.expense_id != old_expense.id:
            update_expense_payment_totals(instance.expense)
        return instance


class ClientPaymentSerializer(serializers.ModelSerializer):
    project_detail = ProjectSerializer(source="project", read_only=True)
    received_by_detail = MeSerializer(source="received_by", read_only=True)

    class Meta:
        model = ClientPayment
        fields = [
            "id",
            "project",
            "project_detail",
            "payment_type",
            "reference_number",
            "amount",
            "received_date",
            "received_by",
            "received_by_detail",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "received_by", "created_at", "updated_at"]

    def validate_payment_type(self, value):
        if value not in ClientPaymentType.values:
            raise serializers.ValidationError(_("Invalid cash-in payment type."))
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        project = attrs.get("project") or getattr(self.instance, "project", None)
        if not project:
            raise serializers.ValidationError({"project": _("Project is required.")})
        if request and not user_can_access_project(request.user, project.id):
            raise serializers.ValidationError(_("You are not assigned to this project."))
        amount = Decimal(attrs.get("amount", getattr(self.instance, "amount", 0)) or 0)
        if amount <= 0:
            raise serializers.ValidationError({"amount": _("Amount must be greater than zero.")})
        return attrs
