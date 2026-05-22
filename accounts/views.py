from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from .models import Agent
from .serializers import RegisterSerializer, AgentSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        token = RefreshToken.for_user(user)

        return Response({
            "access": str(token.access_token),
            "refresh": str(token)
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    user = authenticate(
        username=request.data.get('username'),
        password=request.data.get('password')
    )

    if not user:
        return Response(
            {'error': 'Wrong credentials'},
            status=status.HTTP_400_BAD_REQUEST
        )

    token = RefreshToken.for_user(user)

    return Response({
        "access": str(token.access_token),
        "refresh": str(token)
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def agents(request):

    if request.method == 'POST':
        serializer = AgentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    queryset = Agent.objects.filter(owner=request.user)
    serializer = AgentSerializer(queryset, many=True)

    return Response(serializer.data)