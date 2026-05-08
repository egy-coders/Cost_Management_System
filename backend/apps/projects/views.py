from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import UserRole
from apps.accounts.permissions import IsAdminOrReadOnly, is_admin
from apps.dashboard.services import build_project_summary

from .models import CostCategory, Project, ProjectMember, Vendor
from .selectors import filter_projects_for_user
from .serializers import CostCategorySerializer, ProjectMemberSerializer, ProjectSerializer, VendorSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["status", "client_name", "location"]
    search_fields = ["name", "code", "client_name", "location"]
    ordering_fields = ["name", "code", "client_name", "status", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        return filter_projects_for_user(Project.objects.select_related("created_by").prefetch_related("members__user"), self.request.user)

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        ProjectMember.objects.get_or_create(project=project, user=self.request.user, defaults={"role_in_project": self.request.user.role})

    @action(detail=True, methods=["get"], url_path="summary")
    def summary(self, request, pk=None):
        project = self.get_object()
        return Response(build_project_summary(request.user, project_id=project.id))


class ProjectMemberViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["project", "user"]
    search_fields = ["project__name", "user__name", "user__email", "role_in_project"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        projects = filter_projects_for_user(Project.objects.all(), self.request.user)
        return ProjectMember.objects.select_related("project", "user").filter(project__in=projects)

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"detail": _("Only admin can assign project members.")}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"detail": _("Only admin can update project members.")}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({"detail": _("Only admin can remove project members.")}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class CostCategoryViewSet(viewsets.ModelViewSet):
    queryset = CostCategory.objects.all()
    serializer_class = CostCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["is_active"]
    search_fields = ["name", "code", "description"]
    ordering_fields = ["name", "code", "created_at"]
    ordering = ["name"]


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    filterset_fields = ["vendor_type", "is_active"]
    search_fields = ["name", "phone", "email", "tax_number", "notes"]
    ordering_fields = ["name", "vendor_type", "created_at"]
    ordering = ["name"]

    def create(self, request, *args, **kwargs):
        if request.user.role == UserRole.MANAGEMENT_VIEWER:
            return Response({"detail": _("Management viewers have read-only access.")}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if request.user.role == UserRole.MANAGEMENT_VIEWER:
            return Response({"detail": _("Management viewers have read-only access.")}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role == UserRole.MANAGEMENT_VIEWER:
            return Response({"detail": _("Management viewers have read-only access.")}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
