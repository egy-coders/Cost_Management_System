from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils.translation import gettext_lazy as _

from .models import User
from .permissions import IsAdminRole
from .serializers import EmailTokenObtainPairSerializer, MeSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"detail": _("Refresh token is required.")}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        return Response({"detail": _("Invalid refresh token.")}, status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_view(request):
    if request.method == "PATCH":
        serializer = MeSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(MeSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    search_fields = ["name", "email", "role"]
    ordering_fields = ["name", "email", "role", "created_at"]
    ordering = ["name"]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
