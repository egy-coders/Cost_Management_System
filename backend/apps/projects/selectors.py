from apps.accounts.models import UserRole

from .models import Project


def assigned_project_ids(user):
    if not user or not user.is_authenticated:
        return []
    if user.role == UserRole.ADMIN or user.is_superuser:
        return list(Project.objects.values_list("id", flat=True))
    return list(user.project_memberships.values_list("project_id", flat=True))


def filter_projects_for_user(queryset, user):
    if not user or not user.is_authenticated:
        return queryset.none()
    if user.role == UserRole.ADMIN or user.is_superuser:
        return queryset
    return queryset.filter(members__user=user).distinct()


def user_can_access_project(user, project_id):
    if not user or not user.is_authenticated:
        return False
    if user.role == UserRole.ADMIN or user.is_superuser:
        return True
    return user.project_memberships.filter(project_id=project_id).exists()
