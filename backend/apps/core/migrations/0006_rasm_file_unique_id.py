from django.db import migrations


class Migration(migrations.Migration):
    """
    rasm jadvaliga file_unique_id ustunini qo'shish.
    Rasm managed=False bo'lgani uchun RunSQL ishlatiladi.
    Telegram file_unique_id: bir xil fayl qayta yuborilsa ham bir xil bo'ladi —
    shu orqali takroriy (oldingi) rasmlarni aniqlash mumkin.
    """

    dependencies = [
        ('core', '0005_hisobot_gps'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE rasm
                ADD COLUMN IF NOT EXISTS file_unique_id VARCHAR(128) NULL DEFAULT NULL,
                ADD INDEX IF NOT EXISTS idx_rasm_file_unique_id (file_unique_id);
            """,
            reverse_sql="""
            ALTER TABLE rasm
                DROP INDEX IF EXISTS idx_rasm_file_unique_id,
                DROP COLUMN IF EXISTS file_unique_id;
            """,
        ),
    ]
