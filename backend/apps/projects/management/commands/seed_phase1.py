from decimal import Decimal
from datetime import date

from django.core.management.base import BaseCommand

from apps.accounts.models import User, UserRole
from apps.finance.models import ApprovalStatus, ClientPayment, ClientPaymentType, Expense, PaymentMethod
from apps.finance.services import approve_expense, record_payment, submit_expense
from apps.projects.models import CostCategory, Project, ProjectMember, Vendor, VendorType


DEFAULT_PASSWORD = "Password123!"


class Command(BaseCommand):
    help = "Seed Phase 1 sample users, project, master data, expenses, cash-in, and payments."

    def handle(self, *args, **options):
        users = self.seed_users()
        categories = self.seed_categories()
        vendors = self.seed_vendors()
        project = self.seed_project(users["admin"])
        for user in users.values():
            ProjectMember.objects.get_or_create(project=project, user=user, defaults={"role_in_project": user.role})
        expenses = self.seed_expenses(project, users["site_engineer"], categories, vendors)
        self.seed_cash_in(project, users["accountant"])
        self.seed_payments(expenses, users)
        self.stdout.write(self.style.SUCCESS("Phase 1 seed data created."))
        self.stdout.write("Default password for all seed users: Password123!")

    def seed_users(self):
        specs = {
            "admin": ("Admin User", "admin@example.com", UserRole.ADMIN),
            "site_engineer": ("Site Engineer", "engineer@example.com", UserRole.SITE_ENGINEER),
            "project_manager": ("Project Manager", "pm@example.com", UserRole.PROJECT_MANAGER),
            "accountant": ("Accountant", "accountant@example.com", UserRole.ACCOUNTANT),
            "viewer": ("Management Viewer", "viewer@example.com", UserRole.MANAGEMENT_VIEWER),
        }
        users = {}
        for key, (name, email, role) in specs.items():
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"name": name, "role": role, "is_staff": role == UserRole.ADMIN, "is_superuser": role == UserRole.ADMIN},
            )
            if created:
                user.set_password(DEFAULT_PASSWORD)
                user.save()
            if role == UserRole.ADMIN and (not user.is_staff or not user.is_superuser):
                user.is_staff = True
                user.is_superuser = True
                user.save(update_fields=["is_staff", "is_superuser", "updated_at"])
            users[key] = user
        return users

    def seed_categories(self):
        names = [
            "Labour & Staff",
            "Materials",
            "Equipment",
            "Accommodation",
            "Transportation",
            "Subcontractors",
            "Inspection",
            "Procurement",
            "Other",
        ]
        categories = {}
        for name in names:
            code = name.upper().replace("&", "AND").replace(" ", "_")
            category, _ = CostCategory.objects.get_or_create(code=code, defaults={"name": name})
            categories[name] = category
        return categories

    def seed_vendors(self):
        specs = [
            ("MAGED", VendorType.EQUIPMENT_PROVIDER),
            ("Ismail Team", VendorType.LABOUR_TEAM),
            ("Abo Moaz", VendorType.LABOUR_TEAM),
            ("Modern Team", VendorType.SUBCONTRACTOR),
            ("Transportation Supplier", VendorType.TRANSPORTATION_PROVIDER),
        ]
        vendors = {}
        for name, vendor_type in specs:
            vendor, _ = Vendor.objects.get_or_create(name=name, defaults={"vendor_type": vendor_type})
            vendors[name] = vendor
        return vendors

    def seed_project(self, admin):
        project, _ = Project.objects.get_or_create(
            code="RAK-001",
            defaults={
                "name": "RAK Project",
                "client_name": "RAK Client",
                "location": "Ras Al Khaimah",
                "description": "Sample construction project based on the legacy cost sheet.",
                "currency": "SAR",
                "start_date": date(2026, 1, 1),
                "status": "ACTIVE",
                "created_by": admin,
            },
        )
        return project

    def seed_expenses(self, project, engineer, categories, vendors):
        specs = [
            ("Carpenter labour", "Labour & Staff", "Ismail Team", date(2026, 1, 5), 30, "Day", 120, 15),
            ("Steel fixer labour", "Labour & Staff", "Abo Moaz", date(2026, 1, 9), 28, "Day", 135, 15),
            ("Helper labour", "Labour & Staff", "Ismail Team", date(2026, 1, 12), 42, "Day", 80, 15),
            ("Forklift rental", "Equipment", "MAGED", date(2026, 2, 2), 85, "Hr", 45, 15),
            ("Backhoe loader with operator", "Equipment", "MAGED", date(2026, 2, 8), 250, "Hr", Decimal("63.46"), 15),
            ("Diesel", "Materials", "MAGED", date(2026, 2, 15), 1200, "Liter", Decimal("3.2"), 15),
            ("Bus rent", "Transportation", "Transportation Supplier", date(2026, 3, 1), 1, "Month", 5500, 15),
            ("Accommodation", "Accommodation", "Modern Team", date(2026, 3, 5), 1, "Month", 9000, 15),
            ("Fire extinguishers", "Procurement", "Modern Team", date(2026, 3, 11), 12, "Piece", 150, 15),
            ("Concrete", "Materials", "Modern Team", date(2026, 3, 18), 120, "Ton", 310, 15),
        ]
        expenses = {}
        for description, category_name, vendor_name, expense_date, quantity, unit, unit_rate, vat in specs:
            expense, created = Expense.objects.get_or_create(
                project=project,
                description=description,
                expense_date=expense_date,
                defaults={
                    "category": categories[category_name],
                    "vendor": vendors[vendor_name],
                    "quantity": Decimal(str(quantity)),
                    "unit": unit,
                    "unit_rate": Decimal(str(unit_rate)),
                    "vat_percentage": Decimal(str(vat)),
                    "created_by": engineer,
                },
            )
            expenses[description] = expense
        return expenses

    def seed_cash_in(self, project, accountant):
        specs = [
            (ClientPaymentType.DOWN_PAYMENT, "5% Down Payment", Decimal("75000.00"), date(2026, 1, 15)),
            (ClientPaymentType.IPA, "IPA01", Decimal("125000.00"), date(2026, 3, 20)),
        ]
        for payment_type, reference, amount, received_date in specs:
            ClientPayment.objects.get_or_create(
                project=project,
                reference_number=reference,
                defaults={
                    "payment_type": payment_type,
                    "amount": amount,
                    "received_date": received_date,
                    "received_by": accountant,
                },
            )

    def seed_payments(self, expenses, users):
        for key in ["Backhoe loader with operator", "Carpenter labour", "Diesel", "Concrete"]:
            expense = expenses[key]
            if expense.approval_status == ApprovalStatus.DRAFT:
                submit_expense(expense, users["site_engineer"])
            if expense.approval_status == ApprovalStatus.SUBMITTED:
                approve_expense(expense, users["project_manager"])

        payment_specs = [
            ("Backhoe loader with operator", Decimal("5000.00"), date(2026, 2, 20), "PAY-BHL-001"),
            ("Carpenter labour", Decimal("2500.00"), date(2026, 1, 20), "PAY-LAB-001"),
            ("Diesel", Decimal("1800.00"), date(2026, 2, 22), "PAY-DIESEL-001"),
        ]
        for description, amount, payment_date, reference in payment_specs:
            expense = expenses[description]
            if not expense.payments.filter(reference_number=reference).exists():
                record_payment(
                    {
                        "expense": expense,
                        "payment_date": payment_date,
                        "amount": amount,
                        "payment_method": PaymentMethod.BANK_TRANSFER,
                        "reference_number": reference,
                        "notes": "Seed payment",
                    },
                    users["accountant"],
                )
