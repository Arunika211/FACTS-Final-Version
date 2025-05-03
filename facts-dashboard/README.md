# FACTS Dashboard

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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
