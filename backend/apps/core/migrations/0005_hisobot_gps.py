from django.db import migrations


class Migration(migrations.Migration):
    """
    hisobot jadvaliga latitude va longitude ustunlarini qo'shish.
    Hisobot managed=False bo'lgani uchun RunSQL ishlatiladi.
    """

    dependencies = [
        ('core', '0004_inspektor'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE hisobot
                ADD COLUMN IF NOT EXISTS latitude  DOUBLE NULL DEFAULT NULL,
                ADD COLUMN IF NOT EXISTS longitude DOUBLE NULL DEFAULT NULL;
            """,
            reverse_sql="""
            ALTER TABLE hisobot
                DROP COLUMN IF EXISTS latitude,
                DROP COLUMN IF EXISTS longitude;
            """,
        ),
    ]
