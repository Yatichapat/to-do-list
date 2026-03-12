from datetime import timedelta

from django.db.models import Count
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
            .prefetch_related("tag_users")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_tasks = Task.objects.filter(user=request.user)
        now = timezone.now()

        status_counts = {
            row["status"]: row["count"]
            for row in user_tasks.values("status").annotate(count=Count("id"))
        }

        category_counts = {
            (row["category__name"] or "Uncategorized"): row["count"]
            for row in user_tasks.values("category__name").annotate(count=Count("id"))
        }

        due_soon_qs = (
            user_tasks.filter(
                due_date__gte=now,
                due_date__lte=now + timedelta(days=7),
                status__in=[Task.Status.PENDING, Task.Status.IN_PROGRESS],
            )
            .select_related("category")
            .order_by("due_date")
        )

        due_soon_tasks = [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status,
                "due_date": t.due_date,
                "category_name": t.category.name if t.category else None,
            }
            for t in due_soon_qs[:10]
        ]

        return Response({
            "total": user_tasks.count(),
            "pending": status_counts.get(Task.Status.PENDING, 0),
            "in_progress": status_counts.get(Task.Status.IN_PROGRESS, 0),
            "completed": status_counts.get(Task.Status.DONE, 0),
            "due_soon": due_soon_qs.count(),
            "due_soon_tasks": due_soon_tasks,
            "by_category": category_counts,
        })