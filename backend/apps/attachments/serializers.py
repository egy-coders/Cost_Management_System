from pathlib import Path

from django.conf import settings
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.accounts.serializers import MeSerializer

from .models import Attachment


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = MeSerializer(source="uploaded_by", read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = [
            "id",
            "file",
            "download_url",
            "original_file_name",
            "file_type",
            "file_size",
            "uploaded_by",
            "uploaded_by_detail",
            "related_type",
            "related_id",
            "created_at",
        ]
        read_only_fields = ["id", "original_file_name", "file_type", "file_size", "uploaded_by", "created_at"]

    def get_download_url(self, obj):
        request = self.context.get("request")
        url = f"/api/attachments/{obj.id}/download/"
        return request.build_absolute_uri(url) if request else url

    def validate_file(self, file):
        extension = Path(file.name).suffix.lower().replace(".", "")
        if extension not in settings.ATTACHMENT_ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(_("File type is not allowed."))
        max_bytes = settings.ATTACHMENT_MAX_FILE_SIZE_MB * 1024 * 1024
        if file.size > max_bytes:
            raise serializers.ValidationError(_("File size exceeds %(size)s MB.") % {"size": settings.ATTACHMENT_MAX_FILE_SIZE_MB})
        return file

    def validate_related_type(self, value):
        if value not in Attachment.RelatedType.values:
            raise serializers.ValidationError(_("Invalid related type."))
        return value

    def create(self, validated_data):
        file = validated_data["file"]
        extension = Path(file.name).suffix.lower().replace(".", "")
        validated_data["original_file_name"] = file.name
        validated_data["file_type"] = extension
        validated_data["file_size"] = file.size
        validated_data["uploaded_by"] = self.context["request"].user
        return super().create(validated_data)
