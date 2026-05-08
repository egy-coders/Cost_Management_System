import django_filters

from .models import ClientPayment, Expense, Payment


class ExpenseFilter(django_filters.FilterSet):
    month = django_filters.CharFilter(field_name="expense_month")
    date_from = django_filters.DateFilter(field_name="expense_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="expense_date", lookup_expr="lte")
    min_amount = django_filters.NumberFilter(field_name="total_amount", lookup_expr="gte")
    max_amount = django_filters.NumberFilter(field_name="total_amount", lookup_expr="lte")

    class Meta:
        model = Expense
        fields = [
            "project",
            "category",
            "vendor",
            "month",
            "date_from",
            "date_to",
            "approval_status",
            "payment_status",
            "created_by",
            "min_amount",
            "max_amount",
        ]


class PaymentFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="payment_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="payment_date", lookup_expr="lte")
    vendor = django_filters.NumberFilter(field_name="expense__vendor_id")

    class Meta:
        model = Payment
        fields = ["project", "expense", "vendor", "date_from", "date_to", "payment_method"]


class ClientPaymentFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="received_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="received_date", lookup_expr="lte")
    month = django_filters.CharFilter(method="filter_month")

    class Meta:
        model = ClientPayment
        fields = ["project", "payment_type", "date_from", "date_to", "month"]

    def filter_month(self, queryset, name, value):
        if not value:
            return queryset
        year, month = value.split("-")
        return queryset.filter(received_date__year=year, received_date__month=month)
