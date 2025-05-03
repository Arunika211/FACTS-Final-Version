import axios from 'axios';

// API URLs - Using local Next.js API routes
const API_URL_SENSOR = '/api/sensor-data';
const API_URL_CV = '/api/cv-activity';

// Types for sensor data
export interface SensorData {
  id?: string;
  timestamp: string;
  suhu?: number;
  kelembaban?: number;
  kualitas_udara?: number;
  aktivitas?: number;
  ternak?: string;
  [key: string]: any;
}

// Types for CV activity data
export interface CVActivity {
  id?: string;
  timestamp: string;
  ternak?: string;
  aktivitas?: string;
  confidence?: number;
  lokasi?: string;
  jumlah?: number;
  [key: string]: any;
}

/**
 * Fetch sensor data from the API
 */
export const fetchSensorData = async (): Promise<SensorData[]> => {
  try {
    const response = await axios.get(API_URL_SENSOR);
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return [];
  }
};

/**
 * Fetch CV activity data from the API
 */
export const fetchCVActivity = async (animalType?: string): Promise<CVActivity[]> => {
  try {
    const response = await axios.get(API_URL_CV);
    const data = response.data;
    
    // Filter by animal type if provided
    if (animalType && data.length > 0) {
      return data.filter((item: CVActivity) => 
        item.ternak?.toLowerCase() === animalType.toLowerCase());
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching CV activity data:', error);
    return [];
  }
};

/**
 * Send a test sensor data to the API
 */
export const sendTestSensorData = async (ternak: string): Promise<boolean> => {
  try {
    // Generate appropriate values based on animal type
    let suhu, kelembaban;
    
    if (ternak === 'ayam') {
      suhu = +(Math.random() * 5 + 32).toFixed(1);  // 32-37°C for chickens
      kelembaban = +(Math.random() * 20 + 50).toFixed(1);  // 50-70% for chickens
    } else if (ternak === 'sapi') {
      suhu = +(Math.random() * 7 + 25).toFixed(1);  // 25-32°C for cows
      kelembaban = +(Math.random() * 20 + 60).toFixed(1);  // 60-80% for cows
    } else { // kambing
      suhu = +(Math.random() * 7 + 27).toFixed(1);  // 27-34°C for goats
      kelembaban = +(Math.random() * 25 + 40).toFixed(1);  // 40-65% for goats
    }
    
    const testData = {
      timestamp: new Date().toISOString(),
      suhu: suhu,
      kelembaban: kelembaban,
      kualitas_udara: +(Math.random() * 350 + 50).toFixed(2), // 50-400 ppm
      jarak_pakan: +(Math.random() * 18 + 2).toFixed(1), // 2-20 cm
      aktivitas: Math.floor(Math.random() * 10), // 0-10
      ternak: ternak
    };
    
    console.log('Sending test sensor data:', testData);
    const response = await axios.post(API_URL_SENSOR, testData);
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error('Error sending test sensor data:', error);
    return false;
  }
};

/**
 * Generate multiple test sensor data points
 */
export const generateBatchSensorData = async (ternak: string, count: number = 5): Promise<boolean> => {
  try {
    let success = true;
    
    for (let i = 0; i < count; i++) {
      // Add a small delay between requests to avoid overwhelming the server
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Generate data with timestamps spread over the last 24 hours
      const timestamp = new Date(Date.now() - (i * 3600000)); // i hours ago
      
      // Generate appropriate values based on animal type with some variation
      let suhu, kelembaban;
      
      if (ternak === 'ayam') {
        suhu = +(Math.random() * 5 + 32).toFixed(1);  // 32-37°C for chickens
        kelembaban = +(Math.random() * 20 + 50).toFixed(1);  // 50-70% for chickens
      } else if (ternak === 'sapi') {
        suhu = +(Math.random() * 7 + 25).toFixed(1);  // 25-32°C for cows
        kelembaban = +(Math.random() * 20 + 60).toFixed(1);  // 60-80% for cows
      } else { // kambing
        suhu = +(Math.random() * 7 + 27).toFixed(1);  // 27-34°C for goats
        kelembaban = +(Math.random() * 25 + 40).toFixed(1);  // 40-65% for goats
      }
      
      const testData = {
        timestamp: timestamp.toISOString(),
        suhu: suhu,
        kelembaban: kelembaban,
        kualitas_udara: +(Math.random() * 350 + 50).toFixed(2), // 50-400 ppm
        jarak_pakan: +(Math.random() * 18 + 2).toFixed(1), // 2-20 cm
        aktivitas: Math.floor(Math.random() * 10), // 0-10
        ternak: ternak
      };
      
      const response = await axios.post(API_URL_SENSOR, testData);
      if (response.status !== 200 && response.status !== 201) {
        success = false;
      }
    }
    
    return success;
  } catch (error) {
    console.error('Error generating batch sensor data:', error);
    return false;
  }
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return timestamp;
  }
};

