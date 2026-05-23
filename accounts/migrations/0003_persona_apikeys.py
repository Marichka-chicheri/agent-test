from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def migrate_system_prompt_to_persona(apps, schema_editor):
    Agent = apps.get_model("accounts", "Agent")
    for agent in Agent.objects.all():
        legacy_prompt = getattr(agent, "system_prompt", "") or ""
        if legacy_prompt and not agent.backstory:
            agent.role = agent.role or "AI Assistant"
            agent.backstory = legacy_prompt
        if not agent.role:
            agent.role = "AI Assistant"
        agent.save()


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0002_agentrun"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserAPIKey",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("gemini_api_key_encrypted", models.TextField(blank=True, default="")),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="api_keys",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "User API key",
                "verbose_name_plural": "User API keys",
            },
        ),
        migrations.AddField(
            model_name="agent",
            name="role",
            field=models.CharField(default="AI Assistant", max_length=255),
        ),
        migrations.AddField(
            model_name="agent",
            name="backstory",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agent",
            name="additional_context",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="agent",
            name="max_iterations",
            field=models.PositiveSmallIntegerField(default=10),
        ),
        migrations.AddField(
            model_name="agent",
            name="forbidden_topics",
            field=models.CharField(blank=True, default="", max_length=500),
        ),
        migrations.RunPython(migrate_system_prompt_to_persona, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="agent",
            name="system_prompt",
        ),
    ]
