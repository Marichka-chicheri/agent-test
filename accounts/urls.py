from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    register,
    login,
    api_keys,
    rest_api_keys,
    rest_api_key_revoke,
    agents,
    agent_run_start,
    agent_run_detail,
)

urlpatterns = [
    path("api/register/", register),
    path("api/login/", login),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/api-keys/", api_keys),
    path("api/rest-keys/", rest_api_keys),
    path("api/rest-keys/<int:key_id>/", rest_api_key_revoke),
    path("api/agents/", agents),
    path("api/agents/<int:agent_id>/run/", agent_run_start),
    path("api/runs/<int:run_id>/", agent_run_detail),
]
