from django.urls import path

from .views import CategoryCostsView, DashboardOverviewView, MonthlyCostsView, PaidVsPendingView, ProjectDashboardView, TopVendorsView


urlpatterns = [
    path("overview/", DashboardOverviewView.as_view(), name="dashboard-overview"),
    path("project/<int:project_id>/", ProjectDashboardView.as_view(), name="dashboard-project"),
    path("monthly-costs/", MonthlyCostsView.as_view(), name="dashboard-monthly-costs"),
    path("category-costs/", CategoryCostsView.as_view(), name="dashboard-category-costs"),
    path("paid-vs-pending/", PaidVsPendingView.as_view(), name="dashboard-paid-vs-pending"),
    path("top-vendors/", TopVendorsView.as_view(), name="dashboard-top-vendors"),
]
