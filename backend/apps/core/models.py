from django.db import models

# ── Viloyat ──────────────────────────────────────────────────────────────────
class Viloyat(models.Model):
    nomi = models.CharField(max_length=255)
    class Meta:
        db_table = 'viloyat'
    def __str__(self):
        return self.nomi

# ── Tuman ─────────────────────────────────────────────────────────────────────
class Tuman(models.Model):
    viloyat    = models.ForeignKey(Viloyat, on_delete=models.CASCADE,
                                  db_column='viloyat_id', null=True, blank=True)
    tuman_nomi = models.CharField(max_length=255)
    class Meta:
        db_table = 'tuman'
        managed  = False          # jadval allaqachon mavjud
    def __str__(self):
        return self.tuman_nomi

# ── Mahalla ───────────────────────────────────────────────────────────────────
class Mahalla(models.Model):
    tuman              = models.ForeignKey(Tuman, on_delete=models.CASCADE, db_column='tuman_id')
    mahalla_nomi       = models.CharField(max_length=255)
    inspektor_fio      = models.CharField(max_length=255, blank=True)
    inspektor_tel      = models.CharField(max_length=50, blank=True)
    tg_id              = models.BigIntegerField(default=0)
    navbatchilik_kuni1 = models.IntegerField(null=True, blank=True)
    navbatchilik_kuni2 = models.IntegerField(null=True, blank=True)
    is_tuman           = models.BooleanField(default=False)
    is_viloyat         = models.BooleanField(default=False)
    class Meta:
        db_table = 'mahalla'
        managed  = False
    def __str__(self):
        return self.mahalla_nomi

# ── TargibotUtkazilganJoy ─────────────────────────────────────────────────────
class TargibotUtkazilganJoy(models.Model):
    KATEGORIYA = [
        (1,'Қизил МФЙлар'),
        (2,'Таълим муассасалари'),
        (3,'Касалхона ва поликлиника'),
        (4,'Бозорлар ва йирик савдо мажмуалари'),
        (5,'Истироҳат боғлари ва кунгил очар жойлар'),
        (6,'Жамоат транспортлари'),
        (7,'Масжидлар'),
        (8,'ҲМҚО'),
        (9,'Бошқа идора ва ташкилотлар'),
        (10,'Аҳоли гавжум жойларда'),
    ]
    targibot_utkazilgan_joy = models.CharField(max_length=255)
    joy_turi                = models.IntegerField(default=1)
    kategoriya              = models.IntegerField(default=9, choices=KATEGORIYA)
    class Meta:
        db_table = 'targibot_utkazilgan_joy'
        managed  = False
    def __str__(self):
        return self.targibot_utkazilgan_joy

# ── Hisobot ───────────────────────────────────────────────────────────────────
class Hisobot(models.Model):
    STATUS = [(0,'Boshlangan'),(1,'Yuborilgan'),(2,'Tasdiqlangan'),(3,'Rad etilgan')]
    TURI   = [(1,'Offline'),(2,'Online')]

    mahalla            = models.ForeignKey(Mahalla, on_delete=models.CASCADE, db_column='mahalla_id')
    hamkor_xodim       = models.ForeignKey('HamkorXodim', on_delete=models.SET_NULL,
                                           null=True, blank=True, db_column='hamkor_xodim_id',
                                           related_name='hisobotlar')
    targibot_utgan_joy = models.IntegerField(null=True, blank=True)
    qatnashchilar_soni = models.IntegerField(null=True, blank=True)
    status             = models.IntegerField(default=0, choices=STATUS)
    targibot_turi      = models.IntegerField(null=True, blank=True, choices=TURI)
    message_id         = models.BigIntegerField(null=True, blank=True)
    latitude           = models.FloatField(null=True, blank=True)
    longitude          = models.FloatField(null=True, blank=True)
    offline_18_gacha   = models.IntegerField(default=0)
    offline_18_katta   = models.IntegerField(default=0)
    online_18_gacha    = models.IntegerField(default=0)
    online_18_katta    = models.IntegerField(default=0)
    proof_url           = models.CharField(max_length=500, null=True, blank=True)
    video_kontent_soni  = models.IntegerField(default=0)
    banner_soni         = models.IntegerField(default=0)
    flayer_soni         = models.IntegerField(default=0)
    buklet_soni         = models.IntegerField(default=0)
    boshqa_material_soni= models.IntegerField(default=0)
    suhbat_soni         = models.IntegerField(default=0)
    qushilgan_vaqt      = models.DateTimeField(auto_now_add=True)
    yangilangan_vaqt   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hisobot'
        managed  = False

