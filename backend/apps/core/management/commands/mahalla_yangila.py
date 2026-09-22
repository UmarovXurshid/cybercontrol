"""
Viloyat mahallalari va inspektorlarini Excel ro'yxatdan yangilaydi (sinxronlash).

  python manage.py mahalla_yangila /tmp/namangan.xlsx --viloyat 132            # SINOV: hech narsa yozilmaydi
  python manage.py mahalla_yangila /tmp/namangan.xlsx --viloyat 132 --apply    # haqiqiy yozish

Fayl ustunlari: # | Mahalla | Tuman | Inspektor | Telefon | Telegram ID | Navbatchilik 1 | Navbatchilik 2 | Turi

Qoidalar (xavfsizlik uchun hech narsa o'chirilmaydi):
- Mahalla (tuman + nom) bo'yicha topiladi (kirill/lotin, Сћ/Сѓ/o', Т›/Рє/q, Т“/Рі/g', Ті/С…/h, РњР¤Р™ so'zi,
  bo'shliq/tire farqlariga e'tiborsiz). Topilsa вЂ” ID saqlanadi (hisobotlar/murojaatlar uzilmaydi),
  nomi fayldagidek yangilanadi. Topilmasa вЂ” yangi mahalla yaratiladi.
- Fayldagi inspektor telefoni (12 xonali 998XXXXXXXXX ga keltiriladi) bo'yicha shu mahalladagi
  Inspektor topiladi: F.I.SH yangilanadi, tg_id SAQLANADI. Topilmasa вЂ” yangi inspektor yaratiladi.
- Ro'yxatda bo'lmagan eski inspektorlar o'chirilmaydi, is_active=False qilinadi.
- Faylda bo'lmagan mahallalarga tegilmaydi (faqat hisobotda ko'rsatiladi).
- Navbatchilik kunlari mavjud mahallalarda o'zgartirilmaydi (faqat yangi mahallalarga fayldan olinadi).
"""
import re
import collections

import openpyxl
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.core.models import Tuman, Mahalla, Inspektor

_KIRIL_LOTIN = {
    'С‘': 'yo', 'Р¶': 'j', 'С†': 's', 'С‡': 'ch', 'С€': 'sh', 'С‰': 'sh',
    'СЉ': "'", 'С‹': 'i', 'СЌ': 'e', 'СЋ': 'yu', 'СЏ': 'ya',
    'Сћ': "o'", 'Т›': 'q', 'Т“': "g'", 'Ті': 'h',
    'Р°': 'a', 'Р±': 'b', 'РІ': 'v', 'Рі': 'g', 'Рґ': 'd', 'Рµ': 'e',
    'Р·': 'z', 'Рё': 'i', 'Р№': 'y', 'Рє': 'k', 'Р»': 'l', 'Рј': 'm',
    'РЅ': 'n', 'Рѕ': 'o', 'Рї': 'p', 'СЂ': 'r', 'СЃ': 's', 'С‚': 't',
    'Сѓ': 'u', 'С„': 'f', 'С…': 'x',
}
_APOS = "['вЂвЂ™К»Кј`вЂІ]"
_SHAHAR_RE = r'\b(sxaxar|sxaxri)\b|\ssx\.?$'
_TUMAN_RE = r'\btuman(i)?\b|\st\.?$'
KUNLAR = {'yakshanba': 0, 'dushanba': 1, 'seshanba': 2, 'chorshanba': 3, 'payshanba': 4, 'juma': 5, 'shanba': 6}


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
    s = s.replace('ye', 'e')  # "Йе" bilan "Е" bir xil o'qiladi, so'z ichida ham (Елихон=Йелихон, Янгиер=Йангийер)
    return re.sub(r'\s+', ' ', s).strip()


def norm_mahalla(s):
    k = re.sub(r'\b(mfy|kfy|maxalla(si)?)\b', ' ', kalit(s))
    return re.sub(r'\s+', ' ', k).strip().replace(' ', '')


def norm_tuman(s):
    k = re.sub(r'\b(tuman(i)?|sxaxar|sxaxri)\b', ' ', kalit(s))
    k = re.sub(r'\s+(t|sx)\.?$', '', k)
    return re.sub(r'\s+', ' ', k).strip().replace(' ', '')


