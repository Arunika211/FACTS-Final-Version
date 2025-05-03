import axios from 'axios';

// Default configuration for API endpoints
const API_CONFIG = {
  host: 'localhost',
  port: '5000',
};

// Axios instance dengan konfigurasi timeout yang lebih lama
const axiosInstance = axios.create({
  timeout: 30000, // 30 detik (ditingkatkan dari 10 detik)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// API URL for CV activity
const API_URL_CV = `http://${API_CONFIG.host}:${API_CONFIG.port}/cv-activity`;
// API URL for YOLO detection
const API_URL_DETECTION = `http://${API_CONFIG.host}:${API_CONFIG.port}/detect`;

// Types for detection results
export interface DetectionResult {
  timestamp: string;
  ternak: string;
  aktivitas?: string;
  confidence: number;
  lokasi?: string;
  jumlah?: number;
  bbox?: [number, number, number, number]; // [x, y, width, height]
  class?: string; // Untuk menyimpan jenis/penyakit pada kasus ayam
}

/**
 * Try to connect to the server
 */
export const checkServerConnection = async (): Promise<boolean> => {
  try {
    // Meningkatkan timeout menjadi 5 detik
    await axiosInstance.get(`http://${API_CONFIG.host}:${API_CONFIG.port}/`, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('Error connecting to server:', error);
    return false;
  }
};

/**
 * Send detection result to the API
 */
export const sendDetectionResult = async (detection: Omit<DetectionResult, 'timestamp'>): Promise<boolean> => {
  try {
    // Check server connection first
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      console.log('Server not available, skipping API call');
      return false;
    }
    
    const data = {
      ...detection,
      timestamp: new Date().toISOString()
    };
    
    const response = await axiosInstance.post(API_URL_CV, data);
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error('Error sending detection result:', error);
    return false;
  }
};

/**
 * Run YOLO detection on image data
 * @param imageData Base64 encoded image data
 * @param modelType Type of animal (sapi, ayam, kambing)
 */
export const runYOLODetection = async (
  imageData: string, 
  modelType: 'sapi' | 'ayam' | 'kambing'
): Promise<DetectionResult[]> => {
  try {
    // Check server connection first
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      console.log('Server not available, using fallback detection');
      return getFallbackDetection(modelType);
    }
    
    console.log(`Sending detection request for ${modelType} model...`);
    
    // Compress image if it's too large
    const compressedImage = await compressImage(imageData);
    
    const response = await axiosInstance.post(API_URL_DETECTION, {
      image: compressedImage,
      model: modelType
    });
    
    if (response.status === 200) {
      console.log(`Detection successful, found ${response.data.detections.length} objects`);
      return response.data.detections.map((detection: any) => ({
        timestamp: new Date().toISOString(),
        ternak: modelType,
        confidence: detection.confidence,
        bbox: detection.bbox,
        class: detection.class, // Class dari model (terutama untuk ayam yang bisa mendeteksi penyakit)
        lokasi: 'kandang'
      }));
    }
    
    return getFallbackDetection(modelType);
  } catch (error) {
    console.error('Error running YOLO detection:', error);
    // Fallback untuk tujuan testing
    return getFallbackDetection(modelType);
  }
};

/**
 * Get fallback detection when server is not available
 */
const getFallbackDetection = (modelType: string): DetectionResult[] => {
  return [{
    timestamp: new Date().toISOString(),
    ternak: modelType,
    confidence: 0.85,
    aktivitas: 'fallback detection',
    lokasi: 'kandang',
    bbox: [0.2, 0.2, 0.3, 0.3]
  }];
};

/**
 * Compress image for faster transmission
 */
const compressImage = async (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Set target size - max 640px on longer dimension
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 640;
      
      if (width > height && width > MAX_SIZE) {
        height = Math.round(height * (MAX_SIZE / width));
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = Math.round(width * (MAX_SIZE / height));
        height = MAX_SIZE;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Image);
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      resolve(compressed);
    };
    
    img.onerror = () => {
      console.error('Failed to load image for compression');
      resolve(base64Image);
    };
    
    img.src = `data:image/jpeg;base64,${base64Image}`;
  });
};

/**
 * Check if YOLO detection is available
 */
