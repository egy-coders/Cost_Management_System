from django.contrib import admin

from .models import CostCategory, Project, ProjectMember, Vendor


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "client_name", "status", "currency")
    list_filter = ("status", "currency")
    search_fields = ("name", "code", "client_name", "location")
    inlines = [ProjectMemberInline]


@admin.register(CostCategory)
class CostCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active")
    search_fields = ("name", "code")
    list_filter = ("is_active",)


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ("name", "vendor_type", "phone", "email", "is_active")
    search_fields = ("name", "phone", "email", "tax_number")
    list_filter = ("vendor_type", "is_active")


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "role_in_project")
    search_fields = ("project__name", "user__email", "user__name")
