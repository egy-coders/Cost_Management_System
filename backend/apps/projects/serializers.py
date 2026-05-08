from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from apps.accounts.serializers import MeSerializer

from .models import CostCategory, Project, ProjectMember, ProjectStatus, Vendor, VendorType


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_detail = MeSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = ["id", "project", "user", "user_detail", "role_in_project", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProjectSerializer(serializers.ModelSerializer):
    created_by_detail = MeSerializer(source="created_by", read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "code",
            "client_name",
            "location",
            "description",
            "currency",
            "start_date",
            "end_date",
            "status",
            "created_by",
            "created_by_detail",
            "members",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate_status(self, value):
        if value not in ProjectStatus.values:
            raise serializers.ValidationError(_("Invalid project status."))
        return value


class CostCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCategory
        fields = ["id", "name", "code", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            "id",
            "name",
            "vendor_type",
            "phone",
            "email",
            "address",
            "tax_number",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_vendor_type(self, value):
        if value not in VendorType.values:
            raise serializers.ValidationError(_("Invalid vendor type."))
        return value
