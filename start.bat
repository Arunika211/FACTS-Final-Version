@echo off
echo FACTS - Sistem Deteksi Hewan Ternak dengan YOLO
echo =============================================
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Python tidak ditemukan. Silakan install Python 3.8+ terlebih dahulu.
    goto :eof
)

REM Check if Node.js is installed
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js tidak ditemukan. Silakan install Node.js terlebih dahulu.
    goto :eof
)

REM Create debug folder if it doesn't exist
if not exist debug mkdir debug

REM Check if models folder exists
if not exist models (
    echo Membuat folder 'models'...
    mkdir models
    echo Folder 'models' dibuat. Silakan tempatkan model YOLO (ayam.pt, sapi.pt, kambing.pt) di folder tersebut.
    echo.
)

echo Memeriksa model YOLO...
if not exist models\ayam.pt echo Model ayam.pt tidak ditemukan di folder models. Deteksi ayam akan menggunakan simulasi.
if not exist models\sapi.pt echo Model sapi.pt tidak ditemukan di folder models. Deteksi sapi akan menggunakan simulasi.
if not exist models\kambing.pt echo Model kambing.pt tidak ditemukan di folder models. Deteksi kambing akan menggunakan simulasi.
echo.

echo =============================================
echo.
echo Menjalankan frontend...
cd facts-dashboard
start cmd /k "npm install && npm run dev"
cd ..

echo.
echo Sistem FACTS berhasil dijalankan dalam mode simulasi!
echo.
echo Buka browser dan kunjungi http://localhost:3000 untuk mengakses dashboard.
echo.
echo Untuk menjalankan deteksi YOLO, buka terminal lain dan jalankan server dengan:
echo python server.py
echo.
echo Tekan tombol apa saja untuk keluar...
pause > nul 