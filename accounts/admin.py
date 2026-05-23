from django.contrib import admin

from .models import Agent, AgentRun, UserAPIKey


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "role", "owner", "created_at")
    search_fields = ("name", "role", "owner__username")


@admin.register(AgentRun)
class AgentRunAdmin(admin.ModelAdmin):
    list_display = ("id", "agent", "owner", "status", "created_at")
    list_filter = ("status",)


@admin.register(UserAPIKey)
class UserAPIKeyAdmin(admin.ModelAdmin):
    list_display = ("user", "gemini_configured", "updated_at")

    @admin.display(boolean=True)
    def gemini_configured(self, obj):
        return obj.gemini_configured
