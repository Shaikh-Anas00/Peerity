@echo off
echo ========================================================
echo   Resetting MySQL Root Password to Empty
echo ========================================================
echo.

:: Check for administrative permissions
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run with Administrator privileges!
    echo Please right-click 'reset_mysql_root.bat' and select 'Run as administrator'.
    echo.
    pause
    exit /b 1
)

echo [1/5] Stopping MYSQL80 service...
net stop MYSQL80

echo [2/5] Creating temporary password reset script...
echo ALTER USER 'root'@'localhost' IDENTIFIED BY ''; > "%TEMP%\mysql_reset.sql"
echo FLUSH PRIVILEGES; >> "%TEMP%\mysql_reset.sql"

echo [3/5] Executing password reset...
start /b "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.0\my.ini" --init-file="%TEMP%\mysql_reset.sql" --console

timeout /t 6 /nobreak >nul

echo [4/5] Stopping standalone MySQL process...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 /nobreak >nul
del "%TEMP%\mysql_reset.sql" >nul 2>&1

echo [5/5] Restarting MYSQL80 service...
net start MYSQL80

echo.
echo ========================================================
echo Testing connection with blank password:
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "SELECT 'SUCCESS: Root password is now empty.' AS Status;"
echo ========================================================
echo.
pause
