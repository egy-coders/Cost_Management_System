from django.contrib import admin

from .models import ClientPayment, Expense, Payment


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("project", "description", "expense_date", "total_amount", "paid_amount", "pending_amount", "approval_status", "payment_status")
    list_filter = ("approval_status", "payment_status", "expense_month", "project", "category")
    search_fields = ("description", "project__name", "vendor__name", "category__name")
    readonly_fields = ("amount_before_vat", "vat_amount", "total_amount", "paid_amount", "pending_amount", "payment_status", "expense_month")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("expense", "project", "payment_date", "amount", "payment_method", "reference_number")
    list_filter = ("payment_method", "payment_date", "project")
    search_fields = ("reference_number", "expense__description", "project__name")


@admin.register(ClientPayment)
class ClientPaymentAdmin(admin.ModelAdmin):
    list_display = ("project", "payment_type", "reference_number", "amount", "received_date")
    list_filter = ("payment_type", "received_date", "project")
    search_fields = ("reference_number", "project__name", "notes")
