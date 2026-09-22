@echo off
title M-Bite Cloudflare Online Tunnel
echo ===================================================
echo   DANG KHOI CHAY CLOUDFLARE TUNNEL (M-BITE ONLINE)
echo ===================================================
echo.
echo Luu y: Dam bao Backend (port 5000) va Frontend (port 5173) dang chay truoc khi mo tunnel.
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5173
pause
