from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import SupportedLanguage, User, UserRole


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "password",
            "role",
            "preferred_language",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_role(self, value):
        if value not in UserRole.values:
            raise serializers.ValidationError(_("Invalid role."))
        return value

    def validate_preferred_language(self, value):
        if value not in SupportedLanguage.values:
            raise serializers.ValidationError(_("Invalid language."))
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        user.set_password(password or "ChangeMe123!")
        if user.role == UserRole.ADMIN:
            user.is_staff = True
            user.is_superuser = True
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        if instance.role == UserRole.ADMIN:
            instance.is_staff = True
            instance.is_superuser = True
        elif "role" in validated_data:
            instance.is_staff = False
            instance.is_superuser = False
        instance.save()
        return instance


class MeSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = ["id", "name", "email", "role", "preferred_language", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "name", "email", "role", "is_active", "created_at", "updated_at"]


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email") or attrs.get("username")
        password = attrs.get("password")
        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )
        if not user:
            raise serializers.ValidationError(_("Invalid email or password."))
        if not user.is_active:
            raise serializers.ValidationError(_("User account is inactive."))

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": MeSerializer(user).data,
        }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["name"] = user.name
        token["role"] = user.role
        token["preferred_language"] = user.preferred_language
        return token
