from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('mahallalar',      views.MahallaViewSet,      basename='mahalla')
router.register('tumanlar',        views.TumanViewSet,        basename='tuman')
router.register('viloyatlar',      views.ViloyatViewSet,      basename='viloyat')
router.register('foydalanuvchilar',views.FoydalanuvchiViewSet, basename='foydalanuvchi')
router.register('inspektorlar',    views.InspektorViewSet,    basename='inspektor')
router.register('hamkor-tashkilotlar', views.HamkorTashkilotViewSet, basename='hamkor-tashkilot')
router.register('hamkor-xodimlar',     views.HamkorXodimViewSet,     basename='hamkor-xodim')

urlpatterns = [
    path('', include(router.urls)),

    # Dashboard
    path('dashboard/',             views.dashboard),
    path('respublika-dashboard/',  views.respublika_dashboard),

    # Targ'ibotlar
    path('yangi/',                     views.yangi_targibotlar),
    path('tasdiqlash/',                views.tasdiqlash),
    path('tasdiqlangan/',              views.tasdiqlangan),
    path('tasdiqlangan/rasmlar/',      views.rasmlarni_ochir),
    path('rad-etilgan/',               views.rad_etilgan),

    # Hisobotlar
    path('hisobot/',                   views.hisobot),
    path('hisobot-kunlik/',            views.hisobot_kunlik),
    path('hisobot-tumanlar/',          views.hisobot_tumanlar),
    path('hisobot-viloyatlar/',        views.hisobot_viloyatlar),
    path('qilmaganlar/',               views.qilmaganlar),

    # Boshqaruv
    path('xabar-yuborish/',            views.xabar_yuborish),
    path('audit-log/',                 views.audit_log_list),
    path('compress-images/',           views.compress_images_view),
    path('qamrov/',                    views.qamrov),
    path('qamrov/nuqtalar/',           views.qamrov_nuqtalar),

    # Arxiv
    path('arxiv/',                              views.arxiv_list),
    path('arxiv/yaratish/',                     views.arxiv_yaratish),
    path('arxiv/<str:id>/',                     views.arxiv_ochir),
    path('arxiv/<str:id>/yuklab-olish/',        views.arxiv_download),

    # Word
    path('word-hisobot/',                       views.word_hisobot),

    # Xavfsiz va Sog'lom Yurt rasmiy hisoboti (format=json yoki excel)
    path('xavfsiz-yurt/',                       views.hisobot_excel_xavfsiz_yurt),
    path('xavfsiz-yurt-template/',              views.xavfsiz_yurt_template_excel),

    # Kunlik ishlar
    path('kunlik-ishlar/',              views.kunlik_ishlar_get),
    path('kunlik-ishlar/saqlash/',      views.kunlik_ishlar_save),
    path('kunlik-ishlar/tasdiqlash/',   views.kunlik_ishlar_tasdiqlash),
    path('kunlik-ishlar/list/',         views.kunlik_ishlar_list),
    path('kunlik-ishlar/rasm/',          views.kunlik_ishlar_rasm),
    path('infratuzilma/',                views.infratuzilma),
    path('kunlik-ishlar/excel/',         views.kunlik_ishlar_excel),

    # Tahliliy hisobotlar
    path('samaradorlik/',            views.samaradorlik_hisobot),
    path('xavfli-mahallalar/',       views.xavfli_mahallalar),
    path('oylik-dinamika/',          views.oylik_dinamika),
    path('haftalik-holat/',          views.haftalik_holat),

    # Hamkor tashkilot hisoboti
    path('hamkor-hisobot/',             views.hamkor_tashkilot_hisobot),

    # Murojaat (kiberjinoyat jabrlanuvchilari)
    path('murojaat/usullar/',        views.murojaat_usullar),
    path('murojaat/kasblar/',        views.murojaat_kasblar),
    path('murojaat/hisobot/',        views.murojaat_hisobot),
    path('murojaat/hisobot/excel/',  views.murojaat_hisobot_excel),
    path('murojaat/',                views.murojaat_list_create),
    path('murojaat/<int:pk>/',       views.murojaat_detail),
]
