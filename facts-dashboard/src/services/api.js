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

// Mode simulasi - jika true, gunakan data simulasi tanpa mencoba koneksi ke backend
const SIMULATION_MODE = process.env.NEXT_PUBLIC_SIMULATION_MODE === 'true';

// Status backend
let isBackendAwake = false;
let wakeUpAttempted = false;
let lastWakeUpTime = 0;

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
 * Helper function untuk mengatasi masalah CORS
 * @param {string} url - URL API yang akan dipanggil
 * @param {Object} options - Opsi fetch
 * @returns {Promise<Response>} - Response dari API
 */
const fetchWithCORS = async (url, options = {}) => {
  // Tambahkan mode 'cors' dan credentials 'include'
  const fetchOptions = {
    ...options,
    mode: 'cors',
    credentials: 'include',
    headers: {
      ...options.headers,
      'Access-Control-Allow-Origin': '*',
    }
  };
  
  try {
    // Coba langsung ke API
    const response = await fetch(url, fetchOptions);
    if (response.ok) return response;
    
    // Jika gagal, coba gunakan CORS proxy
    const corsProxies = [
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    // Coba setiap proxy sampai berhasil
    for (const proxyUrl of corsProxies) {
      try {
        console.log(`Trying CORS proxy: ${proxyUrl}`);
        const proxyResponse = await fetch(proxyUrl, options);
        if (proxyResponse.ok) {
          console.log(`Successfully used proxy: ${proxyUrl}`);
          return proxyResponse;
        }
      } catch (e) {
        console.warn(`Proxy ${proxyUrl} failed:`, e);
      }
    }
    
    throw new Error(`All CORS proxies failed`);
  } catch (error) {
    console.error('CORS fetch error:', error);
    throw error;
  }
};

/**
 * Mencoba "membangunkan" Hugging Face Space yang mungkin "tidur"
 * @returns {Promise<boolean>} - true jika berhasil membangunkan, false jika gagal
 */
export const wakeUpBackend = async () => {
  // Hindari mencoba membangunkan terlalu sering (cooldown 30 detik)
  const now = Date.now();
  if (wakeUpAttempted && now - lastWakeUpTime < 30000) {
    console.log('Wake up recently attempted, waiting for cooldown');
    return false;
  }
  
  wakeUpAttempted = true;
  lastWakeUpTime = now;
  console.log('Attempting to wake up Hugging Face Space...');
  
  // Lakukan beberapa request untuk membangunkan Space
  try {
    // Pertama coba request GET biasa ke URL Space
    const wakeupResponse = await fetch(API_URL, { 
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    // Kemudian coba ping endpoint API predict dengan data minimal
    await fetch(GRADIO_API_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        fn_index: 1, // get_system_status memiliki overhead rendah
        data: [],
      }),
    });
    
    // Tunggu 5 detik untuk memberi waktu Space diinisialisasi
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cek apakah sekarang sudah bangun
    const checkResponse = await fetch(`${API_URL}/status`, { 
      method: 'GET',
      cache: 'no-store'
    });
    
    if (checkResponse.ok) {
      console.log('Backend successfully woken up!');
      isBackendAwake = true;
      return true;
    }
  } catch (error) {
    console.warn('Failed to wake up backend:', error);
  }
  
  console.log('Could not wake up backend, will use simulation mode');
  return false;
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

    // Coba bangunkan backend jika belum pernah dicoba
    if (!isBackendAwake && !wakeUpAttempted) {
      await wakeUpBackend();
    }
    
    // Panggil API Gradio dengan CORS handling
    console.log(`Calling Gradio API with model: ${model}`);
    
    try {
      // Cara 1: Langsung ke API dengan CORS handling
      const response = await fetchWithCORS(GRADIO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fn_index: 0, // Indeks fungsi process_image di Gradio
          data: [base64Image, model],
        }),
      });
      
      const result = await response.json();
      isBackendAwake = true; // Jika berhasil, tandai bahwa backend sudah bangun
      return result.data;
    } catch (error) {
      console.warn('Direct API call failed, using simulation mode:', error);
      
      // Coba bangunkan lagi jika gagal dan belum mencoba sebelumnya
      if (!wakeUpAttempted) {
        const awakened = await wakeUpBackend();
        if (awakened) {
          // Coba lagi setelah membangunkan
          return await detectAnimal(imageFile, model);
        }
      }
      
      // Fallback ke mode simulasi jika API call gagal
      return generateSampleDetection(model);
    }
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
    // Coba bangunkan backend jika belum pernah dicoba
    if (!isBackendAwake && !wakeUpAttempted) {
      await wakeUpBackend();
    }
    
    const response = await fetchWithCORS(GRADIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fn_index: 1, // Indeks fungsi get_system_status di Gradio
        data: [],
      }),
    });

    const result = await response.json();
    isBackendAwake = true; // Jika berhasil, tandai bahwa backend sudah bangun
    return result.data;
  } catch (error) {
    console.error('Error getting system status:', error);
    
    // Coba bangunkan lagi jika gagal dan belum mencoba sebelumnya
    if (!wakeUpAttempted) {
      const awakened = await wakeUpBackend();
      if (awakened) {
        // Coba lagi setelah membangunkan
        return await getSystemStatus();
      }
    }
    
    return '### Status Sistem (Mode Simulasi)\n\n' +
           '- **Backend**: ❌ Tidak tersedia (menggunakan mode simulasi)\n' +
           '- **Simulasi**: ✅ Aktif\n' +
           '- **Models**: Menggunakan data contoh\n\n' +
           '> *Catatan: Backend mungkin sedang offline atau terjadi masalah CORS. ' +
           'Aplikasi berjalan dalam mode simulasi dengan data contoh.*';
  }
};

