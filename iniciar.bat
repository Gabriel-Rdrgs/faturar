@echo off
echo Iniciando Sistema Faturar...

start "Backend - NestJS" cmd /k "cd /d C:\projetos\faturar\apps\api && npm run start:dev"
start "Frontend - Next.js" cmd /k "cd /d C:\projetos\faturar\apps\web && npm run dev"

timeout /t 5 /nobreak
start http://localhost:3000

echo Pronto!