from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class AssignedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    assigned_users_detail = AssignedUserSerializer(
        source="assigned_users", many=True, read_only=True
    )

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "due_date",
            "category", "category_name",
            "assigned_users", "assigned_users_detail",
            "user", "created_at",
        ]
        read_only_fields = ["user", "created_at"]