from django.urls import path

from .views import (
    CashFlowReportView,
    CategoryCostReportView,
    ExcelExportView,
    MonthlyCostReportView,
    PdfExportView,
    PendingPaymentsReportView,
    ProjectSummaryReportView,
    VendorStatementReportView,
)


urlpatterns = [
    path("project-summary/", ProjectSummaryReportView.as_view(), name="report-project-summary"),
    path("monthly-cost/", MonthlyCostReportView.as_view(), name="report-monthly-cost"),
    path("category-cost/", CategoryCostReportView.as_view(), name="report-category-cost"),
    path("vendor-statement/", VendorStatementReportView.as_view(), name="report-vendor-statement"),
    path("pending-payments/", PendingPaymentsReportView.as_view(), name="report-pending-payments"),
    path("cash-flow/", CashFlowReportView.as_view(), name="report-cash-flow"),
    path("export/excel/", ExcelExportView.as_view(), name="report-export-excel"),
    path("export/pdf/", PdfExportView.as_view(), name="report-export-pdf"),
]
