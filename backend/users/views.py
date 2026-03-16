import os

import requests
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
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
        token = (
            request.data.get("token")
            or request.data.get("credential")
            or request.data.get("id_token")
        )
        if isinstance(token, str):
            token = token.strip().strip('"')
            if token.lower().startswith("bearer "):
                token = token.split(" ", 1)[1].strip()

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
            google_error = ""
            try:
                google_error = verify_response.json().get("error_description") or verify_response.json().get("error") or ""
            except ValueError:
                google_error = verify_response.text[:200]

            return Response(
                {
                    "detail": "Invalid Google token",
                    "google_status": verify_response.status_code,
                    "google_error": google_error,
                },
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


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password1 = (request.data.get("password1") or "").strip()
        password2 = (request.data.get("password2") or "").strip()

        if not email or not password1 or not password2:
            return Response(
                {"detail": "Email and password fields are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password1 != password2:
            return Response(
                {"detail": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "This email is already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password1)
        except ValidationError as exc:
            return Response(
                {"detail": exc.messages[0] if exc.messages else "Password is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username_base = email.split("@")[0] if "@" in email else "user"
        username = username_base or "user"
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{username_base}{suffix}"
            suffix += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
        )

        return Response(_build_jwt_response(user), status=status.HTTP_201_CREATED)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = [{"id": user.id, "username": user.username, "email": user.email}]
        return Response(data, status=status.HTTP_200_OK)