# ── Rasm ──────────────────────────────────────────────────────────────────────
class Rasm(models.Model):
    hisobot        = models.ForeignKey(Hisobot, on_delete=models.CASCADE,
                                       db_column='hisobot_id', related_name='rasmlar')
    rasm_url       = models.CharField(max_length=500)
    file_unique_id = models.CharField(max_length=128, null=True, blank=True)
    phash          = models.CharField(max_length=64,  null=True, blank=True)
    qushilgan_vaqt = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'rasm'
        managed  = False

# ── Inspektor ─────────────────────────────────────────────────────────────────
class Inspektor(models.Model):
    mahalla   = models.ForeignKey(Mahalla, on_delete=models.CASCADE,
                                  db_column='mahalla_id', related_name='inspektorlar')
    fio       = models.CharField(max_length=255)
    tel       = models.CharField(max_length=50)
    tg_id     = models.BigIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'inspektor'

    def __str__(self):
        return f"{self.fio} ({self.mahalla})"

# ── AuditLog ──────────────────────────────────────────────────────────────────
class AuditLog(models.Model):
    user   = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, db_column='user_id', related_name='audit_logs'
    )
    amal   = models.CharField(max_length=100)   # tasdiqlash, rad_etish, mahalla_yaratish …
    tavsif = models.TextField(blank=True)        # inson o'qiydigan tavsif
    vaqt   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_log'
        ordering = ['-vaqt']

    def __str__(self):
        return f"{self.user} | {self.amal} | {self.vaqt:%Y-%m-%d %H:%M}"


# ── MurojaatUsul ──────────────────────────────────────────────────────────────
class MurojaatUsul(models.Model):
    ota    = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                               db_column='ota_id', related_name='bolalar')
    nomi   = models.CharField(max_length=500)
    daraja = models.IntegerField(default=1)   # 1=asosiy, 2=yashil bola
    tartib = models.IntegerField(default=0)
    class Meta:
        db_table = 'murojaat_usul'
        managed  = False
        ordering = ['tartib']
    def __str__(self): return self.nomi

# ── MurojaatKasb ──────────────────────────────────────────────────────────────
class MurojaatKasb(models.Model):
    ota       = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                                  db_column='ota_id', related_name='bolalar')
    nomi      = models.CharField(max_length=500)
    daraja    = models.IntegerField(default=1)   # 1=ko'k, 2=yashil, 3=oq
    tartib    = models.IntegerField(default=0)
    is_talaba = models.BooleanField(default=False)
    class Meta:
        db_table = 'murojaat_kasb'
        managed  = False
        ordering = ['tartib']
    def __str__(self): return self.nomi

