---
title: FACTS API - Animal Detection
emoji: 🐄
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: 3.50.2
app_file: app.py
pinned: false
---

# FACTS API - Animal Detection

API berbasis Gradio untuk deteksi hewan (sapi, ayam, kambing) menggunakan model YOLO.

## Fitur

- Deteksi hewan dengan model YOLOv5
- Upload gambar untuk deteksi
- Visualisasi hasil deteksi dengan bounding box
- Status model dan sistem

## Cara Penggunaan

1. Upload gambar yang ingin dideteksi
2. Pilih model yang ingin digunakan (sapi, ayam, kambing, atau YOLOv5s)
3. Klik "Submit" dan lihat hasilnya

## Kode Integrasi

Aplikasi ini juga dapat diintegrasikan dengan aplikasi Next.js melalui API Gradio:

```javascript
// Contoh di Next.js
const API_URL = "https://yourusername-facts-api.hf.space";

// Fungsi untuk mengonversi gambar ke base64
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Deteksi menggunakan API Gradio
async function detectAnimal(imageFile, model = "sapi") {
  const base64Image = await imageToBase64(imageFile);
  
  // Menggunakan API Gradio
  const response = await fetch(`${API_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [base64Image, model]
    })
  });
  
  return await response.json();
}
```

## Pengembangan Lokal

```bash
pip install -r requirements.txt
python app.py
```

# FACTS (Farm Animal Control and Tracking System)

Sistem monitoring dan deteksi ternak berbasis AI untuk memantau kondisi lingkungan kandang dan mendeteksi ternak melalui kamera atau video. Aplikasi ini menggunakan model YOLO untuk deteksi dan tracking hewan ternak dengan teknologi BoT-SORT.

## Fitur Utama

- **Monitoring Lingkungan Kandang**
  - Pemantauan suhu, kelembaban, dan kualitas udara
  - Visualisasi data sensor dalam bentuk grafik
  - Notifikasi jika parameter di luar ambang batas normal

- **Deteksi Ternak dengan AI**
  - Deteksi hewan ternak (ayam, sapi, kambing) secara real-time
  - Deteksi penyakit pada ayam (menggunakan model ayam.pt)
  - Tracking pergerakan hewan dengan BoT-SORT
  - Mode simulasi untuk testing tanpa kamera

- **Dashboard Interaktif**
  - UI modern dengan design responsive
  - Visualisasi data yang interaktif
  - Mode gelap/terang
  - Analisis data real-time

## Struktur Proyek

```
├── server.py           # Server Flask terintegrasi dengan deteksi YOLO
├── models/             # Model-model YOLO (.pt files)
│   ├── ayam.pt         # Model untuk deteksi ayam dan penyakitnya
│   ├── sapi.pt         # Model untuk deteksi sapi
│   └── kambing.pt      # Model untuk deteksi kambing
├── data/               # Untuk menyimpan data deteksi
├── send-sensor.py      # Utilitas untuk mengirim data sensor
└── facts-dashboard/    # Frontend Dashboard (Next.js)
    ├── src/              # Kode sumber frontend
    │   ├── app/            # Komponen halaman Next.js
    │   ├── components/     # Komponen UI yang dapat digunakan kembali
    │   ├── services/       # Layanan API dan integrasi
    │   └── styles/         # Style dan tema aplikasi
    ├── public/           # Aset statis
    └── ...              # File konfigurasi Next.js
```

## Persyaratan Sistem

- **Backend:**
  - Python 3.8+
  - PyTorch 1.7+
  - CUDA (opsional, untuk akselerasi GPU)
  - 4GB RAM minimum, rekomendasi 8GB+

- **Frontend:**
  - Node.js 18+
  - Browser modern (Chrome, Firefox, Edge)
  - Webcam atau file video untuk deteksi (opsional)

## Instalasi

### 1. Persiapan

Pastikan model-model YOLO (.pt) sudah ada di folder `models/`:
- `ayam.pt` - Model untuk deteksi ayam
- `sapi.pt` - Model untuk deteksi sapi
- `kambing.pt` - Model untuk deteksi kambing

### 2. Instalasi Backend

```bash
# Clone repositori (jika belum)
git clone https://github.com/Arunika211/FACTS-Monitoring-System.git
cd FACTS-Monitoring-System

# Buat virtual environment
python -m venv myenv

# Aktifkan virtual environment
# Windows
myenv\Scripts\activate
# Linux/Mac
source myenv/bin/activate

# Install dependensi
pip install -r requirements.txt
```

### 3. Instalasi Frontend

```bash
cd facts-dashboard
npm install
```

## Cara Menjalankan

### 1. Menjalankan Server Backend

```bash
# Dari root project
python server.py
```

Server akan berjalan di `http://localhost:5000` dengan endpoint:
- `/status` - Mengecek status server
- `/detect` - Endpoint untuk deteksi objek
- `/cv-activity` - Endpoint untuk menyimpan data aktivitas
- `/sensors` - Endpoint untuk data sensor

