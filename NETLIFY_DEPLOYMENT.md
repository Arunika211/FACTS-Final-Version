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
7. Klik "Deploy site"

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