from django.contrib import admin
from .models import Tuman, Mahalla, Hisobot, Rasm, TargibotUtkazilganJoy

@admin.register(Tuman)
class TumanAdmin(admin.ModelAdmin):
    list_display = ('id', 'tuman_nomi')

@admin.register(Mahalla)
class MahallaAdmin(admin.ModelAdmin):
    list_display  = ('id', 'mahalla_nomi', 'tuman', 'inspektor_fio', 'inspektor_tel', 'tg_id')
    list_filter   = ('tuman',)
    search_fields = ('mahalla_nomi', 'inspektor_fio')

@admin.register(Hisobot)
class HisobotAdmin(admin.ModelAdmin):
    list_display  = ('id', 'mahalla', 'targibot_turi', 'status', 'qatnashchilar_soni', 'qushilgan_vaqt')
    list_filter   = ('status', 'targibot_turi')
    search_fields = ('mahalla__mahalla_nomi',)

@admin.register(Rasm)
class RasmAdmin(admin.ModelAdmin):
    list_display = ('id', 'hisobot', 'rasm_url', 'qushilgan_vaqt')

@admin.register(TargibotUtkazilganJoy)
class JoyAdmin(admin.ModelAdmin):
    list_display = ('id', 'targibot_utkazilgan_joy', 'joy_turi')