export const checkYOLOStatus = async (): Promise<{
  available: boolean;
  models: {[key: string]: boolean};
}> => {
  try {
    // First check if server is running
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      console.log('Server not available, returning offline status');
      return {
        available: false,
        models: {
          sapi: false,
          ayam: false,
          kambing: false
        }
      };
    }
    
    const response = await axiosInstance.get(`http://${API_CONFIG.host}:${API_CONFIG.port}/status`);
    
    if (response.status === 200 && response.data.yolo_models) {
      const modelStatus = response.data.yolo_models;
      
      return {
        available: true,
        models: {
          sapi: modelStatus.sapi?.available || false,
          ayam: modelStatus.ayam?.available || false,
          kambing: modelStatus.kambing?.available || false
        }
      };
    }
    
    return {
      available: false,
      models: {
        sapi: false,
        ayam: false,
        kambing: false
      }
    };
  } catch (error) {
    console.error('Error checking YOLO status:', error);
    return {
      available: false,
      models: {
        sapi: false,
        ayam: false,
        kambing: false
      }
    };
  }
};

/**
 * Capture frame from video element and convert to base64
 */
export const captureVideoFrame = (video: HTMLVideoElement): string => {
  const canvas = document.createElement('canvas');
  
  // Limit size to 640x480 for better performance
  const MAX_WIDTH = 640;
  const MAX_HEIGHT = 480;
  
  let width = video.videoWidth;
  let height = video.videoHeight;
  
  // Resize to max dimensions while maintaining aspect ratio
  if (width > height && width > MAX_WIDTH) {
    height = Math.round(height * (MAX_WIDTH / width));
    width = MAX_WIDTH;
  } else if (height > MAX_HEIGHT) {
    width = Math.round(width * (MAX_HEIGHT / height));
    height = MAX_HEIGHT;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  ctx.drawImage(video, 0, 0, width, height);
  // Reduce quality to 0.7 for better performance
  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
};

/**
 * Simulate detection for a given animal type
 * This is used when we don't have direct access to the Python models
 */
export const simulateDetection = (
  animalType: string,
  onResult: (result: DetectionResult) => void,
  interval = 2000
): (() => void) => {
  // Activities for different animals
  const activities = {
    sapi: ['makan', 'tidur', 'berdiri', 'berjalan'],
    ayam: ['makan', 'tidur', 'terbang', 'bertelur'],
    kambing: ['makan', 'tidur', 'melompat', 'merumput']
  };
  
  // Start detection simulation
  const timer = setInterval(() => {
    // Generate random values for simulation
    const confidence = Math.random() * 0.5 + 0.5; // Random confidence between 0.5-1.0
    const animalActivities = activities[animalType as keyof typeof activities] || activities.sapi;
    const activity = animalActivities[Math.floor(Math.random() * animalActivities.length)];
    
    // Create detection result
    const result: DetectionResult = {
      timestamp: new Date().toISOString(),
      ternak: animalType,
      aktivitas: activity,
      confidence: confidence,
      lokasi: 'kandang',
      jumlah: Math.floor(Math.random() * 3) + 1,
      bbox: [
        Math.random() * 0.5, // x (normalized)
        Math.random() * 0.5, // y (normalized)
        Math.random() * 0.3 + 0.2, // width (normalized)
        Math.random() * 0.3 + 0.2  // height (normalized)
      ]
    };
    
    // Call the callback with the result
    onResult(result);
    
    // Send the result to the API
    sendDetectionResult({
      ternak: result.ternak,
      aktivitas: result.aktivitas,
      confidence: result.confidence,
      lokasi: result.lokasi,
      jumlah: result.jumlah
    }).catch(err => console.error('Failed to send detection to API:', err));
    
  }, interval);
  
  // Return a cleanup function
  return () => clearInterval(timer);
};

/**
 * Process uploaded video file and run detection on frames
 * @param videoFile The uploaded video file
 * @param modelType Type of animal (sapi, ayam, kambing) 
 * @param frameRate How many frames per second to analyze (default: 1)
 * @param onProgress Callback for progress updates
 * @param onResult Callback for detection results
 */
export const processVideoFile = async (
  videoFile: File,
  modelType: 'sapi' | 'ayam' | 'kambing',
  frameRate: number = 1,
  onProgress: (progress: number) => void,
  onResult: (result: DetectionResult, frameData: string) => void
): Promise<void> => {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  // Create object URL for video
  const videoUrl = URL.createObjectURL(videoFile);
  
  // Load video metadata
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Error loading video'));
    video.src = videoUrl;
  });
  
  // Set canvas dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Calculate frame extraction interval based on frameRate
  const frameInterval = 1 / frameRate;
  const videoDuration = video.duration;
  const totalFrames = Math.floor(videoDuration * frameRate);
  let processedFrames = 0;
  
  // Process video frame by frame
  for (let currentTime = 0; currentTime < videoDuration; currentTime += frameInterval) {
    // Update progress
    const currentProgress = Math.min(Math.floor((currentTime / videoDuration) * 100), 100);
    onProgress(currentProgress);
    
    // Set video time
    video.currentTime = currentTime;
    
    // Wait for video to seek to time
    await new Promise<void>(resolve => {
      const seeked = () => {
        video.removeEventListener('seeked', seeked);
        resolve();
      };
      video.addEventListener('seeked', seeked);
    });
    
    // Draw frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get frame data as base64
    const frameData = canvas.toDataURL('image/jpeg').split(',')[1];
    
    try {
      // Run detection on frame
      const results = await runYOLODetection(frameData, modelType);
      
      // Call result callback with detection and frame data
      if (results.length > 0) {
        for (const result of results) {
          onResult(result, frameData);
        }
      }
    } catch (error) {
      console.error('Error detecting objects in video frame:', error);
    }
    
    processedFrames++;
  }
  
  // Final progress update
  onProgress(100);
  
  // Clean up
  URL.revokeObjectURL(videoUrl);
};

