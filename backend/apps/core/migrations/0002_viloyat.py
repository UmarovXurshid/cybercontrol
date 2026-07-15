from django.db import migrations, models


class Migration(migrations.Migration):
    """
    1. Yangi 'viloyat' jadvali yaratish (managed=True)
    2. 'tuman' jadvaliga viloyat_id ustuni qo'shish (RunSQL, managed=False)
    """
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        # ── Viloyat jadvali yaratish ─────────────────────────────────────────
        migrations.CreateModel(
            name='Viloyat',
            fields=[
                ('id',   models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('nomi', models.CharField(max_length=255)),
            ],
            options={
                'db_table': 'viloyat',
            },
        ),

        # ── tuman jadvaliga viloyat_id ustuni (managed=False → faqat RunSQL) ─
        migrations.RunSQL(
            sql="ALTER TABLE tuman ADD COLUMN IF NOT EXISTS viloyat_id INT NULL",
            reverse_sql="ALTER TABLE tuman DROP COLUMN IF EXISTS viloyat_id",
        ),
    ]
