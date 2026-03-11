from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Task
from .serializers import CategorySerializer, TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Task.objects.filter(user=self.request.user)
            .select_related("category")
            .prefetch_related("assigned_users")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(user=request.user)
        now = timezone.now()
        due_soon = tasks.filter(
            due_date__gte=now,
            due_date__lte=now + timedelta(days=7),
            status__in=["pending", "progress"],
        )
        by_category = {}
        for task in tasks.select_related("category"):
            name = task.category.name if task.category else "Uncategorized"
            by_category[name] = by_category.get(name, 0) + 1

        return Response({
            "total": tasks.count(),
            "pending": tasks.filter(status="pending").count(),
            "in_progress": tasks.filter(status="progress").count(),
            "completed": tasks.filter(status="done").count(),
            "due_soon": due_soon.count(),
            "by_category": by_category,
        })