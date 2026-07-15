"""
Mavjud barcha rasmlarni siqish.

Ishlatish:
    docker compose exec backend python manage.py compress_images
    docker compose exec backend python manage.py compress_images --quality 65 --max-size 800
"""

import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.core.models import Rasm

try:
    from PIL import Image
    PIL_OK = True
except ImportError:
    PIL_OK = False


class Command(BaseCommand):
    help = "Barcha saqlangan rasmlarni siqadi (hajmni kamaytiradi)"

    def add_arguments(self, parser):
        parser.add_argument('--quality', type=int, default=70,
                            help='JPEG sifati 1-95 (default: 70)')
        parser.add_argument('--max-size', type=int, default=900,
                            help='Maksimal tomon uzunligi px (default: 900)')
        parser.add_argument('--dry-run', action='store_true',
                            help="Faqat hisobot, hech narsa o'zgartirma")

    def handle(self, *args, **options):
        if not PIL_OK:
            self.stderr.write("Pillow o'rnatilmagan!")
            return

        quality  = options['quality']
        max_size = options['max_size']
        dry_run  = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING("=== DRY-RUN rejimi: hech narsa o'zgartirilmaydi ==="))

        images_dir = os.path.join(settings.MEDIA_ROOT, 'images')
        rasms = Rasm.objects.all()
        total      = rasms.count()
        processed  = 0
        skipped    = 0
        errors     = 0
        saved_bytes = 0

        self.stdout.write(f"Jami {total} ta rasm yozuvi topildi...")

        for r in rasms.iterator():
            fpath = os.path.join(images_dir, r.rasm_url)
            if not os.path.exists(fpath):
                skipped += 1
                continue
            try:
                size_before = os.path.getsize(fpath)
                if not dry_run:
                    img = Image.open(fpath).convert('RGB')
                    img.thumbnail((max_size, max_size), Image.LANCZOS)
                    img.save(fpath, 'JPEG', quality=quality, optimize=True)
                    size_after = os.path.getsize(fpath)
                    saved_bytes += max(0, size_before - size_after)
                processed += 1
            except Exception as e:
                errors += 1
                self.stderr.write(f"  Xato [{r.rasm_url}]: {e}")

        saved_mb = saved_bytes / (1024 * 1024)
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Tayyor!\n"
            f"   Ishlandi  : {processed} ta\n"
            f"   Topilmadi : {skipped} ta\n"
            f"   Xatolar   : {errors} ta\n"
            f"   Tejaldi   : {saved_mb:.1f} MB"
        ))
