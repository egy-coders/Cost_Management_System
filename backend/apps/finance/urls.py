from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ClientPaymentViewSet, ExpenseViewSet, PaymentViewSet


router = DefaultRouter()
router.register("expenses", ExpenseViewSet, basename="expenses")
router.register("payments", PaymentViewSet, basename="payments")
router.register("cash-in", ClientPaymentViewSet, basename="cash-in")

urlpatterns = [path("", include(router.urls))]
