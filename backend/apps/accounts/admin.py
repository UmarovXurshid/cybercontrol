from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('username', 'fish', 'role', 'is_active', 'is_staff')
    list_filter   = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'fish')
    ordering      = ('username',)
    fieldsets = (
        (None,         {'fields': ('username', 'password')}),
        ('Shaxsiy',    {'fields': ('fish', 'role')}),
        ('Huquqlar',   {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'fish', 'password1', 'password2', 'role'),
        }),
    )
