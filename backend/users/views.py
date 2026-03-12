import os

import requests
from django.contrib.auth.models import User
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


def _build_jwt_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
    }


class GoogleLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response(
                {"detail": "Missing Google token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verify_response = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": token},
            timeout=10,
        )

        if verify_response.status_code != 200:
            return Response(
                {"detail": "Invalid Google token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = verify_response.json()
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        if google_client_id and payload.get("aud") != google_client_id:
            return Response(
                {"detail": "Google token audience mismatch"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = payload.get("email")
        if not email:
            return Response(
                {"detail": "Google account email not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username_base = email.split("@")[0]
        username = username_base
        suffix = 1
        while User.objects.filter(username=username).exclude(email=email).exists():
            username = f"{username_base}{suffix}"
            suffix += 1

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "first_name": payload.get("given_name", ""),
                "last_name": payload.get("family_name", ""),
            },
        )

        if not created:
            user.first_name = payload.get("given_name", user.first_name)
            user.last_name = payload.get("family_name", user.last_name)
            user.save(update_fields=["first_name", "last_name"])

        return Response(_build_jwt_response(user), status=status.HTTP_200_OK)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = [{"id": user.id, "username": user.username, "email": user.email}]
        return Response(data, status=status.HTTP_200_OK)
