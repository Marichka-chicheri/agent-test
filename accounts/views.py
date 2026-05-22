import threading

from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .agent_executor import execute_agent_run
from .auth_utils import auth_response, get_api_keys_payload
from .models import Agent, AgentRun, UserAPIKey
from .serializers import (
    RegisterSerializer,
    AgentSerializer,
    AgentRunSerializer,
    UserAPIKeySerializer,
)


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
