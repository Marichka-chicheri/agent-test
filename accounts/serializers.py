from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Agent


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'name', 'system_prompt', 'tools', 'created_at']
        read_only_fields = ['id', 'created_at']