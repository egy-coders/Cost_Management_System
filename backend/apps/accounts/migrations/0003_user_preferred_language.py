from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_alter_user_managers_alter_user_groups_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="preferred_language",
            field=models.CharField(
                choices=[("en", "English"), ("ar", "Arabic")],
                default="en",
                max_length=5,
            ),
        ),
    ]
