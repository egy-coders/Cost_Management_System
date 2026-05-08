from rest_framework import serializers

from apps.accounts.serializers import MeSerializer

from .models import ApprovalLog


class ApprovalLogSerializer(serializers.ModelSerializer):
    user_detail = MeSerializer(source="user", read_only=True)

    class Meta:
        model = ApprovalLog
        fields = [
            "id",
            "expense",
            "action",
            "from_status",
            "to_status",
            "user",
            "user_detail",
            "comment",
            "created_at",
        ]
        read_only_fields = fields
