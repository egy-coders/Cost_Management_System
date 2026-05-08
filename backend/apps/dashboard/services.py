from collections import defaultdict
from decimal import Decimal

from django.db.models import Count, DecimalField, Sum, Value
from django.db.models.functions import Coalesce

from apps.finance.models import ApprovalStatus, ClientPayment, Expense
from apps.projects.models import Project
from apps.projects.selectors import filter_projects_for_user


ZERO = Decimal("0.00")


def zero_money_value():
    return Value(ZERO, output_field=DecimalField(max_digits=14, decimal_places=2))


def money_sum(field):
    return Coalesce(Sum(field), zero_money_value(), output_field=DecimalField(max_digits=14, decimal_places=2))


def money(value):
    return value or ZERO


def expense_base_queryset(user, params=None):
    params = params or {}
    projects = filter_projects_for_user(Project.objects.all(), user)
    qs = Expense.objects.select_related("project", "category", "vendor").filter(project__in=projects)
    project_id = params.get("project") or params.get("project_id")
    month = params.get("month")
    date_from = params.get("date_from")
    date_to = params.get("date_to")
    category = params.get("category")
    vendor = params.get("vendor")
    if project_id:
        qs = qs.filter(project_id=project_id)
    if month:
        qs = qs.filter(expense_month=month)
    if date_from:
        qs = qs.filter(expense_date__gte=date_from)
    if date_to:
        qs = qs.filter(expense_date__lte=date_to)
    if category:
        qs = qs.filter(category_id=category)
    if vendor:
        qs = qs.filter(vendor_id=vendor)
    return qs


def cash_in_base_queryset(user, params=None):
    params = params or {}
    projects = filter_projects_for_user(Project.objects.all(), user)
    qs = ClientPayment.objects.select_related("project").filter(project__in=projects)
    project_id = params.get("project") or params.get("project_id")
    month = params.get("month")
    date_from = params.get("date_from")
    date_to = params.get("date_to")
    if project_id:
        qs = qs.filter(project_id=project_id)
    if month:
        year, month_number = month.split("-")
        qs = qs.filter(received_date__year=year, received_date__month=month_number)
    if date_from:
        qs = qs.filter(received_date__gte=date_from)
    if date_to:
        qs = qs.filter(received_date__lte=date_to)
    return qs


def overview_totals(user, params=None):
    expenses = expense_base_queryset(user, params)
    cash_in = cash_in_base_queryset(user, params)
    expense_totals = expenses.aggregate(
        total_cash_out=money_sum("total_amount"),
        total_paid=money_sum("paid_amount"),
        expense_count=Count("id"),
    )
    total_cash_in = cash_in.aggregate(total=money_sum("amount"))["total"]
    total_cash_out = money(expense_totals["total_cash_out"])
    total_paid = money(expense_totals["total_paid"])
    total_pending = total_cash_out - total_paid
    return {
        "total_cash_in": total_cash_in,
        "total_cash_out": total_cash_out,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "cash_balance": total_cash_in - total_paid,
        "project_cost_gap": total_cash_in - total_cash_out,
        "number_of_expenses": expense_totals["expense_count"],
        "number_of_pending_expenses": expenses.filter(approval_status=ApprovalStatus.SUBMITTED).count(),
        "number_of_approved_expenses": expenses.filter(approval_status=ApprovalStatus.APPROVED).count(),
        "number_of_rejected_expenses": expenses.filter(approval_status=ApprovalStatus.REJECTED).count(),
    }


def monthly_costs(user, params=None):
    expenses = expense_base_queryset(user, params)
    cash_in = cash_in_base_queryset(user, params)
    rows = defaultdict(lambda: {"month": "", "cash_in": ZERO, "cash_out": ZERO, "paid": ZERO, "pending": ZERO, "expense_count": 0})
    for row in expenses.values("expense_month").annotate(
        cash_out=money_sum("total_amount"),
        paid=money_sum("paid_amount"),
        count=Count("id"),
    ).order_by("expense_month"):
        month = row["expense_month"]
        rows[month]["month"] = month
        rows[month]["cash_out"] = row["cash_out"]
        rows[month]["paid"] = row["paid"]
        rows[month]["pending"] = row["cash_out"] - row["paid"]
        rows[month]["expense_count"] = row["count"]
    for payment in cash_in:
        month = payment.received_date.strftime("%Y-%m")
        rows[month]["month"] = month
        rows[month]["cash_in"] += payment.amount
    return [rows[key] for key in sorted(rows.keys())]


def category_costs(user, params=None):
    expenses = expense_base_queryset(user, params)
    return list(
        expenses.values("category_id", "category__name")
        .annotate(total=money_sum("total_amount"), paid=money_sum("paid_amount"))
        .order_by("-total")
    )


def paid_vs_pending(user, params=None):
    totals = overview_totals(user, params)
    return [{"name": "Paid", "value": totals["total_paid"]}, {"name": "Pending", "value": totals["total_pending"]}]


def top_vendors(user, params=None, limit=10):
    expenses = expense_base_queryset(user, params).filter(vendor__isnull=False)
    return list(
        expenses.values("vendor_id", "vendor__name")
        .annotate(total=money_sum("total_amount"), paid=money_sum("paid_amount"), pending=money_sum("pending_amount"))
        .order_by("-total")[:limit]
    )


def status_breakdown(user, field, params=None):
    expenses = expense_base_queryset(user, params)
    return list(expenses.values(field).annotate(count=Count("id"), total=money_sum("total_amount")).order_by(field))


def build_project_summary(user, project_id):
    params = {"project": project_id}
    totals = overview_totals(user, params)
    project = filter_projects_for_user(Project.objects.all(), user).get(id=project_id)
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "code": project.code,
            "client_name": project.client_name,
            "location": project.location,
            "status": project.status,
            "currency": project.currency,
        },
        "totals": totals,
        "category_costs": category_costs(user, params),
        "monthly_costs": monthly_costs(user, params),
        "paid_vs_pending": paid_vs_pending(user, params),
        "top_vendors": top_vendors(user, params),
    }
