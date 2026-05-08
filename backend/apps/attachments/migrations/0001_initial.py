from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import apps.attachments.models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Attachment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to=apps.attachments.models.attachment_upload_path)),
                ("original_file_name", models.CharField(max_length=255)),
                ("file_type", models.CharField(max_length=20)),
                ("file_size", models.PositiveBigIntegerField()),
                ("related_type", models.CharField(choices=[("EXPENSE", "Expense"), ("PAYMENT", "Payment"), ("CASH_IN", "Cash in")], max_length=20)),
                ("related_id", models.PositiveBigIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("uploaded_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="attachments_uploaded", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["related_type", "related_id"], name="attachment_related_dbcbb8_idx")],
            },
        ),
    ]
