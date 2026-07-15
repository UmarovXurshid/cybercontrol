from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    """
    django_users jadvaliga viloyat_id ustuni qo'shish
    va role choices'ini yangilash (respublika / viloyat).
    """
    dependencies = [
        ('accounts', '0001_initial'),
        ('core',     '0002_viloyat'),   # Viloyat jadvali avval yaratilishi kerak
    ]

    operations = [
        # viloyat FK — Django managed=True, shuning uchun ALTER TABLE avtomatik
        migrations.AddField(
            model_name='user',
            name='viloyat',
            field=models.ForeignKey(
                'core.Viloyat',
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                db_column='viloyat_id',
            ),
        ),
        # role choices yangilash (max_length o'zgarmaydi — faqat Python-darajasida)
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('respublika', 'Respublika Admin'), ('viloyat', 'Viloyat Admin')],
                default='viloyat',
                max_length=50,
            ),
        ),
    ]
