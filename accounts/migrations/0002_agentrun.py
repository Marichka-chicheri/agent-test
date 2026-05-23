# Generated manually for AgentRun model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AgentRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("message", models.TextField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("running", "Running"),
                            ("done", "Done"),
                            ("error", "Error"),
                        ],
                        default="running",
                        max_length=20,
                    ),
                ),
                ("steps", models.JSONField(default=list)),
                ("result", models.TextField(blank=True, default="")),
                ("error", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "agent",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="runs",
                        to="accounts.agent",
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="agent_runs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
