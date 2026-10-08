@echo off
echo Starting TrustReview PHP Crypto & File Service on port 8000...
if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" -S 127.0.0.1:8000 -t src
) else (
    php -S 127.0.0.1:8000 -t src
)
pause
