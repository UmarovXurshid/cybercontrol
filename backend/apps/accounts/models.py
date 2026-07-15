from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra):
        user = self.model(username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra):
        extra.setdefault('role', 'respublika')
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('respublika', 'Respublika Admin'),
        ('viloyat',    'Viloyat Admin'),
    ]
    fish       = models.CharField(max_length=255, blank=True)
    username   = models.CharField(max_length=150, unique=True)
    role       = models.CharField(max_length=50, choices=ROLE_CHOICES, default='viloyat')
    viloyat    = models.ForeignKey(
        'core.Viloyat', null=True, blank=True,
        on_delete=models.SET_NULL, db_column='viloyat_id'
    )
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)

    objects = UserManager()
    USERNAME_FIELD = 'username'

    class Meta:
        db_table = 'django_users'

    def __str__(self):
        return self.username
