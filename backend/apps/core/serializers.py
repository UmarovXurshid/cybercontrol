from rest_framework import serializers
from .models import Viloyat, Tuman, Mahalla, Hisobot, Rasm, TargibotUtkazilganJoy, Inspektor, MurojaatUsul, MurojaatKasb, Murojaat, KunlikIshlar, HamkorTashkilot, HamkorXodim, ViloyatInfratuzilma


class ViloyatSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Viloyat
        fields = '__all__'


class TumanSerializer(serializers.ModelSerializer):
    viloyat_nomi = serializers.CharField(source='viloyat.nomi', read_only=True)
    class Meta:
        model  = Tuman
        fields = '__all__'


class MahallaSerializer(serializers.ModelSerializer):
    tuman_nomi = serializers.CharField(source='tuman.tuman_nomi', read_only=True)
    class Meta:
        model  = Mahalla
        fields = '__all__'


class RasmSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Rasm
        fields = '__all__'


OAV_NOMLAR = {3: 'TV', 4: 'Radio', 5: 'Gazeta', 6: 'Jurnal', 7: 'Internet/Ijtimoiy'}

class HisobotSerializer(serializers.ModelSerializer):
    rasmlar       = RasmSerializer(many=True, read_only=True)
    mahalla_nomi  = serializers.CharField(source='mahalla.mahalla_nomi',  read_only=True)
    tuman_nomi    = serializers.CharField(source='mahalla.tuman.tuman_nomi', read_only=True)
    viloyat_id    = serializers.IntegerField(source='mahalla.tuman.viloyat_id', read_only=True)
    viloyat_nomi  = serializers.CharField(source='mahalla.tuman.viloyat.nomi', read_only=True)
    inspektor_fio = serializers.CharField(source='mahalla.inspektor_fio', read_only=True)
    inspektor_tel = serializers.CharField(source='mahalla.inspektor_tel', read_only=True)
    joy_nomi      = serializers.SerializerMethodField()
    has_location  = serializers.SerializerMethodField()
    turi_nomi     = serializers.SerializerMethodField()

    # N+1 muammoni hal qilish: TargibotUtkazilganJoy ni bir marta olish
    _joy_cache = None

    @classmethod
    def _get_joy_cache(cls):
        if cls._joy_cache is None:
            cls._joy_cache = {
                j.pk: j.targibot_utkazilgan_joy
                for j in TargibotUtkazilganJoy.objects.all()
            }
        return cls._joy_cache

    @classmethod
    def clear_joy_cache(cls):
        cls._joy_cache = None

    def get_has_location(self, obj):
        return obj.latitude is not None and obj.longitude is not None

    def get_turi_nomi(self, obj):
        if obj.targibot_turi and obj.targibot_turi >= 3:
            return OAV_NOMLAR.get(obj.targibot_turi, 'OAV')
        return None

    def get_joy_nomi(self, obj):
        if obj.targibot_utgan_joy:
            return self._get_joy_cache().get(obj.targibot_utgan_joy, '')
        return ''

    class Meta:
        model  = Hisobot
        fields = '__all__'


class TargibotJoySerializer(serializers.ModelSerializer):
    class Meta:
        model  = TargibotUtkazilganJoy
        fields = '__all__'


class InspektorSerializer(serializers.ModelSerializer):
    mahalla_nomi = serializers.CharField(source='mahalla.mahalla_nomi', read_only=True)
    tuman_nomi   = serializers.CharField(source='mahalla.tuman.tuman_nomi', read_only=True)

    class Meta:
        model  = Inspektor
        fields = '__all__'


class MurojaatUsulSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MurojaatUsul
        fields = ['id', 'ota_id', 'nomi', 'daraja', 'tartib']


class MurojaatKasbSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MurojaatKasb
        fields = ['id', 'ota_id', 'nomi', 'daraja', 'tartib', 'is_talaba']


class MurojaatSerializer(serializers.ModelSerializer):
    viloyat_nomi = serializers.CharField(source='viloyat.nomi', read_only=True)
    tuman_nomi   = serializers.CharField(source='tuman.tuman_nomi', read_only=True)
    mahalla_nomi = serializers.CharField(source='mahalla.mahalla_nomi', read_only=True)
    usul_nomi    = serializers.CharField(source='usul.nomi', read_only=True)
    kasb_nomi    = serializers.CharField(source='kasb.nomi', read_only=True)

    def to_internal_value(self, data):
        # Bo'sh string → None (optional integer/FK maydonlar uchun)
        mutable = data.copy() if hasattr(data, 'copy') else dict(data)
        for field in ('mahalla', 'usul', 'kasb', 'zarar', 'kasb_kurs', 'yosh'):
            if mutable.get(field) == '' or mutable.get(field) is None:
                mutable[field] = None
        return super().to_internal_value(mutable)

    class Meta:
        model  = Murojaat
        fields = '__all__'
        read_only_fields = ('yaratuvchi', 'yaratilgan', 'yangilangan')


class KunlikIshlarSerializer(serializers.ModelSerializer):
    viloyat_nomi   = serializers.CharField(source='viloyat.nomi', read_only=True)
    status_nomi    = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = KunlikIshlar
        fields = '__all__'


class HamkorXodimSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HamkorXodim
        fields = '__all__'


class HamkorTashkilotSerializer(serializers.ModelSerializer):
    xodimlar     = HamkorXodimSerializer(many=True, read_only=True)
    xodim_soni   = serializers.IntegerField(source='xodimlar.count', read_only=True)
    viloyat_nomi = serializers.CharField(source='viloyat.nomi', read_only=True)
    tuman_nomi   = serializers.CharField(source='tuman.tuman_nomi', read_only=True, default='')
    mahalla_nomi = serializers.CharField(source='mahalla.mahalla_nomi', read_only=True, default='')

    class Meta:
        model  = HamkorTashkilot
        fields = '__all__'


class ViloyatInfratuzilmaSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ViloyatInfratuzilma
        fields = '__all__'
