from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import UserRole


def is_admin(user):
    return bool(user and user.is_authenticated and (user.role == UserRole.ADMIN or user.is_superuser))


def has_role(user, *roles):
    return bool(user and user.is_authenticated and (is_admin(user) or user.role in roles))


def can_read_management(user):
    return has_role(
        user,
        UserRole.PROJECT_MANAGER,
        UserRole.ACCOUNTANT,
        UserRole.MANAGEMENT_VIEWER,
        UserRole.SITE_ENGINEER,
    )


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return is_admin(request.user)


class IsAccountantOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, UserRole.ACCOUNTANT)


class IsProjectManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, UserRole.PROJECT_MANAGER)


class ReadOnlyForViewer(BasePermission):
    def has_permission(self, request, view):
        if request.user.role == UserRole.MANAGEMENT_VIEWER:
            return request.method in SAFE_METHODS
        return True
