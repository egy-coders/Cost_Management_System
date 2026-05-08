from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    build_project_summary,
    category_costs,
    monthly_costs,
    overview_totals,
    paid_vs_pending,
    status_breakdown,
    top_vendors,
)


class DashboardOverviewView(APIView):
    def get(self, request):
        data = overview_totals(request.user, request.query_params)
        data["approval_status"] = status_breakdown(request.user, "approval_status", request.query_params)
        data["payment_status"] = status_breakdown(request.user, "payment_status", request.query_params)
        return Response(data)


class ProjectDashboardView(APIView):
    def get(self, request, project_id):
        return Response(build_project_summary(request.user, project_id))


class MonthlyCostsView(APIView):
    def get(self, request):
        return Response(monthly_costs(request.user, request.query_params))


class CategoryCostsView(APIView):
    def get(self, request):
        return Response(category_costs(request.user, request.query_params))


class PaidVsPendingView(APIView):
    def get(self, request):
        return Response(paid_vs_pending(request.user, request.query_params))


class TopVendorsView(APIView):
    def get(self, request):
        return Response(top_vendors(request.user, request.query_params))
