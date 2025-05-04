/**
 * FACTS API Service
 * Service untuk mengakses API Gradio di HuggingFace Spaces
 */

// Ambil URL API dari environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://arunika211-facts-api.hf.space';
const GRADIO_API_URL = process.env.NEXT_PUBLIC_GRADIO_API_URL || 'https://arunika211-facts-api.hf.space/api/predict';

// Array model YOLO
const AVAILABLE_MODELS = (process.env.NEXT_PUBLIC_YOLO_MODELS || 'sapi,ayam,kambing,yolov5s').split(',');
const DEFAULT_MODEL = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'sapi';

/**
 * Mengkonversi gambar ke format base64
 * @param {File} file - File gambar yang akan dikonversi
 * @returns {Promise<string>} - String base64 dari gambar
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Hapus prefix 'data:image/jpeg;base64,'
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Fungsi untuk melakukan deteksi hewan menggunakan Gradio API
 * @param {File|Blob|string} imageFile - File gambar, bisa berupa File, Blob, atau string base64
 * @param {string} model - Nama model yang akan digunakan (default: sapi)
 * @returns {Promise<Array>} - Array hasil deteksi [gambar_hasil, teks_hasil, detail_deteksi]
 */
export const detectAnimal = async (imageFile, model = DEFAULT_MODEL) => {
  try {
    // Validasi model
    if (!AVAILABLE_MODELS.includes(model)) {
      throw new Error(`Model '${model}' tidak valid. Model yang tersedia: ${AVAILABLE_MODELS.join(', ')}`);
    }

    // Proses gambar menjadi base64 jika perlu
    let base64Image;
    if (typeof imageFile === 'string') {
      // Jika sudah berupa string, asumsi sudah base64
      base64Image = imageFile.includes('base64,') ? imageFile.split('base64,')[1] : imageFile;
    } else {
      // Jika berupa File atau Blob
      base64Image = await imageToBase64(imageFile);
    }

    // Panggil API Gradio
    console.log(`Calling Gradio API with model: ${model}`);
    const response = await fetch(GRADIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fn_index: 0, // Indeks fungsi process_image di Gradio
        data: [base64Image, model],
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error detecting animal:', error);
    throw error;
  }
};

/**
 * Mendapatkan status sistem dan model dari API
 * @returns {Promise<string>} - Status sistem dalam format Markdown
 */
export const getSystemStatus = async () => {
  try {
    const response = await fetch(GRADIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fn_index: 1, // Indeks fungsi get_system_status di Gradio
        data: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting system status:', error);
    return '### Error\nGagal mendapatkan status sistem. API mungkin sedang offline.';
  }
};

/**
 * Menghasilkan contoh objek deteksi untuk testing
 * @param {string} model - Nama model
 * @returns {Array} - Data contoh [null, text, detections]
 */
export const generateSampleDetection = (model = DEFAULT_MODEL) => {
  const timestamp = new Date().toISOString();
  const className = model === 'sapi' ? 'sapi' : model === 'ayam' ? 'ayam' : model === 'kambing' ? 'kambing' : 'person';
  
  return [
    null, // Tidak ada gambar hasil
    `Contoh data (mode simulasi)\nTerdeteksi 1 objek (waktu: 0.35s):\n1. ${className} (0.85)`,
    [
      {
        class: className,
        confidence: 0.85,
        bbox: [120, 80, 380, 320]
      }
    ]
  ];
};

// Ekspor konstanta
export const constants = {
  AVAILABLE_MODELS,
  DEFAULT_MODEL
};

export default {
  detectAnimal,
  getSystemStatus,
  imageToBase64,
  generateSampleDetection,
  constants
}; 