# CyberControl — VS Code terminalidan ishga tushirish
$ROOT = $PSScriptRoot

# ── 1. MariaDB ────────────────────────────────────────────────────────────────
Write-Host "[1/4] MariaDB ishga tushirilmoqda..." -ForegroundColor Cyan
taskkill /f /im mysqld.exe 2>$null | Out-Null
Start-Process -FilePath "$ROOT\db\mariadb\bin\mysqld.exe" `
    -ArgumentList "--datadir=`"$ROOT\db\data`"","--port=3308","--bind-address=127.0.0.1","--innodb-buffer-pool-size=64M" `
    -WindowStyle Hidden

# MariaDB tayyor bo'lishini kutish
$w = 0
do {
    Start-Sleep -Seconds 2; $w += 2
    $ping = & "$ROOT\db\mariadb\bin\mysqladmin.exe" --host=127.0.0.1 --port=3308 -u root --password= ping 2>&1
} while ($ping -notmatch "alive" -and $w -lt 30)
Write-Host "[OK] MariaDB tayyor" -ForegroundColor Green

# ── 2. Backend ────────────────────────────────────────────────────────────────
Write-Host "[2/4] Backend ishga tushirilmoqda..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k","title Backend ^&^& cd /d $ROOT\backend ^&^& set DB_HOST=127.0.0.1^&^& set DB_PORT=3308^&^& set DB_NAME=cybercon_bot^&^& set DB_USER=cybercon_bot^&^& set DB_PASSWORD=qr4n53e5XB96zRUDUKL7^&^& set DEBUG=1^&^& set ALLOWED_HOSTS=localhost,127.0.0.1^&^& $ROOT\venv\Scripts\python.exe manage.py runserver 8001"
Start-Sleep -Seconds 5
Write-Host "[OK] Backend: http://localhost:8001" -ForegroundColor Green

# ── 3. Bot ────────────────────────────────────────────────────────────────────
Write-Host "[3/4] Telegram bot ishga tushirilmoqda..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k","title Bot ^&^& cd /d $ROOT\backend ^&^& set DB_HOST=127.0.0.1^&^& set DB_PORT=3308^&^& set DB_NAME=cybercon_bot^&^& set DB_USER=cybercon_bot^&^& set DB_PASSWORD=qr4n53e5XB96zRUDUKL7^&^& set DEBUG=1^&^& set PYTHONIOENCODING=utf-8^&^& $ROOT\venv\Scripts\python.exe -u -m apps.bot.bot"
Start-Sleep -Seconds 3
Write-Host "[OK] Telegram bot: @cyber_control_bot" -ForegroundColor Green

# ── 4. Frontend ───────────────────────────────────────────────────────────────
Write-Host "[4/4] Frontend ishga tushirilmoqda..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/k","title Frontend ^&^& cd /d $ROOT\frontend ^&^& npm run dev"
Start-Sleep -Seconds 6
Write-Host "[OK] Frontend: http://localhost:3000" -ForegroundColor Green

# ── Natija ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "  Dastur ishga tushdi!" -ForegroundColor Yellow
Write-Host "  Web sayt : http://localhost:3000" -ForegroundColor White
Write-Host "  Admin    : http://localhost:8001/admin" -ForegroundColor White
Write-Host "  To'xtatish: Ctrl+C  yoki  stop.bat" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Yellow

Start-Process "http://localhost:3000"
