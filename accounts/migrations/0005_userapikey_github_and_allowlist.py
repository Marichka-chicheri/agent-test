from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_restapikey"),
    ]

    operations = [
        migrations.AddField(
            model_name="userapikey",
            name="github_token_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="userapikey",
            name="github_token_valid",
            field=models.BooleanField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="userapikey",
            name="approval_allowlist",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
