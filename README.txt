══════════════════════════════════════════════
   CyberControl — Ishlatish yo'riqnomasi
══════════════════════════════════════════════

BIRINCHI MARTA (yoki yangi kompyuterda):
─────────────────────────────────────────
  setup.bat  →  ikki marta bosing

  Bu avtomatik bajaradi:
  ✓ Docker Desktop o'rnatadi (tools\ papkasidan)
  ✓ Loyihani build qiladi
  ✓ Ma'lumotlar bazasini tiklaydi
  ✓ Brauzerda ochadi

HAR KUNI ISHLATISH:
─────────────────────────────────────────
  start.bat  →  ishga tushirish
  stop.bat   →  to'xtatish

MANZILLAR:
─────────────────────────────────────────
  Web sayt  :  http://localhost:3000
  Admin     :  http://localhost:8001/admin

BOSHQA KOMPYUTERGA KO'CHIRISH:
─────────────────────────────────────────
  1. Butun papkani ko'chiring
     (tools\DockerDesktopInstaller.exe ham ketadi)
  2. Yangi kompyuterda: setup.bat → ikki marta bosing
  3. Tamom!

  Eslatma: Docker Desktop o'rnatilishi uchun
  admin huquqi kerak (bir martalik).

FOYDALI BUYRUQLAR (CMD/PowerShell):
─────────────────────────────────────────
  Holat:    docker compose ps
  Loglar:   docker compose logs -f backend
  Restart:  docker compose restart
  Baza:     docker compose exec db mysql -u cybercon_bot -pqr4n53e5XB96zRUDUKL7 cybercon_bot

══════════════════════════════════════════════
