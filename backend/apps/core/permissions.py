from rest_framework.permissions import BasePermission


class IsRespublika(BasePermission):
    """Faqat respublika admin."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role == 'respublika'
        )


class IsViloyatOrAbove(BasePermission):
    """Viloyat admin yoki respublika admin."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('respublika', 'viloyat')
        )
