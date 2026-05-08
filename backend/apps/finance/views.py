from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import UserRole
from apps.accounts.permissions import is_admin
from apps.attachments.models import Attachment
from apps.attachments.serializers import AttachmentSerializer
from apps.audit.serializers import ApprovalLogSerializer
from apps.projects.models import Project
from apps.projects.selectors import filter_projects_for_user, user_can_access_project

from .filters import ClientPaymentFilter, ExpenseFilter, PaymentFilter
from .models import ApprovalStatus, ClientPayment, Expense, Payment
from .serializers import ClientPaymentSerializer, ExpenseSerializer, PaymentSerializer
from .services import approve_expense, create_approval_log, delete_payment, reject_expense, submit_expense


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    filterset_class = ExpenseFilter
    search_fields = ["description", "vendor__name", "category__name", "project__name"]
    ordering_fields = ["expense_date", "total_amount", "paid_amount", "pending_amount", "approval_status", "payment_status", "created_at"]
    ordering = ["-expense_date", "-created_at"]

    def get_queryset(self):
        project_qs = filter_projects_for_user(Project.objects.all(), self.request.user)
        queryset = Expense.objects.select_related("project", "category", "vendor", "created_by", "approved_by", "rejected_by").filter(project__in=project_qs)
        if self.request.user.role == UserRole.SITE_ENGINEER and not is_admin(self.request.user):
            queryset = queryset.filter(created_by=self.request.user)
        return queryset

    def create(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.ADMIN, UserRole.SITE_ENGINEER] and not request.user.is_superuser:
            return Response({"detail": _("Only site engineers or admins can create expenses.")}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        expense = serializer.save(created_by=self.request.user, approval_status=ApprovalStatus.DRAFT)
        create_approval_log(expense, "CREATED", self.request.user, "", expense.approval_status)

    def update(self, request, *args, **kwargs):
        expense = self.get_object()
        if request.user.role == UserRole.MANAGEMENT_VIEWER:
            return Response({"detail": _("Management viewers have read-only access.")}, status=status.HTTP_403_FORBIDDEN)
        if not is_admin(request.user) and expense.approval_status == ApprovalStatus.APPROVED:
            return Response({"detail": _("Approved expenses cannot be edited by non-admin users.")}, status=status.HTTP_400_BAD_REQUEST)
        response = super().update(request, *args, **kwargs)
        create_approval_log(self.get_object(), "UPDATED", request.user, expense.approval_status, self.get_object().approval_status)
        return response

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        expense = self.get_object()
        if not (is_admin(request.user) or expense.created_by_id == request.user.id):
            return Response({"detail": _("Only the creator or admin can submit this expense.")}, status=status.HTTP_403_FORBIDDEN)
        submit_expense(expense, request.user)
        return Response(self.get_serializer(expense).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        expense = self.get_object()
        if not (is_admin(request.user) or request.user.role == UserRole.PROJECT_MANAGER):
            return Response({"detail": _("Only project managers or admins can approve expenses.")}, status=status.HTTP_403_FORBIDDEN)
        if not user_can_access_project(request.user, expense.project_id):
            return Response({"detail": _("You are not assigned to this project.")}, status=status.HTTP_403_FORBIDDEN)
        approve_expense(expense, request.user, request.data.get("comment", ""))
        return Response(self.get_serializer(expense).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        expense = self.get_object()
        if not (is_admin(request.user) or request.user.role == UserRole.PROJECT_MANAGER):
            return Response({"detail": _("Only project managers or admins can reject expenses.")}, status=status.HTTP_403_FORBIDDEN)
        if not user_can_access_project(request.user, expense.project_id):
            return Response({"detail": _("You are not assigned to this project.")}, status=status.HTTP_403_FORBIDDEN)
        reject_expense(expense, request.user, request.data.get("rejection_reason", ""))
        return Response(self.get_serializer(expense).data)

    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        expense = self.get_object()
        return Response(PaymentSerializer(expense.payments.select_related("expense", "project", "paid_by"), many=True, context={"request": request}).data)

    @action(detail=True, methods=["get"])
    def attachments(self, request, pk=None):
        expense = self.get_object()
        attachments = Attachment.objects.filter(related_type=Attachment.RelatedType.EXPENSE, related_id=expense.id)
        return Response(AttachmentSerializer(attachments, many=True, context={"request": request}).data)

    @action(detail=True, methods=["get"], url_path="approval-logs")
    def approval_logs(self, request, pk=None):
        expense = self.get_object()
        return Response(ApprovalLogSerializer(expense.approval_logs.select_related("user"), many=True).data)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    filterset_class = PaymentFilter
    search_fields = ["reference_number", "expense__description", "project__name", "expense__vendor__name"]
    ordering_fields = ["payment_date", "amount", "created_at"]
    ordering = ["-payment_date", "-created_at"]

    def get_queryset(self):
        projects = filter_projects_for_user(Project.objects.all(), self.request.user)
        return Payment.objects.select_related("expense", "project", "paid_by", "expense__vendor", "expense__category").filter(project__in=projects)

    def create(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT] and not request.user.is_superuser:
            return Response({"detail": _("Only accountant/finance or admin can create payments.")}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT] and not request.user.is_superuser:
            return Response({"detail": _("Only accountant/finance or admin can update payments.")}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT] and not request.user.is_superuser:
            return Response({"detail": _("Only accountant/finance or admin can delete payments.")}, status=status.HTTP_403_FORBIDDEN)
        payment = self.get_object()
        delete_payment(payment)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClientPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = ClientPaymentSerializer
    filterset_class = ClientPaymentFilter
    search_fields = ["reference_number", "project__name", "notes"]
    ordering_fields = ["received_date", "amount", "created_at"]
    ordering = ["-received_date", "-created_at"]

    def get_queryset(self):
        projects = filter_projects_for_user(Project.objects.all(), self.request.user)
        return ClientPayment.objects.select_related("project", "received_by").filter(project__in=projects)

    def create(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT] and not request.user.is_superuser:
            return Response({"detail": _("Only accountant/finance or admin can create cash-in records.")}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)

    def update(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT] and not request.user.is_superuser:
            return Response({"detail": _("Only accountant/finance or admin can update cash-in records.")}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
