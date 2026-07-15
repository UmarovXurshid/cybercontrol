from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User


class MyTokenSerializer(TokenObtainPairSerializer):
    """JWT token'ga role va viloyat_id qo'shadi."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role']       = user.role
        token['viloyat_id'] = user.viloyat_id
        return token


class FoydalanuvchiSerializer(serializers.ModelSerializer):
    viloyat_nomi = serializers.CharField(source='viloyat.nomi', read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'username', 'fish', 'role', 'viloyat', 'viloyat_nomi', 'is_active']