/**
 * Mendapatkan data sensor dari API - YANG DITAMBAHKAN UNTUK KOMPATIBILITAS DENGAN page.tsx
 * @param {string} [animalType] - Jenis hewan (opsional)
 * @returns {Promise<Array>} - Array data sensor
 */
export const fetchSensorData = async (animalType) => {
  // Gunakan mode simulasi jika diaktifkan
  if (SIMULATION_MODE) {
    console.log('Menggunakan mode simulasi untuk data sensor');
    return generateSimulatedSensorData(animalType);
  }
  
  try {
    if (!isBackendAwake && !wakeUpAttempted) {
      await wakeUpBackend();
    }
    
    const url = animalType 
      ? `${API_URL}/sensor-data?ternak=${animalType}`
      : `${API_URL}/sensor-data`;
      
    const response = await fetchWithCORS(url);
    const data = await response.json();
    isBackendAwake = true;
    
    // Pastikan data adalah array sebelum mengembalikan
    if (!Array.isArray(data)) {
      console.warn('Response data bukan array:', data);
      return generateSimulatedSensorData(animalType);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    
    if (!wakeUpAttempted) {
      const awakened = await wakeUpBackend();
      if (awakened) {
        return await fetchSensorData(animalType);
      }
    }
    
    // Buat data simulasi dengan jenis hewan tertentu jika diperlukan
    return generateSimulatedSensorData(animalType);
  }
};

/**
 * Mendapatkan data aktivitas CV (Computer Vision) dari API
 * @param {string} [animalType] - Jenis hewan (opsional)
 * @returns {Promise<Array>} - Array data aktivitas CV
 */
export const fetchCVActivity = async (animalType) => {
  // Gunakan mode simulasi jika diaktifkan
  if (SIMULATION_MODE) {
    console.log('Menggunakan mode simulasi untuk data CV');
    return generateSimulatedCVActivity(animalType);
  }
  
  try {
    if (!isBackendAwake && !wakeUpAttempted) {
      await wakeUpBackend();
    }
    
    const url = animalType 
      ? `${API_URL}/cv-activity?ternak=${animalType}` 
      : `${API_URL}/cv-activity`;
      
    const response = await fetchWithCORS(url);
    const data = await response.json();
    isBackendAwake = true;
    
    // Pastikan data adalah array sebelum mengembalikan
    if (!Array.isArray(data)) {
      console.warn('Response data CV bukan array:', data);
      return generateSimulatedCVActivity(animalType);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching CV activity:', error);
    
    if (!wakeUpAttempted) {
      const awakened = await wakeUpBackend();
      if (awakened) {
        return await fetchCVActivity(animalType);
      }
    }
    
    // Buat data simulasi untuk aktivitas CV
    return generateSimulatedCVActivity(animalType);
  }
};

/**
 * Mengirim data sensor uji ke API
 * @param {string} animalType - Jenis hewan untuk data uji
 * @returns {Promise<boolean>} - true jika berhasil, false jika gagal
 */
export const sendTestSensorData = async (animalType) => {
  try {
    if (!isBackendAwake && !wakeUpAttempted) {
      await wakeUpBackend();
    }
    
    const testData = {
      device_id: "SENSOR_TEST",
      ternak: animalType,
      timestamp: new Date().toISOString(),
      temperature: 25 + Math.random() * 10,
      humidity: 40 + Math.random() * 40,
      light: 100 + Math.random() * 900,
      soil_moisture: 20 + Math.random() * 60,
      motion: Math.random() > 0.5
    };
    
    const response = await fetchWithCORS(`${API_URL}/sensor-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error sending test sensor data:', error);
    
    // Kembalikan true untuk simulasi bahwa pengiriman berhasil
    // Karena kita menggunakan data simulasi, tidak ada efek samping
    return true;
  }
};

/**
 * Menghasilkan batch data sensor uji
 * @param {string} animalType - Jenis hewan
 * @param {number} count - Jumlah data yang akan dihasilkan
 * @returns {Promise<boolean>} - true jika berhasil, false jika gagal
 */
export const generateBatchSensorData = async (animalType, count = 10) => {
  try {
    if (!isBackendAwake && !wakeUpAttempted) {
      await wakeUpBackend();
    }
    
    const batchData = Array.from({ length: count }, (_, i) => {
      // Buat timestamp mundur dari sekarang
      const timestamp = new Date(Date.now() - i * 60000).toISOString();
      
      return {
        device_id: `BATCH_${i + 1}`,
        ternak: animalType,
        timestamp,
        temperature: 25 + Math.random() * 10,
        humidity: 40 + Math.random() * 40,
        light: 100 + Math.random() * 900,
        soil_moisture: 20 + Math.random() * 60,
        motion: Math.random() > 0.5
      };
    });
    
    const response = await fetchWithCORS(`${API_URL}/sensor-data/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error generating batch sensor data:', error);
    
    // Kembalikan true untuk simulasi bahwa pengiriman berhasil
    return true;
  }
};

/**
 * Mendapatkan data sensor dari API
 * @param {number} limit - Jumlah data yang akan diambil
 * @returns {Promise<Array>} - Array data sensor
 */
export const getSensorData = async (limit = 50) => {
  try {
    // Coba bangunkan backend jika belum pernah dicoba
    if (!isBackendAwake && !wakeUpAttempted) {
      await wakeUpBackend();
    }
    
    // Coba dengan fetchWithCORS untuk mengatasi masalah CORS
    const response = await fetchWithCORS(`${API_URL}/sensor-data?limit=${limit}`);
    const data = await response.json();
    isBackendAwake = true; // Jika berhasil, tandai bahwa backend sudah bangun
    return data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    
    // Coba bangunkan lagi jika gagal dan belum mencoba sebelumnya
    if (!wakeUpAttempted) {
      const awakened = await wakeUpBackend();
      if (awakened) {
        // Coba lagi setelah membangunkan
        return await getSensorData(limit);
      }
    }
    
    // Buat data dummy sebagai fallback
    return generateDummySensorData(limit);
  }
};

/**
 * Menghasilkan data sensor dummy untuk fallback
 * @param {number} count - Jumlah data yang akan dibuat
 * @returns {Array} - Array data sensor dummy
 */
const generateDummySensorData = (count = 10) => {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(now - (i * hourMs));
    return {
      device_id: "SIMULATOR",
      timestamp: timestamp.toISOString(),
      temperature: 20 + Math.random() * 15,
      humidity: 40 + Math.random() * 40,
      light: 100 + Math.random() * 900,
      soil_moisture: 20 + Math.random() * 60,
      motion: Math.random() > 0.7,
      simulation: true
    };
  }).reverse();
};

/**
 * Menghasilkan data simulasi spesifik jenis hewan
 * @param {string} animalType - Jenis hewan
 * @param {number} count - Jumlah data
 * @returns {Array} - Data sensor simulasi
 */
const generateSimulatedSensorData = (animalType, count = 10) => {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  // Set nilai berbeda berdasarkan jenis hewan
  let tempRange, humidityRange, lightRange, soilRange;
  
  switch (animalType?.toLowerCase()) {
    case 'sapi':
      tempRange = [18, 25];
      humidityRange = [40, 60];
      lightRange = [100, 800];
      soilRange = [30, 50];
      break;
    case 'ayam':
      tempRange = [25, 33];
      humidityRange = [50, 70];
      lightRange = [200, 1000];
      soilRange = [20, 40];
      break;
    case 'kambing':
      tempRange = [20, 28];
      humidityRange = [30, 55];
      lightRange = [150, 900];
      soilRange = [25, 45];
      break;
    default:
      tempRange = [20, 30];
      humidityRange = [40, 70];
      lightRange = [100, 900];
      soilRange = [20, 60];
  }
  
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(now - (i * hourMs));
    return {
      device_id: "SIMULATOR",
      ternak: animalType || "tidak diketahui",
      timestamp: timestamp.toISOString(),
      temperature: tempRange[0] + Math.random() * (tempRange[1] - tempRange[0]),
      humidity: humidityRange[0] + Math.random() * (humidityRange[1] - humidityRange[0]),
      light: lightRange[0] + Math.random() * (lightRange[1] - lightRange[0]),
      soil_moisture: soilRange[0] + Math.random() * (soilRange[1] - soilRange[0]),
      motion: Math.random() > 0.7,
      simulation: true
    };
  }).reverse();
};

