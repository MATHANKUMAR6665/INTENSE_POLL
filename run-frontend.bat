@echo off
echo ====================================================
echo Starting SyncPoll React Frontend...
echo ====================================================
cd /d "%~dp0frontend"
npm run dev -- --host
pause