/**
 * Process video with live bounding box rendering
 * @param videoElement Video element to process
 * @param canvasElement Canvas element to draw on
 * @param modelType Type of animal (sapi, ayam, kambing)
 * @param isProcessing State to track processing status
 * @param setIsProcessing Function to update processing status
 * @param onDetection Callback for detection results
 */
export const processVideoWithBoundingBox = (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  modelType: 'sapi' | 'ayam' | 'kambing',
  isProcessing: boolean,
  setIsProcessing: (value: boolean) => void,
  onDetection: (detection: DetectionResult) => void
): () => void => {
  // Processing flag to prevent multiple simultaneous frames
  let processing = false;
  
  // Function to draw bounding box on frame
  const drawBoundingBox = (detection: DetectionResult, ctx: CanvasRenderingContext2D) => {
    if (!detection.bbox) return;
    
    const [x, y, width, height] = detection.bbox;
    const canvasWidth = canvasElement.width;
    const canvasHeight = canvasElement.height;
    
    const boxX = x * canvasWidth;
    const boxY = y * canvasHeight;
    const boxWidth = width * canvasWidth;
    const boxHeight = height * canvasHeight;
    
    // Draw semi-transparent background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(boxX, boxY > 30 ? boxY - 30 : boxY + boxHeight, boxWidth, 30);
    
    // Draw bounding box
    ctx.strokeStyle = '#3b82f6'; // blue color
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    
    // Show class info if available
    const labelText = detection.class 
      ? `${detection.ternak} (${detection.class}) ${(detection.confidence * 100).toFixed(0)}%`
      : `${detection.ternak} ${(detection.confidence * 100).toFixed(0)}%`;
      
    ctx.fillText(
      labelText,
      boxX + 5,
      boxY > 20 ? boxY - 10 : boxY + boxHeight + 20
    );
  };
  
  // Function to process video frames
  const processFrame = async () => {
    if (!videoElement || !canvasElement || processing || !isProcessing) return;
    
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;
    
    processing = true;
    
    try {
      // Make sure canvas dimensions match the video
      if (canvasElement.width !== videoElement.videoWidth || 
          canvasElement.height !== videoElement.videoHeight) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
      }
      
      // Draw current video frame on canvas
      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      
      // Capture frame data
      const frameData = canvasElement.toDataURL('image/jpeg', 0.7).split(',')[1];
      
      // Run detection
      const detections = await runYOLODetection(frameData, modelType);
      
      // Draw video frame again (to clear previous bounding boxes)
      ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      
      // Draw bounding boxes for each detection
      detections.forEach(detection => {
        drawBoundingBox(detection, ctx);
        onDetection(detection);
      });
    } catch (error) {
      console.error('Error processing video frame:', error);
    } finally {
      processing = false;
    }
  };
  
  // Set up interval for processing frames
  const intervalId = setInterval(processFrame, 1000); // Process 1 frame per second
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    setIsProcessing(false);
  };
};