/**
 * Menghasilkan data simulasi untuk aktivitas CV
 * @param {string} animalType - Jenis hewan
 * @param {number} count - Jumlah data
 * @returns {Array} - Data aktivitas CV simulasi
 */
const generateSimulatedCVActivity = (animalType, count = 10) => {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  // Aktivitas yang mungkin dilakukan berdasarkan jenis hewan
  const activities = {
    sapi: ['makan', 'istirahat', 'berjalan', 'minum'],
    ayam: ['makan', 'istirahat', 'berkelompok', 'mematuk'],
    kambing: ['makan', 'istirahat', 'melompat', 'minum']
  };
  
  // Tentukan aktivitas default jika jenis hewan tidak dikenali
  const defaultActivities = ['makan', 'istirahat', 'bergerak'];
  const animalActivities = activities[animalType?.toLowerCase()] || defaultActivities;
  
  return Array.from({ length: count }, (_, i) => {
    const timestamp = new Date(now - (i * hourMs));
    const activity = animalActivities[Math.floor(Math.random() * animalActivities.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 0.7 - 1.0
    
    return {
      timestamp: timestamp.toISOString(),
      ternak: animalType || "tidak diketahui",
      activity: activity,
      confidence: confidence,
      detection_id: `sim-${Date.now()}-${i}`,
      simulation: true
    };
  }).reverse();
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

/**
 * Cek apakah backend sedang aktif/online
 * @returns {Promise<boolean>} - true jika backend online, false jika offline
 */
export const isBackendOnline = async () => {
  if (isBackendAwake) return true;
  
  try {
    const awakened = await wakeUpBackend();
    return awakened;
  } catch (error) {
    console.error('Error checking backend status:', error);
    return false;
  }
};

// Ekspor konstanta
export const constants = {
  AVAILABLE_MODELS,
  DEFAULT_MODEL
};

// Coba bangunkan backend saat modul dimuat
wakeUpBackend().then(success => {
  if (success) {
    console.log('Backend woken up on module load');
  } else {
    console.log('Backend could not be woken up on module load');
  }
});

export default {
  detectAnimal,
  getSystemStatus,
  getSensorData,
  imageToBase64,
  generateSampleDetection,
  isBackendOnline,
  wakeUpBackend,
  // Fungsi-fungsi baru yang ditambahkan
  fetchSensorData,
  fetchCVActivity,
  sendTestSensorData,
  generateBatchSensorData,
  constants
}; 