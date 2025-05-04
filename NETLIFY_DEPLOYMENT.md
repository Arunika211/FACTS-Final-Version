# Panduan Deployment ke Netlify

Berikut adalah langkah-langkah untuk mendeploy aplikasi FACTS API ke Netlify:

## Langkah 1: Persiapkan Repository GitHub

1. Buat repository baru di akun GitHub baru yang ingin Anda gunakan
2. Clone repository tersebut ke komputer lokal:
   ```
   git clone https://github.com/username-baru/nama-repo-baru.git
   ```
3. Salin semua file dari proyek ini ke dalam repository baru
4. Push ke GitHub:
   ```
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

## Langkah 2: Deploy ke Netlify

### Melalui UI Netlify

1. Buka [netlify.com](https://netlify.com) dan login/daftar akun
2. Klik tombol "Add new site" > "Import an existing project"
3. Pilih "GitHub" sebagai penyedia Git
4. Otentikasi dengan akun GitHub baru Anda yang berisi repository proyek ini
5. Pilih repository yang telah Anda buat
6. Netlify akan otomatis mendeteksi file konfigurasi `netlify.toml` dan mengatur deployment
7. Tambahkan environment variables yang diperlukan di Netlify:
   - Buka site settings > Environment variables
   - Tambahkan variabel dari file `.env.local` yang ada di direktori `facts-dashboard`
8. Klik "Deploy site"

### Pengaturan Environment Variables

Pastikan untuk menambahkan environment variables berikut di dashboard Netlify:
- `NEXT_PUBLIC_GEMINI_API_KEY` 
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GRADIO_API_URL`
- `NEXT_PUBLIC_YOLO_MODELS`
- `NEXT_PUBLIC_DEFAULT_MODEL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_VERSION`

## Catatan Penting

- Aplikasi di Netlify memiliki batas ukuran fungsi sebesar 50MB, sehingga tidak semua fitur akan berfungsi
- Model-model machine learning seperti YOLO tidak dapat berjalan di Netlify Functions
- Deployment ini cocok untuk endpoint-endpoint API sederhana atau front-end aplikasi
- Pastikan menggunakan Node.js versi 20+ karena Next.js memerlukan minimal Node.js 18.18.0
- Komponen UI yang diperlukan telah dibuat di `src/components/ui/` - pastikan folder ini ada sebelum deploy

## Troubleshooting

### Masalah Module Not Found
Jika mendapatkan error "Module not found" untuk komponen UI, pastikan direktori `src/components/ui/` berisi file-file berikut:
- `card.jsx`
- `button.jsx`
- `input.jsx`
- `select.jsx`
- `badge.jsx`
- `alert.jsx`
- `tabs.jsx`
- `switch.jsx`
- `label.jsx`
- `spinner.jsx`

Jika mendapatkan error "Module not found: Can't resolve '@/lib/utils'", pastikan:
1. Direktori `src/lib` sudah ada
2. File `utils.js` sudah ada di direktori tersebut dengan fungsi `cn` yang dibutuhkan

### Masalah next.config.js
Jika mendapatkan peringatan "Unrecognized key(s) in object: 'swcMinify'", pastikan untuk menghapus opsi `swcMinify` dari file `next.config.js` karena tidak kompatibel dengan Next.js 15.3.1.

### Masalah Node.js Version
Pastikan `NODE_VERSION` di `netlify.toml` sudah diset ke "20.0.0" dan field `engines` di `package.json` juga diset ke ">=20.0.0".

### Masalah Versi Python
Netlify memiliki dukungan terbatas untuk versi Python. Untuk menghindari error versi Python:
- Gunakan versi Python yang didukung Netlify (misalnya 3.8.x atau 3.9.x)
- Tetapkan di `netlify.toml`:
  ```toml
  [build.environment]
    PYTHON_VERSION = "3.9.14"
  ```
- Hindari menggunakan versi Python yang belum dirilis secara stabil (seperti 3.13.x)

### Masalah TypeScript Linting
Jika mendapatkan error build karena masalah TypeScript linting, ada beberapa solusi:

1. **Solusi untuk Deployment Cepat:**
   - Gunakan flag `--no-lint` pada perintah build di `package.json`: 
     ```json
     "scripts": {
       "build": "next build --no-lint"
     }
     ```
   - Atur variabel lingkungan `CI=false` dan `NEXT_IGNORE_TS_ERRORS=true` di `netlify.toml`

2. **Solusi Jangka Panjang:**
   - Sesuaikan `.eslintrc.json` untuk mengatur aturan linting yang sesuai dengan kebutuhan proyek
   - Perbaiki semua error TypeScript dalam kode sumber
   - Perbarui `tsconfig.json` untuk mengatur opsi kompiler TypeScript

### Melalui Netlify CLI

1. Install Netlify CLI:
   ```
   npm install -g netlify-cli
   ```
2. Login ke Netlify:
   ```
   netlify login
   ```
3. Di direktori proyek, inisialisasi dan deploy:
   ```
   netlify init
   netlify deploy --prod
   ```

## Catatan Penting

- Aplikasi di Netlify memiliki batas ukuran fungsi sebesar 50MB, sehingga tidak semua fitur akan berfungsi
- Model-model machine learning seperti YOLO tidak dapat berjalan di Netlify Functions
- Deployment ini cocok untuk endpoint-endpoint API sederhana atau front-end aplikasi
- Untuk fungsionalitas penuh termasuk deteksi objek, gunakan platform yang mendukung aplikasi Python lengkap seperti:
  - Heroku
  - Railway
  - Render
  - DigitalOcean
  - AWS 