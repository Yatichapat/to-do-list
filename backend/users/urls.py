from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import GoogleLoginView, RegisterView, UserListView

urlpatterns = [
    path("login/", TokenObtainPairView.as_view()),
    path("register/", RegisterView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("google-login/", GoogleLoginView.as_view()),
    path("users/", UserListView.as_view()),
]
