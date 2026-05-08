from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    build_excel_response,
    build_pdf_response,
    cash_flow_report,
    category_cost_report,
    monthly_cost_report,
    pending_payments_report,
    project_summary_report,
    report_params,
    vendor_statement_report,
)


class ProjectSummaryReportView(APIView):
    def get(self, request):
        return Response(project_summary_report(request.user, report_params(request)))


class MonthlyCostReportView(APIView):
    def get(self, request):
        return Response(monthly_cost_report(request.user, report_params(request)))


class CategoryCostReportView(APIView):
    def get(self, request):
        return Response(category_cost_report(request.user, report_params(request)))


class VendorStatementReportView(APIView):
    def get(self, request):
        return Response(vendor_statement_report(request.user, report_params(request)))


class PendingPaymentsReportView(APIView):
    def get(self, request):
        return Response(pending_payments_report(request.user, report_params(request)))


class CashFlowReportView(APIView):
    def get(self, request):
        return Response(cash_flow_report(request.user, report_params(request)))


class ExcelExportView(APIView):
    def get(self, request):
        return build_excel_response(request.user, report_params(request))


class PdfExportView(APIView):
    def get(self, request):
        return build_pdf_response(request.user, report_params(request))