/**
 * Generate AI analysis using Google Gemini API
 */
export const generateAIAnalysis = async (animalType: string, sensorData: SensorData, cvData: any): Promise<string> => {
  try {
    // Pastikan kita menggunakan nilai kelembaban yang benar
    const kelembapanValue = sensorData.kelembapan || sensorData.kelembaban;
    
    // Format data untuk prompt ke Gemini
    const prompt = `
    Analisis kondisi ternak ${animalType.charAt(0).toUpperCase() + animalType.slice(1)} berdasarkan data berikut:
    
    **Data Sensor:**
    - Suhu: ${sensorData.suhu?.toFixed(1)}°C
    - Kelembapan: ${kelembapanValue?.toFixed(1)}%
    - Kualitas Udara: ${sensorData.kualitas_udara?.toFixed(0)} ppm
    ${sensorData.jarak_pakan ? `- Jarak Pakan: ${sensorData.jarak_pakan?.toFixed(1)} cm` : ''}
    
    **Aktivitas Terdeteksi:**
    - ${cvData?.aktivitas || 'Tidak ada data aktivitas'}
    
    Berikan analisis dalam format Markdown yang terstruktur dengan bagian:
    
    ## Status Kesehatan
    *[sehat/waspada/kritis]* - Deskripsi singkat status kesehatan ternak.
    
    ## Indikator Utama
    *Jelaskan parameter yang paling perlu diperhatikan dengan format bullet points*
    
    ## Rekomendasi Tindakan
    *Minimal 3 poin tindakan konkret dengan format numbered list*
    1. Tindakan pertama
    2. Tindakan kedua
    3. Tindakan ketiga
    
    ## Antisipasi
    *Langkah-langkah antisipasi dengan format bullet points*
    
    Gunakan format Markdown dengan heading, list, dan emphasis. Pastikan responsmu terstruktur sesuai format di atas.
    `;

    // Periksa apakah API key telah dikonfigurasi
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn("Gemini API key not configured. Using local analysis fallback.");
      return generateLocalAnalysis(animalType, sensorData);
    }
    
    try {
      // Coba dengan model gemini-2.0-flash terlebih dahulu
      const FLASH_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      
      let response = await fetch(`${FLASH_API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      });

      // Jika model flash gagal dengan 503, coba model pro
      if (response.status === 503) {
        console.log("Model gemini-2.0-flash tidak tersedia (503), mencoba gemini-pro sebagai fallback");
        const PRO_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
        
        response = await fetch(`${PRO_API_URL}?key=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            }
          })
        });
      }

      // Periksa status HTTP
      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse response dari API
      const data = await response.json();
      
      // Handle error dari API
      if (data.error) {
        console.error("Gemini API error:", data.error);
        throw new Error(data.error.message || "Gagal mendapatkan analisis dari Gemini API");
      }
      
      // Ambil teks dari respons API
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!analysis) {
        // Fallback ke analisis lokal jika API gagal
        console.warn("No analysis text returned from Gemini API. Using local analysis fallback.");
        return generateLocalAnalysis(animalType, sensorData);
      }
      
      return analysis;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      // Fallback ke analisis lokal jika API gagal
      return generateLocalAnalysis(animalType, sensorData);
    }
  } catch (error) {
    console.error("Error in generateAIAnalysis:", error);
    // Fallback ke analisis lokal jika terjadi error lainnya
    return generateLocalAnalysis(animalType, sensorData);
  }
};

/**
 * Fallback function untuk generate analisis lokal jika API gagal
 */
