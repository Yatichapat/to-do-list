from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, DashboardStatsView, TaskViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="tasks")
router.register(r"categories", CategoryViewSet, basename="categories")

urlpatterns = router.urls + [
    path("stats/", DashboardStatsView.as_view()),
]