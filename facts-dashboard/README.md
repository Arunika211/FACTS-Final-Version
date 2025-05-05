# FACTS Dashboard

**Farm Animal Control and Tracking System Dashboard**

FACTS Dashboard adalah aplikasi monitoring dan deteksi hewan ternak menggunakan teknologi IoT dan Computer Vision. Aplikasi ini menampilkan data sensor (suhu, kelembaban, dll) dan aktivitas hewan ternak dari kandang.

## Fitur Utama

- **Monitoring:** Visualisasi data sensor secara real-time
- **Deteksi:** Deteksi dan identifikasi hewan ternak menggunakan model YOLO
- **Lab AI:** Analisis cerdas dan rekomendasi berdasarkan data sensor dan aktivitas hewan

## Teknologi

- Next.js 15.3.1
- React 18.2.0
- Tailwind CSS
- Plotly.js untuk visualisasi data
- Integrasi dengan Hugging Face Spaces API

## Cara Menjalankan Secara Lokal

```bash
# Instalasi dependensi
npm install

# Menjalankan development server
npm run dev

# Build untuk production
npm run build

# Menjalankan production server
npm run start
```

## Deployment

Aplikasi ini dirancang untuk mudah di-deploy ke Vercel. 

### Deployment ke Vercel

1. Fork repository ini
2. Connect repository ke Vercel
3. Vercel akan otomatis mendeteksi konfigurasi Next.js

Untuk deployment yang lancar, pastikan untuk menggunakan pengaturan berikut di Vercel:
- Build command: `CI=false NEXT_IGNORE_TS_ERRORS=true npm run build --no-lint`
- Node.js version: 20.x

### Mengatasi Error Deployment

Jika mengalami error "Command "npm run build" exited with 1" atau masalah serupa:

1. Jalankan helper deployment script: `npm run deploy`
2. Script akan memeriksa konfigurasi dan mencoba mengatasi masalah umum
3. Untuk panduan lengkap, lihat file `DEPLOYMENT.md`

### Environment Variables

Pastikan mengatur environment variables berikut di Vercel:

- `NEXT_PUBLIC_API_URL` - URL API backend
- `NEXT_PUBLIC_GRADIO_API_URL` - URL Gradio API
- `NEXT_PUBLIC_YOLO_MODELS` - Daftar model YOLO (dipisahkan koma)
- `NEXT_PUBLIC_DEFAULT_MODEL` - Model default
- `NEXT_IGNORE_TS_ERRORS` - diatur ke `true` untuk melewati error TypeScript
- `CI` - diatur ke `false` untuk melewati beberapa pemeriksaan build

## Backend API

Aplikasi ini membutuhkan koneksi ke backend API yang berjalan di Hugging Face Spaces. Jika backend tidak aktif, aplikasi akan menggunakan mode simulasi untuk testing.

## Mode Simulasi

Jika backend tidak tersedia, aplikasi akan secara otomatis beralih ke mode simulasi yang menghasilkan data dummy. Ini membantu development dan testing saat backend sedang offline.

## Lisensi

MIT

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deployment ke Vercel menggunakan GUI

1. **Login ke Vercel**
   - Kunjungi [vercel.com](https://vercel.com/)
   - Login menggunakan akun GitHub, GitLab, atau Bitbucket

2. **Import Repositori**
   - Klik tombol "Import Project" atau "Add New..."
   - Pilih "Import Git Repository"
   - Pilih penyedia Git yang sesuai (GitHub, GitLab, Bitbucket)
   - Pilih repositori yang berisi project FACTS Dashboard

3. **Konfigurasi Project**
   - Pastikan root directory diatur ke `facts-dashboard` (bukan root repositori)
   - Framework Preset: Next.js
   - Build Command: `npm run build` (biasanya sudah otomatis terisi)
   - Output Directory: `.next` (biasanya sudah otomatis terisi)

4. **Environment Variables**
   - Klik "Environment Variables"
   - Tambahkan variabel yang diperlukan:
     - `NEXT_PUBLIC_API_URL`: URL backend yang sudah di-deploy (misalnya https://facts-backend.herokuapp.com)
     - `NEXT_PUBLIC_GEMINI_API_KEY`: API key Google Gemini Anda

5. **Deploy**
   - Klik tombol "Deploy"
   - Tunggu hingga proses deployment selesai

6. **Verifikasi Deployment**
   - Setelah deployment selesai, klik URL yang diberikan untuk melihat aplikasi
   - Pastikan aplikasi berfungsi dengan baik dan dapat terhubung ke backend

## Tentang Aplikasi
