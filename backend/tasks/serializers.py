from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class TaggedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    tag_users_detail = TaggedUserSerializer(
        source="tag_users", many=True, read_only=True
    )
    tag_users = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Task
        fields = [
            "id", "title", "description", "status", "due_date",
            "category", "category_name",
            "tag_users", "tag_users_detail",
            "user", "created_at",
        ]
        read_only_fields = ["user", "created_at"]

    def validate_category(self, value):
        if value is None:
            return value

        request = self.context.get("request")
        if request and value.user_id != request.user.id:
            raise serializers.ValidationError("Invalid category for this user")

        return value