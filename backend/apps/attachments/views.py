from django.http import FileResponse
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.accounts.permissions import is_admin
from apps.finance.models import ClientPayment, Expense, Payment
from apps.projects.selectors import assigned_project_ids, user_can_access_project

from .models import Attachment
from .serializers import AttachmentSerializer


class AttachmentViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = AttachmentSerializer
    filterset_fields = ["related_type", "related_id", "uploaded_by"]
    search_fields = ["original_file_name", "file_type"]
    ordering_fields = ["created_at", "file_size"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Attachment.objects.select_related("uploaded_by").all()
        if is_admin(self.request.user):
            return queryset
        project_ids = assigned_project_ids(self.request.user)
        expense_ids = Expense.objects.filter(project_id__in=project_ids).values_list("id", flat=True)
        payment_ids = Payment.objects.filter(project_id__in=project_ids).values_list("id", flat=True)
        cash_in_ids = ClientPayment.objects.filter(project_id__in=project_ids).values_list("id", flat=True)
        return queryset.filter(
            Q(related_type=Attachment.RelatedType.EXPENSE, related_id__in=expense_ids)
            | Q(related_type=Attachment.RelatedType.PAYMENT, related_id__in=payment_ids)
            | Q(related_type=Attachment.RelatedType.CASH_IN, related_id__in=cash_in_ids)
        )

    def create(self, request, *args, **kwargs):
        if request.user.role == UserRole.MANAGEMENT_VIEWER:
            return Response({"detail": _("Management viewers have read-only access.")}, status=status.HTTP_403_FORBIDDEN)
        if not self._can_attach_to_related(request):
            return Response({"detail": _("You are not assigned to the related record project.")}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        attachment = self.get_object()
        response = FileResponse(attachment.file.open("rb"), as_attachment=True, filename=attachment.original_file_name)
        return response

    def destroy(self, request, *args, **kwargs):
        if request.user.role == UserRole.MANAGEMENT_VIEWER:
            return Response({"detail": _("Management viewers have read-only access.")}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def _can_attach_to_related(self, request):
        related_type = request.data.get("related_type")
        related_id = request.data.get("related_id")
        if not related_type or not related_id:
            return True
        if is_admin(request.user):
            return True
        project_id = None
        if related_type == Attachment.RelatedType.EXPENSE:
            project_id = Expense.objects.filter(id=related_id).values_list("project_id", flat=True).first()
        elif related_type == Attachment.RelatedType.PAYMENT:
            project_id = Payment.objects.filter(id=related_id).values_list("project_id", flat=True).first()
        elif related_type == Attachment.RelatedType.CASH_IN:
            project_id = ClientPayment.objects.filter(id=related_id).values_list("project_id", flat=True).first()
        return bool(project_id and user_can_access_project(request.user, project_id))
