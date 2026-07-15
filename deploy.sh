#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  CyberControl — Linux serverga o'rnatish skripti
#  Ishlatish:  bash deploy.sh
# ══════════════════════════════════════════════════════════════

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}   CyberControl — Server o'rnatish     ${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"

# ── 1. Docker borligini tekshirish ────────────────────────────
echo -e "\n${CYAN}1. Docker tekshirilmoqda...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker o'rnatilmagan. O'rnatilmoqda...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker o'rnatildi.${NC}"
else
    echo -e "${GREEN}Docker mavjud: $(docker --version)${NC}"
fi

# ── 2. Server IP / domen ──────────────────────────────────────
echo -e "\n${CYAN}2. Server sozlanmoqda...${NC}"
SERVER_IP=$(hostname -I | awk '{print $1}')

read -p "Server IP yoki domen (default: ${SERVER_IP}): " DOMAIN
DOMAIN=${DOMAIN:-$SERVER_IP}

read -p "Qaysi portda ishlasin? (default: 80): " PORT
PORT=${PORT:-80}

# ── 3. .env faylni yangilash ──────────────────────────────────
echo -e "\n${CYAN}3. .env sozlanmoqda...${NC}"
NEW_SECRET=$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 100)

sed -i "s/^ALLOWED_HOSTS=.*/ALLOWED_HOSTS=${DOMAIN},localhost,127.0.0.1/" .env
sed -i "s/^SECRET_KEY=.*/SECRET_KEY=${NEW_SECRET}/" .env
sed -i "s/^APP_PORT=.*/APP_PORT=${PORT}/" .env
sed -i "s/^DEBUG=.*/DEBUG=0/" .env

echo -e "${GREEN}ALLOWED_HOSTS: ${DOMAIN}${NC}"
echo -e "${GREEN}PORT: ${PORT}${NC}"

# ── 4. Konteynerlarni ishga tushirish ─────────────────────────
echo -e "\n${CYAN}4. Dastur ishga tushirilmoqda...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo -e "${YELLOW}30 soniya DB tayyor bo'lishi kutilmoqda...${NC}"
sleep 30

# ── 5. DB import ──────────────────────────────────────────────
if [ -f "db_dump.sql" ]; then
    echo -e "\n${CYAN}5. Ma'lumotlar bazasi tiklanmoqda...${NC}"
    DB_PASS=$(grep ^DB_PASSWORD .env | cut -d= -f2)
    docker exec -i cybercontrol-new-db-1 \
        mysql -u cybercon_bot -p${DB_PASS} cybercon_bot < db_dump.sql 2>/dev/null || true
    echo -e "${GREEN}DB import OK${NC}"
    docker compose -f docker-compose.prod.yml --env-file .env restart backend bot
    sleep 10
fi

# ── 6. Firewall ───────────────────────────────────────────────
echo -e "\n${CYAN}6. Firewall sozlanmoqda...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow ${PORT}/tcp 2>/dev/null || true
    echo -e "${GREEN}UFW: port ${PORT} ochildi${NC}"
fi

# ── 7. Holat ─────────────────────────────────────────────────
echo -e "\n${CYAN}7. Holat:${NC}"
docker compose -f docker-compose.prod.yml ps

echo -e "\n${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Dastur muvaffaqiyatli o'rnatildi!   ${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "  Manzil:  ${YELLOW}http://${DOMAIN}:${PORT}${NC}"
echo -e ""
echo -e "  Admin parolini o'zgartiring:"
echo -e "  ${CYAN}docker exec cybercontrol-new-backend-1 python manage.py changepassword admin${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
