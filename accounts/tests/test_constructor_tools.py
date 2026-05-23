from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Agent
from accounts.tool_utils import get_constructor_tools, validate_tools_list


class ConstructorToolsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tooluser", password="pass12345")
        self.client = APIClient()
        token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    def test_catalog_returns_tools_with_id(self):
        response = self.client.get("/api/tools/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("tools", payload)
        self.assertGreater(len(payload["tools"]), 0)
        first = payload["tools"][0]
        self.assertIn("id", first)
        self.assertIn("name", first)
        self.assertEqual(first["id"], first["name"])

    def test_create_agent_persists_tools(self):
        response = self.client.post(
            "/api/agents/",
            {
                "name": "Tester",
                "role": "Assistant",
                "backstory": "Helps validate tool persistence in tests.",
                "tools": ["web_search", "run_python"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        agent_id = response.json()["id"]
        agent = Agent.objects.get(pk=agent_id)
        self.assertEqual(agent.tools, ["web_search", "run_python"])

    def test_patch_agent_updates_tools(self):
        agent = Agent.objects.create(
            owner=self.user,
            name="Patch Me",
            role="Assistant",
            backstory="Agent used for patch tool tests here.",
            tools=["web_search"],
        )
        response = self.client.patch(
            f"/api/agents/{agent.id}/",
            {"tools": ["http_request", "read_document"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        agent.refresh_from_db()
        self.assertEqual(agent.tools, ["http_request", "read_document"])

    def test_agent_detail_not_found_for_other_user(self):
        other = User.objects.create_user(username="other", password="pass12345")
        agent = Agent.objects.create(
            owner=other,
            name="Private",
            role="Assistant",
            backstory="Owned by another user for authorization test.",
        )
        response = self.client.get(f"/api/agents/{agent.id}/")
        self.assertEqual(response.status_code, 404)

    def test_validate_tools_rejects_unknown(self):
        with self.assertRaises(ValueError):
            validate_tools_list(["not_a_real_tool"])

    def test_catalog_matches_declarations_or_fallback(self):
        catalog = get_constructor_tools()
        names = {item["name"] for item in catalog}
        self.assertIn("web_search", names)
        self.assertIn("run_python", names)
