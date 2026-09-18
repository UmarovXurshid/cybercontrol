"""
Docker start bo'lganda — agar tizimda birorta ham respublika admin
bo'lmasa — bitta respublika admin yaratadi (tasodifiy kuchli parol bilan).

MUHIM: bu buyruq ataylab standart/taxmin qilinadigan parol (masalan
"admin123") o'rnatmaydi — bunday parol tizimni butun mamlakat bo'yicha
ochiq qoldiradi (2026-09-18 dagi voqea shu sababdan bo'lgan). Agar
tizimda respublika admin allaqachon mavjud bo'lsa, hech narsa qilmaydi.
"""
import secrets

from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = "Tizimda birorta ham respublika admin bo'lmasa, bittasini tasodifiy parol bilan yaratadi"

    def handle(self, *args, **kwargs):
        if User.objects.filter(role='respublika').exists():
            self.stdout.write('ℹ️  Respublika admin allaqachon mavjud, yangisi yaratilmaydi')
            return

        parol = secrets.token_urlsafe(12)
        user = User.objects.create(
            username='admin',
            fish='Administrator',
            role='respublika',
            viloyat=None,
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        user.set_password(parol)
        user.save()
        self.stdout.write(self.style.SUCCESS(
            f'✅ Admin yaratildi: login=admin  parol={parol}  role=respublika\n'
            f'   ⚠️  Bu parolni HOZIR yozib oling — qayta ko\'rsatilmaydi!'
        ))
