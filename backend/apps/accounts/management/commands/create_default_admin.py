"""
Docker start bo'lganda avtomatik respublika admin yaratadi.
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = "Default respublika admin yaratadi (agar mavjud bo'lmasa)"

    def handle(self, *args, **kwargs):
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'fish':         'Administrator',
                'role':         'respublika',
                'viloyat':      None,
                'is_staff':     True,
                'is_superuser': True,
                'is_active':    True,
            }
        )
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(self.style.SUCCESS(
                '✅ Admin yaratildi: login=admin  parol=admin123  role=respublika'
            ))
        else:
            # Mavjud admin'ni respublika rolga yangilash (eski 'admin' roldan)
            if user.role not in ('respublika', 'viloyat'):
                user.role = 'respublika'
                user.save(update_fields=['role'])
                self.stdout.write(self.style.SUCCESS('✅ Admin roli respublikaga yangilandi'))
            else:
                self.stdout.write('ℹ️  Admin allaqachon mavjud')
