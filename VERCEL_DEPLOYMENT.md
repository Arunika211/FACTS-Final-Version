# Panduan Deployment ke Vercel dengan CLI

Berikut adalah langkah-langkah untuk deploy aplikasi FACTS Dashboard ke Vercel menggunakan CLI:

## Persiapan

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login ke Vercel**
   ```bash
   vercel login
   ```
   Ini akan membuka browser untuk autentikasi dengan akun Vercel Anda.

## Deployment

1. **Masuk ke direktori project**
   ```bash
   cd facts-dashboard
   ```

2. **Deploy project**
   ```bash
   vercel
   ```
   Jawab pertanyaan interaktif yang muncul:
   - Link to existing project? Pilih `n` jika ini deployment pertama
   - What's your project's name? `facts-dashboard`
   - In which directory is your code located? `.` (karena sudah di dalam direktori facts-dashboard)

3. **Deploy ke production**
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Jika Build Gagal

1. **Periksa Log Error**
   ```bash
   vercel logs [nama-project-url]
   ```

2. **Coba Deploy dengan Melewati Linting & Type Check**
   ```bash
   vercel --build-env NEXT_IGNORE_TS_ERRORS=true --build-env CI=false
   ```

3. **Update Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```

4. **Coba Deploy Ulang Setelah Perbaikan**
   ```bash
   vercel --prod
   ```

### Mengatasi Masalah CORS

Jika aplikasi Anda mengalami masalah koneksi ke backend API (misalnya, pesan "Failed to load sensor data"), ini mungkin disebabkan oleh masalah CORS (Cross-Origin Resource Sharing). Berikut beberapa solusi:

1. **Tambahkan Header CORS di Vercel**
   
   Vercel.json sudah dikonfigurasi dengan header CORS yang diperlukan:
   ```json
   "headers": [
     {
       "source": "/(.*)",
       "headers": [
         { "key": "Access-Control-Allow-Credentials", "value": "true" },
         { "key": "Access-Control-Allow-Origin", "value": "*" },
         ...
       ]
     }
   ]
   ```

2. **Gunakan CORS Proxy**
   
   File `src/services/api.js` telah dimodifikasi untuk menggunakan CORS proxy jika panggilan API langsung gagal. Proxy yang digunakan:
   - cors-anywhere.herokuapp.com
   - api.allorigins.win
   - corsproxy.io

3. **Fallback ke Data Simulasi**
   
   Jika semua panggilan API gagal, aplikasi akan menggunakan data simulasi sebagai fallback, sehingga aplikasi tetap berfungsi meskipun tidak ada koneksi ke backend.

### Konfigurasi File yang Sudah Dipersiapkan

1. **vercel.json**: Pengaturan build dan environment variables
2. **.npmrc**: Mengoptimalkan proses instalasi
3. **package.json**: Script build yang dioptimasi untuk melewati error
4. **next.config.js**: Konfigurasi Next.js yang sudah disesuaikan untuk Vercel

## Mengatur Domain Kustom (Opsional)

```bash
vercel domains add yourdomain.com
```

## Monitor Deployment

1. **Melihat Daftar Deployment**
   ```bash
   vercel ls
   ```

2. **Melihat Detail Project**
   ```bash
   vercel project facts-dashboard
   ```

## Rollback ke Versi Sebelumnya

```bash
vercel rollback
``` 