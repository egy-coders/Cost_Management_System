from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CostCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("code", models.CharField(max_length=50, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"verbose_name_plural": "Cost categories", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Vendor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=180)),
                (
                    "vendor_type",
                    models.CharField(
                        choices=[
                            ("SUPPLIER", "Supplier"),
                            ("SUBCONTRACTOR", "Subcontractor"),
                            ("EQUIPMENT_PROVIDER", "Equipment provider"),
                            ("LABOUR_TEAM", "Labour team"),
                            ("TRANSPORTATION_PROVIDER", "Transportation provider"),
                            ("OTHER", "Other"),
                        ],
                        default="OTHER",
                        max_length=40,
                    ),
                ),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("address", models.TextField(blank=True)),
                ("tax_number", models.CharField(blank=True, max_length=80)),
                ("notes", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=180)),
                ("code", models.CharField(max_length=60, unique=True)),
                ("client_name", models.CharField(max_length=180)),
                ("location", models.CharField(blank=True, max_length=180)),
                ("description", models.TextField(blank=True)),
                ("currency", models.CharField(default="AED", max_length=10)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("ACTIVE", "Active"),
                            ("ON_HOLD", "On hold"),
                            ("COMPLETED", "Completed"),
                            ("CANCELLED", "Cancelled"),
                        ],
                        default="ACTIVE",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="projects_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="ProjectMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role_in_project", models.CharField(blank=True, max_length=80)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="members", to="projects.project")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_memberships", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["project__name", "user__name"], "unique_together": {("project", "user")}},
        ),
    ]
