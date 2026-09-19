@echo off
echo ===================================================
echo Starting Cloudflare Secure Public Tunnel
echo (Trusted HTTPS - No "unsafe" warning - WhatsApp clickable)
echo ===================================================
"%~dp0bin\cloudflared.exe" tunnel --url https://localhost:5173 --no-tls-verify
pause
