"""
Mahalla nomini butun bazadan qidiradi (import xatolarini tekshirish uchun).

  python manage.py mahalla_qidir "Қоратери" "Созсой" --viloyat 132

Nomlar kirill/lotin va ў/у/o', қ/к/q, ғ/г/g', ҳ/х/h yozilish farqlariga
e'tibor bermasdan solishtiriladi; natijada mahalla qaysi tuman/viloyatda
turgani chiqadi.
"""
import re

from django.core.management.base import BaseCommand
from apps.core.models import Mahalla

_KIRIL_LOTIN = {
    'ё': 'yo', 'ж': 'j', 'ц': 's', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
    'ъ': "'", 'ы': 'i', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': "o'", 'қ': 'q', 'ғ': "g'", 'ҳ': 'h',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'x',
}
_APOS = "['‘’ʻʼ`′]"


def kalit(s):
    out = []
    for ch in str(s):
        rep = _KIRIL_LOTIN.get(ch.lower())
        out.append(ch if rep is None else rep)
    s = ''.join(out).lower().replace('-', ' ')
    s = re.sub('o' + _APOS, 'u', s)
    s = re.sub('g' + _APOS, 'g', s)
    s = re.sub(_APOS + '|"', '', s)
    s = s.replace('q', 'k').replace('h', 'x')
    s = re.sub(r'\b(mfy|kfy|maxalla(si)?)\b', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


class Command(BaseCommand):
    help = "Mahalla nomini butun bazadan qidiradi"

    def add_arguments(self, parser):
        parser.add_argument('nomlar', nargs='+')
        parser.add_argument('--viloyat', type=int, default=None, help="Faqat shu viloyat ID si ichida")

    def handle(self, *args, **opts):
        qs = Mahalla.objects.select_related('tuman__viloyat')
        if opts['viloyat']:
            qs = qs.filter(tuman__viloyat_id=opts['viloyat'])
        baza = [(m, kalit(m.mahalla_nomi)) for m in qs]
        for nom in opts['nomlar']:
            target = kalit(nom)
            tns = target.replace(' ', '')
            self.stdout.write(f"\n=== {nom}  (kalit: {target!r}) ===")
            topildi = 0
            for m, k in baza:
                if k == target or k.replace(' ', '') == tns:
                    topildi += 1
                    self.stdout.write(
                        f"  ANIQ: id={m.id} {m.mahalla_nomi!r} | tuman={m.tuman.tuman_nomi!r} (id={m.tuman_id}) "
                        f"| viloyat={m.tuman.viloyat.nomi!r}")
            if not topildi:
                self.stdout.write("  bazada aniq shu nom yo'q")