# ── Murojaat ──────────────────────────────────────────────────────────────────
class Murojaat(models.Model):
    JINSI   = [('erkak','Erkak'),('ayol','Ayol')]
    HOLAT   = [('yangi','Yangi'),('takroriy','Takroriy murojaat'),
               ('aybi','Fuqaroning o\'z aybi'),('togri','To\'g\'ridan to\'g\'ri ariza')]
    TARMOQ  = [('telegram','Telegram'),('instagram','Instagram'),
               ('facebook','Facebook'),('tiktok','TikTok'),('bigolive','Bigo Live'),('boshqa','Boshqa')]

    sana             = models.DateField()
    viloyat          = models.ForeignKey(Viloyat, on_delete=models.PROTECT, db_column='viloyat_id')
    tuman            = models.ForeignKey(Tuman,   on_delete=models.PROTECT, db_column='tuman_id')
    mahalla          = models.ForeignKey(Mahalla, on_delete=models.SET_NULL, null=True, blank=True, db_column='mahalla_id')
    fish             = models.CharField(max_length=255, blank=True)
    jinsi            = models.CharField(max_length=10,  choices=JINSI, blank=True)
    telefon          = models.CharField(max_length=50,  blank=True)
    fabula           = models.TextField(blank=True)
    zarar            = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    usul             = models.ForeignKey(MurojaatUsul, on_delete=models.SET_NULL, null=True, blank=True, db_column='usul_id')
    kasb             = models.ForeignKey(MurojaatKasb, on_delete=models.SET_NULL, null=True, blank=True, db_column='kasb_id')
    yosh             = models.SmallIntegerField(null=True, blank=True)
    holat            = models.CharField(max_length=20, choices=HOLAT, default='yangi')
    ijtimoiy_tarmoq  = models.CharField(max_length=20, choices=TARMOQ, blank=True)
    kasb_izoh        = models.TextField(blank=True)
    kasb_muassasa    = models.CharField(max_length=255, blank=True)
    kasb_kurs        = models.SmallIntegerField(null=True, blank=True)
    yaratuvchi       = models.ForeignKey('accounts.User', on_delete=models.SET_NULL,
                                         null=True, blank=True, db_column='yaratuvchi_id')
    yaratilgan       = models.DateTimeField(auto_now_add=True)
    yangilangan      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'murojaat'
        managed  = False
        ordering = ['-sana', '-yaratilgan']


# ── KunlikIshlar ──────────────────────────────────────────────────────────────
class KunlikIshlar(models.Model):
    STATUS = [
        (1, 'Tayyorlanmoqda'),
        (2, 'Yuborildi'),
        (3, 'Tasdiqlandi'),
        (4, 'Rad etildi'),
    ]

    viloyat    = models.ForeignKey(Viloyat, on_delete=models.CASCADE, db_column='viloyat_id')
    sana       = models.DateField()
    status     = models.IntegerField(default=1, choices=STATUS)
    rad_sababi = models.TextField(blank=True, default='')

    # ── Uchrashuvlar (qo'lda — bot qoplamagan kategoriyalar) ──
    qizil_mfy_soni          = models.IntegerField(default=0)
    istirohat_soni          = models.IntegerField(default=0)
    transport_soni          = models.IntegerField(default=0)
    masjid_soni             = models.IntegerField(default=0)
    iio_tv_murojaati        = models.IntegerField(default=0)   # IIO boshlig'i TV murojaati

    # Isbotlar (uchrashuvlar)
    uchrashuv_proof_url     = models.CharField(max_length=500, blank=True, default='')
    uchrashuv_proof_rasm    = models.CharField(max_length=500, blank=True, default='')

    # ── OAV ──
    oav_tv_soni             = models.IntegerField(default=0)
    oav_tv_url              = models.CharField(max_length=500, blank=True, default='')
    oav_radio_soni          = models.IntegerField(default=0)
    oav_radio_url           = models.CharField(max_length=500, blank=True, default='')
    oav_gazeta_jurnal_soni  = models.IntegerField(default=0)
    oav_gazeta_jurnal_url   = models.CharField(max_length=500, blank=True, default='')
    oav_video_soni          = models.IntegerField(default=0)
    oav_video_10k           = models.IntegerField(default=0)
    oav_video_100k          = models.IntegerField(default=0)
    oav_video_1m            = models.IntegerField(default=0)
    oav_video_url           = models.CharField(max_length=500, blank=True, default='')
    oav_internet_soni       = models.IntegerField(default=0)
    oav_internet_url        = models.CharField(max_length=500, blank=True, default='')

    # ── Materiallar ──
    mat_ijtimoiy_tarmoq     = models.IntegerField(default=0)
    mat_oz_tashabbusi       = models.IntegerField(default=0)
    mat_flayer_buklet       = models.IntegerField(default=0)
    mat_led_ekran           = models.IntegerField(default=0)
    mat_boshqa              = models.IntegerField(default=0)
    mat_proof_url           = models.CharField(max_length=500, blank=True, default='')
    mat_proof_rasm          = models.CharField(max_length=500, blank=True, default='')

    # ── Suhbatlar ──
    suhbat_soni             = models.IntegerField(default=0)
    suhbat_proof_url        = models.CharField(max_length=500, blank=True, default='')
    suhbat_proof_rasm       = models.CharField(max_length=500, blank=True, default='')

    # ── Qo'shimcha ──
    iio_xizmat_soni         = models.IntegerField(default=0)
    hamkor_tashkilot_soni   = models.IntegerField(default=0)
    sayber_soni             = models.IntegerField(default=0)

    yaratilgan  = models.DateTimeField(auto_now_add=True)
    yangilangan = models.DateTimeField(auto_now=True)

    class Meta:
        db_table         = 'kunlik_ishlar'
        unique_together  = ('viloyat', 'sana')
        ordering         = ['-sana']

    def __str__(self):
        return f"{self.viloyat} | {self.sana} | {self.get_status_display()}"


