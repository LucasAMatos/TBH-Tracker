@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   TBH-Tracker - iniciando...
echo ============================================
echo.

if not exist "node_modules" (
    echo [1/3] Instalando dependencias ^(primeira vez^)...
    call npm install
    if errorlevel 1 goto erro
)

echo [2/3] Gerando build...
call npm run build
if errorlevel 1 goto erro

echo [3/3] Abrindo o app...
call npm start
if errorlevel 1 goto erro

goto fim

:erro
echo.
echo *** Ocorreu um erro. Veja as mensagens acima. ***
pause

:fim
endlocal
