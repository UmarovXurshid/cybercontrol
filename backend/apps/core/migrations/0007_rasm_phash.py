from django.db import migrations


class Migration(migrations.Migration):
    """
    rasm jadvaliga phash (perceptual hash) ustunini qo'shish.
    pHash rasmning vizual 'barmoq izi' — bir xil ko'rinishdagi
    rasmlar bir xil yoki juda yaqin hash beradi.
    """

    dependencies = [
        ('core', '0006_rasm_file_unique_id'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            ALTER TABLE rasm
                ADD COLUMN IF NOT EXISTS phash VARCHAR(64) NULL DEFAULT NULL,
                ADD INDEX IF NOT EXISTS idx_rasm_phash (phash);
            """,
            reverse_sql="""
            ALTER TABLE rasm
                DROP INDEX IF EXISTS idx_rasm_phash,
                DROP COLUMN IF EXISTS phash;
            """,
        ),
    ]
