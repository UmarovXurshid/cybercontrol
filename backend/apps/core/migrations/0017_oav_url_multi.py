# Generated manually
# oav_*_url maydonlarini bitta matn (CharField)dan bir nechta havola/rasm
# saqlaydigan ro'yxatga (JSONField) o'tkazadi. Mavjud qiymatlar yo'qolmasligi
# uchun: eski ustun nomi o'zgartiriladi -> yangi JSONField qo'shiladi ->
# ma'lumot ko'chiriladi -> eski ustun o'chiriladi.

from django.db import migrations, models


FIELDS = ['oav_tv_url', 'oav_radio_url', 'oav_gazeta_jurnal_url', 'oav_internet_url']


def migrate_data_forward(apps, schema_editor):
    KunlikIshlar = apps.get_model('core', 'KunlikIshlar')
    for record in KunlikIshlar.objects.all():
        changed = False
        for f in FIELDS:
            old_val = getattr(record, f + '_old', '')
            if old_val:
                setattr(record, f, [{'url': old_val, 'rasm': ''}])
                changed = True
        if changed:
            record.save(update_fields=FIELDS)


def migrate_data_backward(apps, schema_editor):
    KunlikIshlar = apps.get_model('core', 'KunlikIshlar')
    for record in KunlikIshlar.objects.all():
        changed = False
        for f in FIELDS:
            new_val = getattr(record, f, None) or []
            if new_val and isinstance(new_val, list) and new_val[0].get('url'):
                setattr(record, f + '_old', new_val[0]['url'])
                changed = True
        if changed:
            record.save(update_fields=[f + '_old' for f in FIELDS])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_alter_kunlikishlar_unique_together_and_more'),
    ]

    operations = [
        # 1) eski ustunlarni vaqtincha boshqa nomga o'zgartirish
        migrations.RenameField(model_name='kunlikishlar', old_name='oav_tv_url', new_name='oav_tv_url_old'),
        migrations.RenameField(model_name='kunlikishlar', old_name='oav_radio_url', new_name='oav_radio_url_old'),
        migrations.RenameField(model_name='kunlikishlar', old_name='oav_gazeta_jurnal_url', new_name='oav_gazeta_jurnal_url_old'),
        migrations.RenameField(model_name='kunlikishlar', old_name='oav_internet_url', new_name='oav_internet_url_old'),

        # 2) yangi JSONField ustunlarini qo'shish
        migrations.AddField(model_name='kunlikishlar', name='oav_tv_url', field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name='kunlikishlar', name='oav_radio_url', field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name='kunlikishlar', name='oav_gazeta_jurnal_url', field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name='kunlikishlar', name='oav_internet_url', field=models.JSONField(blank=True, default=list)),

        # 3) eski qiymatlarni yangi formatga ko'chirish
        migrations.RunPython(migrate_data_forward, migrate_data_backward),

        # 4) eski ustunlarni o'chirish
        migrations.RemoveField(model_name='kunlikishlar', name='oav_tv_url_old'),
        migrations.RemoveField(model_name='kunlikishlar', name='oav_radio_url_old'),
        migrations.RemoveField(model_name='kunlikishlar', name='oav_gazeta_jurnal_url_old'),
        migrations.RemoveField(model_name='kunlikishlar', name='oav_internet_url_old'),
    ]
