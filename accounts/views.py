import sys
import threading
from pathlib import Path

from django.conf import settings
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .agent_executor import execute_agent_run
from .auth_utils import auth_response, get_api_keys_payload
from .models import Agent, AgentRun, RestAPIKey, UserAPIKey
from .rest_api_key_utils import generate_rest_api_key, hash_rest_api_key, key_display_prefix
from .serializers import (
    RegisterSerializer,
    AgentSerializer,
    AgentRunSerializer,
    UserAPIKeySerializer,
    RestAPIKeySerializer,
    RestAPIKeyCreateSerializer,
)
from .tool_utils import get_constructor_tools

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_ROOT = PROJECT_ROOT / "src"
for path in (str(SRC_ROOT), str(PROJECT_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        UserAPIKey.objects.get_or_create(user=user)
        return Response(auth_response(user), status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    user = authenticate(
        username=request.data.get("username"),
        password=request.data.get("password"),
    )

    if not user:
        return Response(
            {"error": "Wrong credentials"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    UserAPIKey.objects.get_or_create(user=user)
    return Response(auth_response(user))


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def api_keys(request):
    record, _ = UserAPIKey.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(get_api_keys_payload(request.user))

    serializer = UserAPIKeySerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if "gemini_api_key" in serializer.validated_data:
        record.set_gemini_key(serializer.validated_data["gemini_api_key"])
        record.save(update_fields=["gemini_api_key_encrypted", "updated_at"])

    return Response(get_api_keys_payload(request.user))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def rest_api_keys(request):
    if request.method == "GET":
        queryset = RestAPIKey.objects.filter(user=request.user, is_active=True)
        serializer = RestAPIKeySerializer(queryset, many=True)
        return Response(serializer.data)

    serializer = RestAPIKeyCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    limit = getattr(settings, "MAX_REST_API_KEYS_PER_USER", 10)
    active_count = RestAPIKey.objects.filter(user=request.user, is_active=True).count()
    if active_count >= limit:
        return Response(
            {"error": f"Maximum of {limit} active API keys allowed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    raw_key = generate_rest_api_key()
    record = RestAPIKey.objects.create(
        user=request.user,
        name=serializer.validated_data["name"],
        prefix=key_display_prefix(raw_key),
        key_hash=hash_rest_api_key(raw_key),
    )

    payload = RestAPIKeySerializer(record).data
    payload["key"] = raw_key
    return Response(payload, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def rest_api_key_revoke(request, key_id):
    record = get_object_or_404(RestAPIKey, pk=key_id, user=request.user)
    if record.is_active:
        record.is_active = False
        record.save(update_fields=["is_active"])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def tools_catalog(request):
    return Response(get_constructor_tools())


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def agents(request):
    if request.method == "POST":
        serializer = AgentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    queryset = Agent.objects.filter(owner=request.user)
    serializer = AgentSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def agent_run_start(request, agent_id):
    agent = get_object_or_404(Agent, pk=agent_id, owner=request.user)
    message = (request.data.get("message") or "").strip()

    if not message:
        return Response(
            {"error": "message is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        api_record = request.user.api_keys
    except UserAPIKey.DoesNotExist:
        api_record = None

    if not api_record or not api_record.gemini_configured:
        return Response(
            {
                "error": "Gemini API key is required. Add your key in Settings before running agents.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    run = AgentRun.objects.create(
        agent=agent,
        owner=request.user,
        message=message,
        status=AgentRun.STATUS_RUNNING,
    )

    thread = threading.Thread(
        target=execute_agent_run,
        args=(run.id,),
        daemon=True,
    )
    thread.start()

    return Response(
        {"run_id": run.id, "status": run.status},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def agent_run_detail(request, run_id):
    run = get_object_or_404(AgentRun, pk=run_id, owner=request.user)
    serializer = AgentRunSerializer(run)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def tool_approval_resolve(request, approval_id: str):
    """Approve or deny a pending tool call (see approval_manager)."""
    from approval_manager import approval_manager

    decision = (request.data.get("decision") or "").strip().lower()
    if decision not in ("approve", "deny"):
        return Response(
            {"error": "decision must be 'approve' or 'deny'"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    pending = approval_manager.get_pending(approval_id)
    if pending is None:
        return Response(
            {"error": "Approval not found or already resolved"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if decision == "approve":
        approval_manager.approve(approval_id)
    else:
        approval_manager.deny(approval_id)

    return Response({"approval_id": approval_id, "decision": decision})
