from django.contrib import admin

from .models import ApprovalLog


@admin.register(ApprovalLog)
class ApprovalLogAdmin(admin.ModelAdmin):
    list_display = ("expense", "action", "from_status", "to_status", "user", "created_at")
    list_filter = ("action", "from_status", "to_status")
    search_fields = ("expense__description", "user__email", "comment")