def telefon(v):
    """Telefonni 12 xonali 998XXXXXXXXX ko'rinishga keltiradi (bot shu formatda qidiradi). Noto'g'ri bo'lsa ''."""
    if v is None:
        return ''
    if isinstance(v, float):
        v = int(v)
    s = re.sub(r'\D', '', str(v))
    if len(s) == 9:
        s = '998' + s
    return s if (len(s) == 12 and s.startswith('998')) else ''


def turi(t):
    n = kalit(t.tuman_nomi)
    if re.search(_SHAHAR_RE, n):
        return 'shahar'
    if re.search(_TUMAN_RE, n):
        return 'tuman'
    return None


def tuman_top(nom, tumanlar):
    raw = kalit(nom)
    hs = bool(re.search(_SHAHAR_RE, raw))
    ht = (not hs) and bool(re.search(_TUMAN_RE, raw))
    target = norm_tuman(nom)
    teng = [t for t in tumanlar if norm_tuman(t.tuman_nomi) == target]
    if len(teng) > 1:
        hint = 'shahar' if hs else ('tuman' if ht else None)
        mos = [t for t in teng if turi(t) == hint] if hint else []
        return mos[0] if len(mos) == 1 else teng[0]
    return teng[0] if teng else None


class Command(BaseCommand):
    help = "Viloyat mahallalari va inspektorlarini Excel ro'yxatdan sinxronlaydi (sukut bo'yicha SINOV)"

    def add_arguments(self, parser):
        parser.add_argument('fayl')
        parser.add_argument('--viloyat', type=int, required=True)
        parser.add_argument('--apply', action='store_true', help="Haqiqatan yozish (bermasangiz sinov)")

    def handle(self, *args, **o):
        try:
            ws = openpyxl.load_workbook(o['fayl'], data_only=True).worksheets[0]
        except Exception as e:
            raise CommandError(f"Faylni o'qib bo'lmadi: {e}")
        vid = o['viloyat']
        tumanlar = [t for t in Tuman.objects.filter(viloyat_id=vid) if 'viloyati' not in kalit(t.tuman_nomi)]
        if not tumanlar:
            raise CommandError("Bu viloyatda tuman topilmadi")

        # в”Ђв”Ђ Fayl: (tuman_id, mahalla kaliti) -> yozuv в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        yozuvlar = collections.OrderedDict()
        tuman_topilmadi = collections.Counter()
        noto_tel = []
        telsiz = 0
        for i, r in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if not r or not any(r[1:]):
                continue
            m_nom, t_nom, fio, tel = (str(r[1] or '').strip(), str(r[2] or '').strip(),
                                      str(r[3] or '').strip(), r[4])
            if not m_nom or not t_nom:
                continue
            t = tuman_top(t_nom, tumanlar)
            if not t:
                tuman_topilmadi[t_nom] += 1
                continue
            key = (t.id, norm_mahalla(m_nom))
            y = yozuvlar.setdefault(key, {'nom': m_nom, 'tuman': t, 'ins': [],
                                          'k1': KUNLAR.get(str(r[6] or '').strip().lower()),
                                          'k2': KUNLAR.get(str(r[7] or '').strip().lower())})
            tl = telefon(tel)
            if not tl:
                if tel not in (None, ''):
                    noto_tel.append((i, t_nom, m_nom, fio, tel))
                else:
                    telsiz += 1
                continue
            if all(tl != x[1] for x in y['ins']):
                y['ins'].append((fio, tl))

        # в”Ђв”Ђ Baza mahallalari в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        baza = collections.defaultdict(list)   # (tuman_id, kalit) -> [Mahalla]
        for m in Mahalla.objects.filter(tuman__viloyat_id=vid, is_tuman=False, is_viloyat=False):
            baza[(m.tuman_id, norm_mahalla(m.mahalla_nomi))].append(m)

        st = collections.Counter()
        qayd = collections.defaultdict(list)
        ishlatilgan = set()

        with transaction.atomic():
            for key, y in yozuvlar.items():
                nomzod = [m for m in baza.get(key, []) if m.id not in ishlatilgan]
                if nomzod:
                    m = nomzod[0]
                    ishlatilgan.add(m.id)
                    st['mahalla mos keldi'] += 1
                    upd = []
                    if m.mahalla_nomi.strip() != y['nom']:
                        qayd['nomi'].append(f"{m.mahalla_nomi.strip()!r} -> {y['nom']!r} ({y['tuman'].tuman_nomi.strip()})")
                        m.mahalla_nomi = y['nom']
                        upd.append('mahalla_nomi')
                        st['nomi yangilandi'] += 1
                else:
                    m = Mahalla(tuman=y['tuman'], mahalla_nomi=y['nom'], tg_id=0,
                                navbatchilik_kuni1=y['k1'], navbatchilik_kuni2=y['k2'],
                                is_tuman=False, is_viloyat=False)
                    upd = None
                    st['YANGI mahalla yaratildi'] += 1
                    qayd['yangi mahalla'].append(f"{y['nom']!r} ({y['tuman'].tuman_nomi.strip()})")

                if y['ins']:
                    if m.inspektor_fio != y['ins'][0][0] or m.inspektor_tel != y['ins'][0][1]:
                        m.inspektor_fio, m.inspektor_tel = y['ins'][0]
                        if upd is not None:
                            upd += ['inspektor_fio', 'inspektor_tel']
                if upd is None:
                    m.save()
                elif upd:
                    m.save(update_fields=sorted(set(upd)))

                # Inspektorlar
                bor = list(Inspektor.objects.filter(mahalla=m)) if m.pk and upd is not None else []
                bor_tel = {}
                for x in bor:
                    bor_tel.setdefault(telefon(x.tel), []).append(x)
                fayl_tel = set()
                for fio, tl in y['ins']:
                    fayl_tel.add(tl)
                    if tl in bor_tel:
                        for x in bor_tel[tl]:
                            ozgardi = []
                            if x.fio != fio:
                                x.fio = fio; ozgardi.append('fio')
                            if x.tel != tl:
                                x.tel = tl; ozgardi.append('tel')
                            if not x.is_active:
                                x.is_active = True; ozgardi.append('is_active'); st['inspektor qayta faollashtirildi'] += 1
                            if ozgardi:
                                x.save(update_fields=ozgardi); st['inspektor yangilandi (tg_id saqlandi)'] += 1
                    else:
                        Inspektor.objects.create(mahalla=m, fio=fio, tel=tl, tg_id=0, is_active=True)
                        st['YANGI inspektor yaratildi'] += 1
                if y['ins']:   # faylda inspektori bor mahallada, ro'yxatda yo'qlarni o'chirmasdan nofaol qilamiz
                    for tl, lst in bor_tel.items():
                        if tl not in fayl_tel:
                            for x in lst:
                                if x.is_active:
                                    x.is_active = False
                                    x.save(update_fields=['is_active'])
                                    st["eski inspektor NOFAOL qilindi"] += 1
                                    qayd['nofaol'].append(f"{x.fio!r} {x.tel} ({m.mahalla_nomi.strip()}, {y['tuman'].tuman_nomi.strip()}) tg_id={x.tg_id}")

            faylda_yoq = [m for lst in baza.values() for m in lst if m.id not in ishlatilgan]
            for m in faylda_yoq:
                qayd['yoq'].append(f"{m.mahalla_nomi.strip()!r} ({m.tuman.tuman_nomi.strip()})")

            if not o['apply']:
                transaction.set_rollback(True)

        w = self.stdout.write
        w(f"\n=== {'HAQIQIY YOZILDI' if o['apply'] else 'SINOV (hech narsa yozilmadi)'} ===")
        w(f"Faylda: {len(yozuvlar)} ta mahalla (tuman+nom bo'yicha), inspektor yozuvlari: {sum(len(y['ins']) for y in yozuvlar.values())}")
        for k, v in sorted(st.items()):
            w(f"  {v:5d}  {k}")
        w(f"  {len(qayd['yoq']):5d}  bazada bor, faylda yo'q (TEGILMADI)")
        if tuman_topilmadi:
            w(f"\nTuman topilmadi (qatorlar o'tkazib yuborildi): {dict(tuman_topilmadi)}")
        w(f"Telefon yo'q: {telsiz} ta qator | noto'g'ri telefon: {len(noto_tel)} ta")
        for b, kalitlar in (("Nomi o'zgargan mahallalar", "nomi"), ("NOFAOL bo'lgan inspektorlar", 'nofaol'),
                            ("Faylda yo'q mahallalar", "yoq"), ("Yangi mahallalar", 'yangi mahalla')):
            lst = qayd[kalitlar]
            if lst:
                w(f"\n--- {b} ({len(lst)} ta, dastlabki 25) ---")
                for x in lst[:25]:
                    w('  ' + x)
        if noto_tel:
            w("\n--- Noto'g'ri telefonlar ---")
            for x in noto_tel[:15]:
                w(f"  {x}")

