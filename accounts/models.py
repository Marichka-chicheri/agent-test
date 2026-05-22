from django.db import models
from django.contrib.auth.models import User

from .encryption import decrypt_value, encrypt_value
from .persona import build_system_prompt


class UserAPIKey(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    gemini_api_key_encrypted = models.TextField(blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User API key"
        verbose_name_plural = "User API keys"

    def set_gemini_key(self, raw_key: str | None) -> None:
        key = (raw_key or "").strip()
        self.gemini_api_key_encrypted = encrypt_value(key) if key else ""

    def get_gemini_key(self) -> str:
        if not self.gemini_api_key_encrypted:
            return ""
        return decrypt_value(self.gemini_api_key_encrypted)

    def gemini_key_hint(self) -> str:
        key = self.get_gemini_key()
        if len(key) <= 8:
            return "••••••••" if key else ""
        return f"{key[:4]}…{key[-4:]}"

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key_encrypted)


class Agent(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255, default="AI Assistant")
    backstory = models.TextField(blank=True, default="")
    additional_context = models.TextField(blank=True, default="")
    tools = models.JSONField(default=list)
    max_iterations = models.PositiveSmallIntegerField(default=10)
    forbidden_topics = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def build_system_prompt(self) -> str:
        prompt = build_system_prompt(
            self.role,
            self.backstory,
            self.additional_context,
        )
        if self.forbidden_topics.strip():
            prompt += f"\n\nNever discuss these topics: {self.forbidden_topics.strip()}"
        return prompt


class AgentRun(models.Model):
    STATUS_RUNNING = "running"
    STATUS_DONE = "done"
    STATUS_ERROR = "error"

    STATUS_CHOICES = [
        (STATUS_RUNNING, "Running"),
        (STATUS_DONE, "Done"),
        (STATUS_ERROR, "Error"),
    ]

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="runs")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="agent_runs")
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RUNNING)
    steps = models.JSONField(default=list)
    result = models.TextField(blank=True, default="")
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
