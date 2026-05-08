from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase

from apps.accounts.models import User, UserRole
from apps.dashboard.services import overview_totals
from apps.finance.models import ApprovalStatus, ClientPayment, Expense, PaymentStatus
from apps.finance.services import approve_expense, record_payment, submit_expense
from apps.projects.models import CostCategory, Project, ProjectMember, Vendor, VendorType
from apps.reports.services import monthly_cost_report


class FinanceFixtureMixin:
    def setUp(self):
        self.admin = User.objects.create_user("admin@test.com", "Password123!", name="Admin", role=UserRole.ADMIN, is_staff=True)
        self.engineer = User.objects.create_user("engineer@test.com", "Password123!", name="Engineer", role=UserRole.SITE_ENGINEER)
        self.pm = User.objects.create_user("pm@test.com", "Password123!", name="PM", role=UserRole.PROJECT_MANAGER)
        self.accountant = User.objects.create_user("accountant@test.com", "Password123!", name="Accountant", role=UserRole.ACCOUNTANT)
        self.viewer = User.objects.create_user("viewer@test.com", "Password123!", name="Viewer", role=UserRole.MANAGEMENT_VIEWER)
        self.project = Project.objects.create(name="RAK Project", code="RAK-T", client_name="Client", created_by=self.admin)
        for user in [self.engineer, self.pm, self.accountant, self.viewer]:
            ProjectMember.objects.create(project=self.project, user=user, role_in_project=user.role)
        self.category = CostCategory.objects.create(name="Equipment", code="EQUIPMENT")
        self.labour = CostCategory.objects.create(name="Labour & Staff", code="LABOUR")
        self.vendor = Vendor.objects.create(name="MAGED", vendor_type=VendorType.EQUIPMENT_PROVIDER)

    def make_expense(self, **overrides):
        data = {
            "project": self.project,
            "category": self.category,
            "vendor": self.vendor,
            "description": "Backhoe loader with operator",
            "expense_date": date(2026, 2, 8),
            "quantity": Decimal("250"),
            "unit": "Hr",
            "unit_rate": Decimal("63.46"),
            "vat_percentage": Decimal("15"),
            "created_by": self.engineer,
        }
        data.update(overrides)
        return Expense.objects.create(**data)


class ExpenseCalculationTests(FinanceFixtureMixin, TestCase):
    def test_expense_calculation(self):
        expense = self.make_expense()

        self.assertEqual(expense.amount_before_vat, Decimal("15865.00"))
        self.assertEqual(expense.vat_amount, Decimal("2379.75"))
        self.assertEqual(expense.total_amount, Decimal("18244.75"))
        self.assertEqual(expense.pending_amount, Decimal("18244.75"))
        self.assertEqual(expense.payment_status, PaymentStatus.UNPAID)

    def test_payment_calculation(self):
        expense = self.make_expense()
        submit_expense(expense, self.engineer)
        approve_expense(expense, self.pm)

        record_payment({"expense": expense, "payment_date": date(2026, 2, 20), "amount": Decimal("5000.00")}, self.accountant)
        expense.refresh_from_db()

        self.assertEqual(expense.paid_amount, Decimal("5000.00"))
        self.assertEqual(expense.pending_amount, Decimal("13244.75"))
        self.assertEqual(expense.payment_status, PaymentStatus.PARTIALLY_PAID)

    def test_payment_cannot_exceed_pending_amount(self):
        expense = self.make_expense()
        submit_expense(expense, self.engineer)
        approve_expense(expense, self.pm)

        with self.assertRaises(Exception):
            record_payment({"expense": expense, "payment_date": date(2026, 2, 20), "amount": Decimal("99999.00")}, self.accountant)

    def test_approval_workflow(self):
        expense = self.make_expense()
        submit_expense(expense, self.engineer)
        expense.refresh_from_db()
        self.assertEqual(expense.approval_status, ApprovalStatus.SUBMITTED)

        approve_expense(expense, self.pm)
        expense.refresh_from_db()
        self.assertEqual(expense.approval_status, ApprovalStatus.APPROVED)
        self.assertEqual(expense.approval_logs.count(), 2)

    def test_dashboard_totals_and_cash_in(self):
        expense = self.make_expense()
        submit_expense(expense, self.engineer)
        approve_expense(expense, self.pm)
        record_payment({"expense": expense, "payment_date": date(2026, 2, 20), "amount": Decimal("5000.00")}, self.accountant)
        ClientPayment.objects.create(project=self.project, payment_type="DOWN_PAYMENT", amount=Decimal("20000.00"), received_date=date(2026, 2, 1), received_by=self.accountant)

        totals = overview_totals(self.admin, {"project": self.project.id})

        self.assertEqual(totals["total_cash_in"], Decimal("20000.00"))
        self.assertEqual(totals["total_cash_out"], Decimal("18244.75"))
        self.assertEqual(totals["total_paid"], Decimal("5000.00"))
        self.assertEqual(totals["cash_balance"], Decimal("15000.00"))

    def test_report_filtering(self):
        self.make_expense(expense_date=date(2026, 2, 8))
        self.make_expense(description="March diesel", expense_date=date(2026, 3, 8), quantity=Decimal("10"), unit_rate=Decimal("10"))

        report = monthly_cost_report(self.admin, {"month": "2026-02"})

        self.assertEqual(len(report), 1)
        self.assertEqual(report[0]["month"], "2026-02")


class PermissionApiTests(FinanceFixtureMixin, APITestCase):
    def test_viewer_cannot_create_expense(self):
        self.client.force_authenticate(self.viewer)
        response = self.client.post(
            "/api/expenses/",
            {
                "project": self.project.id,
                "category": self.category.id,
                "vendor": self.vendor.id,
                "description": "Blocked",
                "expense_date": "2026-02-08",
                "quantity": "1",
                "unit": "Day",
                "unit_rate": "100",
                "vat_percentage": "15",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_accountant_can_create_payment_for_approved_expense(self):
        expense = self.make_expense()
        submit_expense(expense, self.engineer)
        approve_expense(expense, self.pm)
        self.client.force_authenticate(self.accountant)

        response = self.client.post(
            "/api/payments/",
            {
                "expense": expense.id,
                "payment_date": "2026-02-20",
                "amount": "5000.00",
                "payment_method": "BANK_TRANSFER",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        expense.refresh_from_db()
        self.assertEqual(expense.pending_amount, Decimal("13244.75"))