const generateLocalAnalysis = (animalType: string, sensorData: SensorData): string => {
  // Pastikan kita menggunakan nilai kelembaban yang benar
  const kelembapanValue = sensorData.kelembapan || sensorData.kelembaban;
  
  // Check sensor data values to determine status
  let healthStatus = 'sehat';
  let statusDescription = 'Kondisi ternak dalam keadaan normal';
  
  if (sensorData.suhu && (sensorData.suhu > 39 || sensorData.suhu < 36)) {
    healthStatus = 'waspada';
    statusDescription = 'Suhu tubuh ternak berada di luar rentang normal';
  }
  
  if (kelembapanValue && (kelembapanValue > 85 || kelembapanValue < 50)) {
    healthStatus = 'waspada';
    statusDescription = 'Kelembaban kandang berada di luar rentang ideal';
  }
  
  if (sensorData.kualitas_udara && sensorData.kualitas_udara > 300) {
    healthStatus = 'kritis';
    statusDescription = 'Kualitas udara sangat buruk dan dapat membahayakan kesehatan ternak';
  }
  
  // Generate recommendations based on animal type and data
  let recommendations = '';
  let indicators = '';
  let anticipation = '';
  
  if (animalType === 'sapi') {
    indicators = `
* Suhu tubuh sapi normal berkisar antara 38-39°C, saat ini ${sensorData.suhu?.toFixed(1)}°C
* Kelembaban kandang ideal antara 60-80%, saat ini ${kelembapanValue?.toFixed(1)}%
* Kualitas udara harus di bawah 200 ppm, saat ini ${sensorData.kualitas_udara?.toFixed(0)} ppm
    `;
    
    recommendations = `
1. ${healthStatus === 'kritis' ? 'Segera pindahkan sapi ke area dengan ventilasi lebih baik' : 'Pastikan ventilasi kandang tetap baik'}
2. ${healthStatus !== 'sehat' ? 'Periksa kesehatan sapi secara menyeluruh' : 'Lakukan pemeriksaan kesehatan rutin'}
3. ${sensorData.kualitas_udara && sensorData.kualitas_udara > 200 ? 'Bersihkan kandang dari kotoran yang menumpuk' : 'Jaga kebersihan kandang secara berkala'}
4. ${kelembapanValue && kelembapanValue > 80 ? 'Kurangi kepadatan ternak dalam kandang' : 'Pertahankan jarak antar ternak yang memadai'}
    `;
    
    anticipation = `
* Siapkan protokol penanganan darurat untuk kondisi cuaca ekstrem
* Sediakan cadangan pakan dan air yang cukup
* Lakukan vaksinasi dan pemeriksaan kesehatan berkala
* Pasang sistem monitoring otomatis untuk parameter lingkungan kandang
    `;
  } else if (animalType === 'kambing') {
    indicators = `
* Suhu tubuh kambing normal berkisar antara 38.5-39.5°C, saat ini ${sensorData.suhu?.toFixed(1)}°C
* Kelembaban kandang ideal antara 60-70%, saat ini ${kelembapanValue?.toFixed(1)}%
* Kualitas udara harus di bawah 200 ppm, saat ini ${sensorData.kualitas_udara?.toFixed(0)} ppm
    `;
    
    recommendations = `
1. ${healthStatus === 'kritis' ? 'Segera pindahkan kambing ke area dengan ventilasi lebih baik' : 'Pastikan ventilasi kandang tetap baik'}
2. ${healthStatus !== 'sehat' ? 'Periksa kesehatan kambing secara menyeluruh' : 'Lakukan pemeriksaan kesehatan rutin'}
3. ${sensorData.kualitas_udara && sensorData.kualitas_udara > 200 ? 'Bersihkan kandang dari kotoran yang menumpuk' : 'Jaga kebersihan kandang secara berkala'}
4. ${kelembapanValue && kelembapanValue > 70 ? 'Kurangi kepadatan ternak dalam kandang' : 'Pertahankan jarak antar ternak yang memadai'}
    `;
    
    anticipation = `
* Siapkan protokol penanganan darurat untuk kondisi cuaca ekstrem
* Sediakan cadangan pakan dan air yang cukup
* Lakukan vaksinasi dan pemeriksaan kesehatan berkala
* Pasang sistem monitoring otomatis untuk parameter lingkungan kandang
    `;
  } else {
    indicators = `
* Suhu tubuh ayam normal berkisar antara 40-42°C, saat ini ${sensorData.suhu?.toFixed(1)}°C
* Kelembaban kandang ideal antara 50-70%, saat ini ${kelembapanValue?.toFixed(1)}%
* Kualitas udara harus di bawah 200 ppm, saat ini ${sensorData.kualitas_udara?.toFixed(0)} ppm
    `;
    
    recommendations = `
1. ${healthStatus === 'kritis' ? 'Segera pindahkan ayam ke area dengan ventilasi lebih baik' : 'Pastikan ventilasi kandang tetap baik'}
2. ${healthStatus !== 'sehat' ? 'Periksa kesehatan ayam secara menyeluruh' : 'Lakukan pemeriksaan kesehatan rutin'}
3. ${sensorData.kualitas_udara && sensorData.kualitas_udara > 200 ? 'Bersihkan kandang dari kotoran yang menumpuk' : 'Jaga kebersihan kandang secara berkala'}
4. ${kelembapanValue && kelembapanValue > 70 ? 'Kurangi kepadatan ternak dalam kandang' : 'Pertahankan jarak antar ternak yang memadai'}
    `;
    
    anticipation = `
* Siapkan protokol penanganan darurat untuk kondisi cuaca ekstrem
* Sediakan cadangan pakan dan air yang cukup
* Lakukan vaksinasi dan pemeriksaan kesehatan berkala
* Pasang sistem monitoring otomatis untuk parameter lingkungan kandang
    `;
  }
  
  // Assemble the complete analysis
  return `## Status Kesehatan
*${healthStatus}* - ${statusDescription}.

## Indikator Utama
${indicators.trim()}

## Rekomendasi Tindakan
${recommendations.trim()}

## Antisipasi
${anticipation.trim()}`;
};
