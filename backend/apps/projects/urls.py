from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CostCategoryViewSet, ProjectMemberViewSet, ProjectViewSet, VendorViewSet


router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="projects")
router.register("project-members", ProjectMemberViewSet, basename="project-members")
router.register("categories", CostCategoryViewSet, basename="categories")
router.register("vendors", VendorViewSet, basename="vendors")

urlpatterns = [path("", include(router.urls))]
