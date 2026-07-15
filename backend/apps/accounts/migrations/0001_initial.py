from django.db import migrations, models
import django.contrib.auth.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id',           models.AutoField(auto_created=True, primary_key=True, serialize=False)),
                ('password',     models.CharField(max_length=128, verbose_name='password')),
                ('last_login',   models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False)),
                ('fish',         models.CharField(blank=True, max_length=255)),
                ('username',     models.CharField(max_length=150, unique=True)),
                ('role',         models.CharField(choices=[('admin', 'Admin')], default='admin', max_length=50)),
                ('is_active',    models.BooleanField(default=True)),
                ('is_staff',     models.BooleanField(default=False)),
                ('groups',       models.ManyToManyField(blank=True, related_name='user_set',
                                    related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, related_name='user_set',
                                        related_query_name='user', to='auth.permission',
                                        verbose_name='user permissions')),
            ],
            options={
                'db_table': 'django_users',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
    ]
