from django.db import migrations


class Migration(migrations.Migration):
    """
    Barcha core modellar managed=False — jadvallar allaqachon
    mavjud (localhost.sql orqali import qilingan).
    Bu migration faqat Django migration tracking uchun kerak.
    """
    initial = True
    dependencies = []
    operations = []
