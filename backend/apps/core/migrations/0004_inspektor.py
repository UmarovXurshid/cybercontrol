from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    """
    inspektor jadvali yaratish.

    Muammo: Mahalla managed=False va 0001_initial bo'sh, shuning uchun
    Django migration state'da Mahalla yo'q. Yechim:
      1) RunSQL orqali DB'da jadvalni yaratamiz
      2) SeparateDatabaseAndState orqali state'ga Mahalla stub va Inspektor qo'shamiz
    """

    dependencies = [
        ('core', '0003_auditlog'),
    ]

    operations = [
        # ── 1. DB: inspektor jadvalini SQL orqali yaratish ──────────────────────
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS inspektor (
                id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
                mahalla_id INT          NOT NULL,
                fio        VARCHAR(255) NOT NULL DEFAULT '',
                tel        VARCHAR(50)  NOT NULL DEFAULT '',
                tg_id      BIGINT       NOT NULL DEFAULT 0,
                is_active  TINYINT(1)   NOT NULL DEFAULT 1,
                CONSTRAINT fk_inspektor_mahalla
                    FOREIGN KEY (mahalla_id) REFERENCES mahalla(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            reverse_sql="DROP TABLE IF EXISTS inspektor;",
        ),

        # ── 2. State: Mahalla stub + Inspektor (DB operatsiyasi yo'q) ───────────
        migrations.SeparateDatabaseAndState(
            database_operations=[],   # DB'da hech narsa qilma
            state_operations=[
                # Mahalla'ni state'ga qo'shamiz (managed=False, DB jadval allaqachon bor)
                migrations.CreateModel(
                    name='Mahalla',
                    fields=[
                        ('id', models.AutoField(
                            auto_created=True, primary_key=True, serialize=False
                        )),
                    ],
                    options={'db_table': 'mahalla', 'managed': False},
                ),
                # Inspektor'ni state'ga qo'shamiz (DB jadval yuqorida RunSQL bilan yaratildi)
                migrations.CreateModel(
                    name='Inspektor',
                    fields=[
                        ('id',        models.AutoField(
                            auto_created=True, primary_key=True, serialize=False
                        )),
                        ('fio',       models.CharField(max_length=255)),
                        ('tel',       models.CharField(max_length=50)),
                        ('tg_id',     models.BigIntegerField(default=0)),
                        ('is_active', models.BooleanField(default=True)),
                        ('mahalla',   models.ForeignKey(
                            db_column='mahalla_id',
                            on_delete=django.db.models.deletion.CASCADE,
                            related_name='inspektorlar',
                            to='core.mahalla',
                        )),
                    ],
                    options={'db_table': 'inspektor'},
                ),
            ],
        ),
    ]
