@echo off
echo ====================================================
echo Starting SyncPoll Go Backend Engine...
echo ====================================================
cd /d "%~dp0backend"
set GOTOOLCHAIN=local
if exist syncpoll.exe (
    syncpoll.exe
) else (
    ..\.tools\go\bin\go.exe run cmd/server/main.go
)
pause