# ── HamkorTashkilot ───────────────────────────────────────────────────────────
class HamkorTashkilot(models.Model):
    viloyat   = models.ForeignKey(Viloyat, on_delete=models.CASCADE,
                                  db_column='viloyat_id', related_name='hamkor_tashkilotlar')
    tuman     = models.ForeignKey('Tuman', on_delete=models.SET_NULL,
                                  null=True, blank=True, db_column='tuman_id',
                                  related_name='hamkor_tashkilotlar')
    mahalla   = models.ForeignKey('Mahalla', on_delete=models.SET_NULL,
                                  null=True, blank=True, db_column='mahalla_id',
                                  related_name='hamkor_tashkilotlar')
    nomi      = models.CharField(max_length=255)
    turi      = models.CharField(max_length=100, blank=True, default='')  # Xususiy, Davlat, NGO...
    manzil    = models.CharField(max_length=300, blank=True, default='')
    is_active = models.BooleanField(default=True)
    yaratilgan = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hamkor_tashkilot'
        ordering = ['nomi']

    def __str__(self):
        return self.nomi


# ── HamkorXodim ───────────────────────────────────────────────────────────────
class HamkorXodim(models.Model):
    tashkilot  = models.ForeignKey(HamkorTashkilot, on_delete=models.CASCADE,
                                   db_column='tashkilot_id', related_name='xodimlar')
    fio        = models.CharField(max_length=255)
    lavozim    = models.CharField(max_length=255, blank=True, default='')
    tel        = models.CharField(max_length=50, blank=True, default='')
    tg_id      = models.BigIntegerField(default=0)
    is_active  = models.BooleanField(default=True)
    yaratilgan = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hamkor_xodim'
        ordering = ['fio']

    def __str__(self):
        return f"{self.fio} ({self.tashkilot.nomi})"


# ── ViloyatInfratuzilma ───────────────────────────────────────────────────────
class ViloyatInfratuzilma(models.Model):
    """Viloyatdagi targ'ibot joylarining umumiy soni (bir marta kiritiladi)."""
    viloyat         = models.OneToOneField(Viloyat, on_delete=models.CASCADE,
                                           db_column='viloyat_id',
                                           related_name='infratuzilma')
    qizil_mfy       = models.IntegerField(default=0)   # kat 1
    oliy_talim      = models.IntegerField(default=0)   # kat 2
    akademik_litsey = models.IntegerField(default=0)   # kat 3
    orta_talim      = models.IntegerField(default=0)   # kat 4
    maktabgacha     = models.IntegerField(default=0)   # kat 5
    kasalxona       = models.IntegerField(default=0)   # kat 6
    bozor           = models.IntegerField(default=0)   # kat 7
    xmko            = models.IntegerField(default=0)   # kat 8
    telegram        = models.IntegerField(default=0)   # kat 9 (Boshqa/Telegram)
    istirohat       = models.IntegerField(default=0)   # kat 10
    jamoat_transport= models.IntegerField(default=0)   # kat 11
    masjid          = models.IntegerField(default=0)   # kat 12
    yangilangan     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'viloyat_infratuzilma'

    def __str__(self):
        return f"{self.viloyat} infratuzilma"