### 2. Menjalankan Frontend Dashboard

```bash
cd facts-dashboard
npm run dev
```

Dashboard akan berjalan di `http://localhost:3000` dan secara otomatis terhubung ke server API di port 5000.

### 3. Menggunakan Batch Script (Windows)

```bash
# Dari root project
start.bat
```

## Cara Penggunaan Dashboard

1. Buka dashboard di browser `http://localhost:3000`
2. Di halaman Dashboard:
   - Lihat status sensor lingkungan kandang
   - Monitor statistik dan tren data
3. Di halaman Deteksi:
   - Pilih jenis hewan yang ingin dideteksi (ayam, sapi, atau kambing)
   - Pilih mode: **Simulation** atau **YOLO Detection**
   - Klik "Start Camera" untuk mengaktifkan kamera
   - Klik "Start Detection" untuk memulai deteksi
4. Di halaman Analytics:
   - Analisis data historis dan tren
   - Filter data berdasarkan tanggal dan jenis sensor

## Deployment

### Deployment Backend (Flask)

1. Pastikan semua dependensi terpasang dan model YOLO tersedia di folder `models/`
2. Atur konfigurasi server produksi di `config.ini` (jika ada)
3. Jalankan dengan Gunicorn (produksi):
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 server:app
   ```

### Deployment Frontend (Next.js)

#### Menggunakan Vercel GUI (Disarankan)

1. **Login ke Vercel**
   - Kunjungi [vercel.com](https://vercel.com/)
   - Login menggunakan akun GitHub, GitLab, atau Bitbucket

2. **Import Repositori**
   - Klik tombol "Import Project" atau "Add New..."
   - Pilih "Import Git Repository"
   - Pilih repositori yang berisi project FACTS Dashboard

3. **Konfigurasi Project**
   - Root Directory: `facts-dashboard`
   - Framework Preset: Next.js
   - Build Command: `npm run build` (biasanya sudah otomatis terisi)
   - Output Directory: `.next` (biasanya sudah otomatis terisi)

4. **Environment Variables**
   - Klik "Environment Variables"
   - Tambahkan variabel yang diperlukan:
     - `NEXT_PUBLIC_API_URL`: URL backend yang sudah di-deploy
     - `NEXT_PUBLIC_GEMINI_API_KEY`: API key Google Gemini

5. **Deploy**
   - Klik tombol "Deploy"
   - Tunggu hingga proses deployment selesai

#### Menggunakan Command Line

1. Build aplikasi Next.js:
   ```bash
   cd facts-dashboard
   npm run build
   ```

2. Deploy ke hosting statis (Vercel, Netlify):
   ```bash
   # Vercel CLI
   vercel --prod
   
   # Atau Netlify CLI
   netlify deploy --prod
   ```

## Spesifikasi Model YOLO

### ayam.pt
- Mendeteksi berbagai jenis ayam dan penyakitnya
- Class: [jenis ayam, penyakit, dll]

### sapi.pt
- Mendeteksi sapi
- Class: [jenis sapi]

### kambing.pt
- Mendeteksi kambing
- Class: [jenis kambing]

## Pemecahan Masalah

### Server Backend Tidak Terhubung
- Pastikan server Flask berjalan dan dapat diakses di port yang benar
- Periksa apakah ada firewall yang memblokir koneksi
- Jika menggunakan deployment terpisah, pastikan CORS diaktifkan

### Model YOLO Tidak Berfungsi
- Pastikan file model YOLO ada di folder `models/`
- Periksa apakah PyTorch terinstal dengan benar dengan perintah:
  ```python
  python -c "import torch; print(torch.__version__)"
  ```
- Jika mengalami error "Failed to load PyTorch Hub model", coba jalankan:
  ```
  python -c "import torch; torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)"
  ```

### Tampilan Frontend Rusak
- Hapus cache browser dan reload
- Jalankan `npm run build` untuk membangun ulang aplikasi
- Periksa console browser untuk error JavaScript

## Requirements

```
# Backend
flask==2.0.1
flask-cors==3.0.10
torch>=1.7.0
torchvision>=0.8.1
numpy>=1.19.0
opencv-python>=4.5.3
Pillow>=8.3.1
PyYAML>=5.4.1
tqdm>=4.62.2
pymongo>=4.0.0
gunicorn>=20.1.0

# Frontend (di folder facts-dashboard)
next>=13.0.0
react>=18.0.0
tailwindcss>=3.3.0
```

## Lisensi
Project ini dilisensikan di bawah lisensi MIT. 