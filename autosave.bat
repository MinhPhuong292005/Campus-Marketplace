@echo off
chcp 65001 >nul
echo ========================================================
echo   CAMPUS MARKETPLACE - AUTO SAVE TO GITHUB
echo   Repository: MinhPhuong292005/Campus-Marketplace
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Dang kiem tra va them cac thay doi...
git add .

echo [2/3] Dang commit...
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%:%datetime:~12,2%
git commit -m "auto-save: %timestamp% - Cap nhat he thong Phenikaa Campus Marketplace"

echo [3/3] Dang day len GitHub (origin main)...
git push origin main

echo.
if %errorlevel% equ 0 (
    echo [THANH CONG] Da luu va day toan bo ma nguon len GitHub thanh cong!
) else (
    echo [CHU Y] Neu day that bai do chua dang nhap GitHub, vui long nhap GitHub Token hoac dang nhap bang trinh duyet.
)
pause
