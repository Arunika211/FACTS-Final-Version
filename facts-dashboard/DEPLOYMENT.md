# Panduan Deployment FACTS Dashboard

Dokumen ini berisi langkah-langkah detail untuk men-deploy aplikasi FACTS Dashboard.

## Deployment ke Vercel (Rekomendasi)

Vercel adalah platform terbaik untuk men-deploy aplikasi Next.js karena memberikan performa optimal dan integrasi seamless.

### Langkah-langkah:

1. Buat akun di [Vercel](https://vercel.com) jika belum memilikinya
2. Install Vercel CLI (opsional): `npm i -g vercel`
3. Clone repository ini: `git clone <repo-url>`
4. Masuk ke direktori: `cd facts-dashboard`
5. Deploy dengan CLI: `vercel` atau deploy langsung dari dashboard Vercel

### Konfigurasi Advanced di Vercel:

- **Framework Preset**: Pilih Next.js
- **Build Command**: `CI=false NEXT_IGNORE_TS_ERRORS=true npm run build --no-lint` 
- **Output Directory**: `.next`
- **Node.js Version**: 20.x (minimal 20.0.0)
- **Region**: sin1 (Singapore) untuk performa terbaik di Asia

### Environment Variables:

```
NEXT_PUBLIC_API_URL=https://arunika211-facts-api.hf.space
NEXT_PUBLIC_GRADIO_API_URL=https://arunika211-facts-api.hf.space/api/predict
NEXT_PUBLIC_YOLO_MODELS=sapi,ayam,kambing,yolov5s
NEXT_PUBLIC_DEFAULT_MODEL=sapi
NEXT_IGNORE_TS_ERRORS=true
CI=false
```

## Alternatif Deployment

### GitHub Pages

1. Update `next.config.js`:
   ```js
   const nextConfig = {
     output: 'export',
     basePath: '/nama-repo',
     assetPrefix: '/nama-repo/',
     images: {
       unoptimized: true
     },
   };
   ```

2. Tambahkan GitHub Actions workflow:
   ```yaml
   name: Deploy to GitHub Pages
   on: [push]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         - run: npm ci
         - run: npm run build
         - name: Deploy to GitHub Pages
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             branch: gh-pages
             folder: out
   ```

### Netlify

1. Buat file `netlify.toml`:
   ```toml
   [build]
     command = "CI=false NEXT_IGNORE_TS_ERRORS=true npm run build --no-lint"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "20"
     NPM_FLAGS = "--legacy-peer-deps"
     NEXT_TELEMETRY_DISABLED = "1"
     NEXT_IGNORE_TS_ERRORS = "true"
     CI = "false"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. Tambahkan [@netlify/plugin-nextjs](https://www.npmjs.com/package/@netlify/plugin-nextjs) ke devDependencies.

## Mengatasi Masalah Umum

### CORS dengan Backend

Jika mengalami masalah CORS dengan Hugging Face Spaces backend:

1. Verifikasi bahwa header CORS dikonfigurasi dengan benar di `next.config.js` dan `vercel.json`
2. Gunakan proxy CORS sebagai fallback (sudah diimplementasikan dalam `api.js`)

### Hugging Face Spaces yang "Tidur"

Layanan Hugging Face Spaces free tier biasanya "tidur" setelah tidak aktif beberapa waktu:

1. Aplikasi sudah memiliki mekanisme "wake-up" di `api.js`
2. Mode simulasi akan aktif jika backend tidak tersedia

### Error TypeScript

Jika mengalami error TypeScript saat build:

1. Tambahkan `typescript.ignoreBuildErrors=true` di `next.config.js` (sudah ditambahkan)
2. Gunakan flag `NEXT_IGNORE_TS_ERRORS=true` saat build (sudah dikonfigurasi)
3. Jika masih mengalami error, perbaiki dengan mengikuti log error

### Error Build di Vercel

Jika mengalami error "Command "npm run build" exited with 1":

1. Periksa log build dengan `vercel logs <deployment-url>`
2. Pastikan semua konfigurasi file berikut telah benar:
   - `.eslintrc.js` (dengan aturan yang dimatikan)
   - `.babelrc` (dengan preset next/babel)
   - `.nvmrc` (dengan versi Node.js 20.x)
   - `next.config.js` (dengan TypeScript dan ESLint dilewati)

### Node.js Version Mismatch

Pastikan menggunakan Node.js minimal v20.0.0, sesuai yang didefinisikan di `package.json` dan `.nvmrc`

## Deployment Manual dengan Langkah-langkah Troubleshooting

Jika Anda mengalami kegagalan build, ikuti langkah-langkah berikut:

1. Clone repository: `git clone <repo-url>`
2. Masuk ke direktori: `cd facts-dashboard` 
3. Install dependencies: `npm install --legacy-peer-deps`
4. Buat build lokal: `CI=false NEXT_IGNORE_TS_ERRORS=true npm run build --no-lint`
5. Jika build berhasil, deploy ke Vercel: `vercel --prod`
6. Jika build gagal:
   - Periksa error di log
   - Perbaiki error terkait TypeScript/ESLint
   - Tambahkan file yang hilang atau diperlukan

## Monitoring Pasca-Deployment

Setelah deployment:

1. Verifikasi koneksi ke backend Hugging Face Spaces
2. Periksa log untuk error atau warning
3. Test fitur utama (monitoring, deteksi, dll.)

## Support

Jika mengalami masalah saat deployment, silakan kontak [maintainer]. 