# Panduan Deployment ke GitHub Pages

Berikut adalah langkah-langkah untuk mendeploy aplikasi FACTS Dashboard ke GitHub Pages:

## Menggunakan GitHub Actions (Otomatis)

1. **Aktifkan GitHub Pages di repository Anda**:
   - Buka repository Anda di GitHub
   - Pergi ke "Settings" > "Pages"
   - Di bagian "Source", pilih "GitHub Actions"
   - Klik "Save"

2. **Push kode ke branch utama (master/main)**:
   ```bash
   git add .
   git commit -m "Setup for GitHub Pages deployment"
   git push origin master  # atau main, sesuaikan dengan branch utama Anda
   ```

3. **Verifikasi deployment**:
   - Pergi ke tab "Actions" di repository GitHub Anda
   - Anda akan melihat workflow "Deploy to GitHub Pages" berjalan
   - Setelah selesai, aplikasi Anda akan tersedia di: `https://[username].github.io/FACTS-Final-Version/`

## Deploy Manual (Alternatif)

Jika Anda ingin men-deploy secara manual tanpa GitHub Actions:

1. **Build aplikasi**:
   ```bash
   cd facts-dashboard
   npm run build
   ```

2. **Push folder `out` ke branch `gh-pages`**:
   ```bash
   git add out -f
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix facts-dashboard/out origin gh-pages
   ```

## Catatan Penting

- **Konfigurasi Basis Path**: Pastikan `basePath` dan `assetPrefix` di `next.config.js` sesuai dengan nama repository Anda.
- **Environment Variables**: Untuk variabel lingkungan, tambahkan di GitHub repository secrets jika diperlukan.
- **Kompatibilitas API**: API rewrites tidak berfungsi di GitHub Pages, pastikan API Anda mengizinkan CORS.

## Troubleshooting

### Masalah Asset Path
Jika gambar atau asset lain tidak muncul, periksa:
- Path ke asset menggunakan `basePath` yang benar
- File `.nojekyll` ada di root `/public`

### Masalah Routing
- Next.js routing client-side bekerja dengan baik, tetapi hard refresh mungkin mengarah ke 404
- Gunakan `Link` dari Next.js untuk navigasi daripada tag `<a>` biasa

### Custom Domain
Untuk menggunakan domain kustom:
1. Tambahkan domain kustom di Settings > Pages
2. Perbarui DNS di penyedia domain Anda
3. Perbarui `basePath` dan `assetPrefix` di `next.config.js` ke `''` (string kosong) 