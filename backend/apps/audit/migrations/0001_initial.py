from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("finance", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApprovalLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(choices=[("CREATED", "Created"), ("SUBMITTED", "Submitted"), ("APPROVED", "Approved"), ("REJECTED", "Rejected"), ("UPDATED", "Updated"), ("PAYMENT_ADDED", "Payment added")], max_length=30)),
                ("from_status", models.CharField(blank=True, max_length=30)),
                ("to_status", models.CharField(blank=True, max_length=30)),
                ("comment", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expense", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="approval_logs", to="finance.expense")),
                ("user", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="approval_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
