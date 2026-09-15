from rest_framework.permissions import BasePermission


class IsRespublika(BasePermission):
    """Faqat respublika admin."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role == 'respublika'
        )


class IsViloyatOrAbove(BasePermission):
    """Viloyat, tuman yoki respublika admin."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('respublika', 'viloyat', 'tuman')
        )


class IsRespublikaOrShaharAdmin(BasePermission):
    """Respublika admin — hammasi. Yoki 'faqat_shahar_tumani' belgilangan
    viloyatning (Toshkent shahar) viloyat admini — faqat o'z tuman
    adminlarini boshqarish uchun."""
    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.role == 'respublika':
            return True
        return bool(u.role == 'viloyat' and u.viloyat_id and u.viloyat.faqat_shahar_tumani)
