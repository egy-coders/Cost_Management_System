from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Expense",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("description", models.CharField(max_length=255)),
                ("expense_date", models.DateField()),
                ("expense_month", models.CharField(blank=True, db_index=True, max_length=7)),
                ("quantity", models.DecimalField(decimal_places=2, max_digits=14)),
                ("unit", models.CharField(choices=[("Hr", "Hr"), ("Day", "Day"), ("Month", "Month"), ("Piece", "Piece"), ("KG", "KG"), ("Ton", "Ton"), ("Liter", "Liter"), ("Trip", "Trip"), ("Lump Sum", "Lump Sum"), ("Other", "Other")], default="Other", max_length=20)),
                ("unit_rate", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("amount_before_vat", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("vat_percentage", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("vat_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("paid_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("pending_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("payment_status", models.CharField(choices=[("UNPAID", "Unpaid"), ("PARTIALLY_PAID", "Partially paid"), ("PAID", "Paid")], default="UNPAID", max_length=25)),
                ("approval_status", models.CharField(choices=[("DRAFT", "Draft"), ("SUBMITTED", "Submitted"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], default="DRAFT", max_length=20)),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("rejected_at", models.DateTimeField(blank=True, null=True)),
                ("rejection_reason", models.TextField(blank=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("approved_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="expenses_approved", to=settings.AUTH_USER_MODEL)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="expenses", to="projects.costcategory")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="expenses_created", to=settings.AUTH_USER_MODEL)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="expenses", to="projects.project")),
                ("rejected_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="expenses_rejected", to=settings.AUTH_USER_MODEL)),
                ("vendor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="expenses", to="projects.vendor")),
            ],
            options={
                "ordering": ["-expense_date", "-created_at"],
                "indexes": [
                    models.Index(fields=["project", "expense_month"], name="finance_exp_project_1d7dc7_idx"),
                    models.Index(fields=["approval_status"], name="finance_exp_approva_f0da3e_idx"),
                    models.Index(fields=["payment_status"], name="finance_exp_payment_b50183_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="ClientPayment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("payment_type", models.CharField(choices=[("DOWN_PAYMENT", "Down payment"), ("IPA", "IPA"), ("CLIENT_INVOICE", "Client invoice"), ("ADVANCE", "Advance"), ("OTHER", "Other")], default="CLIENT_INVOICE", max_length=30)),
                ("reference_number", models.CharField(blank=True, max_length=100)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("received_date", models.DateField()),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="client_payments", to="projects.project")),
                ("received_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="client_payments_recorded", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-received_date", "-created_at"]},
        ),
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("payment_date", models.DateField()),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("payment_method", models.CharField(choices=[("CASH", "Cash"), ("BANK_TRANSFER", "Bank transfer"), ("CHEQUE", "Cheque"), ("CARD", "Card"), ("OTHER", "Other")], default="CASH", max_length=30)),
                ("reference_number", models.CharField(blank=True, max_length=100)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("expense", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments", to="finance.expense")),
                ("paid_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="payments_recorded", to=settings.AUTH_USER_MODEL)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments", to="projects.project")),
            ],
            options={"ordering": ["-payment_date", "-created_at"]},
        ),
    ]
