@echo off
setlocal
cd /d "%~dp0dotnet"

echo ============================================
echo   TBH-Tracker - iniciando...
echo ============================================
echo.

echo [1/2] Gerando build...
call dotnet build TbhTracker.sln -c Release
if errorlevel 1 goto erro

echo [2/2] Abrindo o app...
call dotnet run --project TbhTracker.App -c Release
if errorlevel 1 goto erro

goto fim

:erro
echo.
echo *** Ocorreu um erro. Veja as mensagens acima. ***
pause

:fim
endlocal
