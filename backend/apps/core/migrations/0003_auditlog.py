from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('core', '0002_viloyat'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id',     models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('amal',   models.CharField(max_length=100)),
                ('tavsif', models.TextField(blank=True)),
                ('vaqt',   models.DateTimeField(auto_now_add=True)),
                ('user',   models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to='accounts.user',
                    db_column='user_id',
                    related_name='audit_logs',
                )),
            ],
            options={
                'db_table': 'audit_log',
                'ordering': ['-vaqt'],
            },
        ),
    ]
