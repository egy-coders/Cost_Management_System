from django.contrib import admin

from .models import Attachment


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("original_file_name", "related_type", "related_id", "file_type", "file_size", "uploaded_by", "created_at")
    list_filter = ("related_type", "file_type")
    search_fields = ("original_file_name", "uploaded_by__email")
