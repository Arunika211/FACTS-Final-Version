"use client";

import React, { useState, useRef, useEffect } from 'react';
import { DetectionResult, simulateDetection, sendDetectionResult, runYOLODetection, captureVideoFrame, checkYOLOStatus, checkServerConnection, processVideoFile, processVideoWithBoundingBox } from '@/services/detection';

// Types
interface DetectionTabProps {
  selectedAnimal: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    cardBg: string;
    bgColor: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    metricBg: string;
    borderColor: string;
  };
  darkMode: boolean;
}

// Add interface for tab modes
type TabMode = 'camera' | 'upload';

const DetectionTab: React.FC<DetectionTabProps> = ({
  selectedAnimal,
  theme,
  darkMode
}) => {
  // State
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cleanupFunction, setCleanupFunction] = useState<(() => void) | null>(null);
  const [mode, setMode] = useState<'realtime' | 'simulation'>('simulation');
  const [yoloStatus, setYoloStatus] = useState<{
    available: boolean;
    models: {[key: string]: boolean};
  }>({
    available: false,
    models: {
      sapi: false,
      ayam: false,
      kambing: false
    }
  });
  const [isYoloReady, setIsYoloReady] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabMode>('camera');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoProcessingProgress, setVideoProcessingProgress] = useState<number>(0);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [videoResults, setVideoResults] = useState<{frameData: string, detection: DetectionResult}[]>([]);
  const [selectedVideoFrame, setSelectedVideoFrame] = useState<number | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animal icons
  const animalIcons = {
    sapi: '🐄',
    ayam: '🐔',
    kambing: '🐐'
  } as const;
  
  type AnimalIconType = keyof typeof animalIcons;

  // Tambahkan state untuk video live detection
  const [isProcessingLiveVideo, setIsProcessingLiveVideo] = useState<boolean>(false);
  const [liveVideoCleanup, setLiveVideoCleanup] = useState<(() => void) | null>(null);

  // Check server connection
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkServerConnection();
      setIsServerConnected(connected);
      
      if (!connected && mode === 'realtime') {
        setMode('simulation');
        setErrorMessage('Server tidak tersedia. Menggunakan mode simulasi.');
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Check YOLO status
  useEffect(() => {
    const checkStatus = async () => {
      if (!isServerConnected) {
        setYoloStatus({
          available: false,
          models: {
            sapi: false,
            ayam: false,
            kambing: false
          }
        });
        setIsYoloReady(false);
        
        if (mode === 'realtime') {
          setMode('simulation');
          setErrorMessage('Server tidak tersedia. Menggunakan mode simulasi.');
        }
        return;
      }
      
      try {
        const status = await checkYOLOStatus();
        setYoloStatus(status);
        setIsYoloReady(status.available && status.models[selectedAnimal as keyof typeof status.models]);
        
        // Update mode based on YOLO availability
        if (status.available && status.models[selectedAnimal as keyof typeof status.models]) {
          if (mode === 'realtime') {
            setErrorMessage(null);
          }
        } else if (mode === 'realtime') {
          setMode('simulation');
          setErrorMessage(`Model YOLO untuk ${selectedAnimal} tidak tersedia. Menggunakan mode simulasi.`);
        }
      } catch (error) {
        console.error('Error checking YOLO status:', error);
        setIsYoloReady(false);
        if (mode === 'realtime') {
          setMode('simulation');
          setErrorMessage('Server YOLO tidak tersedia. Menggunakan mode simulasi.');
        }
      }
    };
    
    if (isServerConnected) {
      checkStatus();
    }
    
    const interval = setInterval(() => {
      if (isServerConnected) {
        checkStatus();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedAnimal, isServerConnected]);

  // Start camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setErrorMessage(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setErrorMessage('Failed to access camera. Please check permissions and try again.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsDetecting(false);
    
    // Clean up any detection simulation
    if (cleanupFunction) {
      cleanupFunction();
      setCleanupFunction(null);
    }
  };

  // Run YOLO detection on current video frame
  const runDetection = async () => {
    if (!videoRef.current || !stream || isProcessing) return;
    
    // Force simulation mode if server is not connected
    if (!isServerConnected && mode === 'realtime') {
      setMode('simulation');
      setErrorMessage('Server tidak tersedia. Menggunakan mode simulasi.');
      
      // Start simulation
      if (cleanupFunction) {
        cleanupFunction();
      }
      
      const cleanup = simulateDetection(selectedAnimal, (result) => {
        setDetections(prev => [result, ...prev].slice(0, 10));
        drawDetection(result);
      });
      
      setCleanupFunction(() => cleanup);
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Capture frame from video
      const imageData = captureVideoFrame(videoRef.current);
      
      // Run YOLO detection
      const results = await runYOLODetection(
        imageData, 
        selectedAnimal as 'sapi' | 'ayam' | 'kambing'
      );
      
      // Reset consecutive errors on success
      setConsecutiveErrors(0);
      
      if (results.length > 0) {
        // Update detections state
        setDetections(prev => [...results, ...prev].slice(0, 10));
        
        // Draw detections on canvas
        results.forEach(result => {
          drawDetection(result);
          
          // Send result to API
          sendDetectionResult({
            ternak: result.ternak,
            confidence: result.confidence,
            class: result.class,
            lokasi: 'kandang'
          });
        });
      }
      
      setErrorMessage(null);
    } catch (error) {
      console.error('Error running detection:', error);
      
      // Count consecutive errors
      setConsecutiveErrors(prev => prev + 1);
      
      // If we've had too many errors, switch to simulation mode
      if (consecutiveErrors >= 3) {
        setErrorMessage('Terlalu banyak error dengan deteksi YOLO. Beralih ke mode simulasi.');
        setMode('simulation');
        
        // Stop current detection
        if (cleanupFunction) {
          cleanupFunction();
        }
        
        // Start simulation instead
        const cleanup = simulateDetection(selectedAnimal, (result) => {
          setDetections(prev => [result, ...prev].slice(0, 10));
          drawDetection(result);
        });
        
        setCleanupFunction(() => cleanup);
      } else {
        setErrorMessage('Error saat menjalankan deteksi. Mencoba lagi...');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle detection
  const toggleDetection = async () => {
    if (!isDetecting) {
      if (!stream) {
        await startCamera();
      }
      setIsDetecting(true);
      
      // Reset error count when starting detection
      setConsecutiveErrors(0);
      
      // Force simulation mode if server is not connected
      if (!isServerConnected && mode === 'realtime') {
        setMode('simulation');
        setErrorMessage('Server tidak tersedia. Menggunakan mode simulasi.');
      }
      
      if (mode === 'simulation' || !isServerConnected) {
        // Start detection simulation
        const cleanup = simulateDetection(selectedAnimal, (result) => {
          // Add new detection to state
          setDetections(prev => [result, ...prev].slice(0, 10)); // Keep last 10 detections
          
          // Draw bounding box on canvas
          drawDetection(result);
        });
        
        setCleanupFunction(() => cleanup);
      } else {
        if (!isYoloReady) {
          setErrorMessage(`Model YOLO untuk ${selectedAnimal} tidak tersedia. Menggunakan mode simulasi.`);
          setMode('simulation');
          
          // Fall back to simulation
          const cleanup = simulateDetection(selectedAnimal, (result) => {
            setDetections(prev => [result, ...prev].slice(0, 10));
            drawDetection(result);
          });
          
          setCleanupFunction(() => cleanup);
        } else {
          // Start real-time YOLO detection
          const intervalId = setInterval(runDetection, 2000); // Run detection every 2 seconds for better performance
          setCleanupFunction(() => () => clearInterval(intervalId));
        }
      }
    } else {
      setIsDetecting(false);
      
      // Clean up detection
      if (cleanupFunction) {
        cleanupFunction();
        setCleanupFunction(null);
      }
    }
  };

  // Draw detection on canvas
  const drawDetection = (detection: DetectionResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !detection.bbox) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame on canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Draw bounding box
    const [x, y, width, height] = detection.bbox;
    const boxX = x * canvas.width;
    const boxY = y * canvas.height;
    const boxWidth = width * canvas.width;
    const boxHeight = height * canvas.height;
    
    ctx.strokeStyle = theme.primaryColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Draw label
    ctx.fillStyle = theme.primaryColor;
    ctx.font = '16px Arial';
    
    // Show class info if available (especially for ayam)
    const labelText = detection.class 
      ? `${detection.ternak} (${detection.class}) ${(detection.confidence * 100).toFixed(0)}%`
      : `${detection.ternak} ${(detection.confidence * 100).toFixed(0)}%`;
      
    ctx.fillText(
      labelText,
      boxX,
      boxY > 20 ? boxY - 5 : boxY + boxHeight + 20
    );
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  // Reset detections when animal type changes
  useEffect(() => {
    setDetections([]);
    
    // Reset error count when changing animals
    setConsecutiveErrors(0);
    
    // Check if YOLO model is available for the selected animal
    setIsYoloReady(yoloStatus.models[selectedAnimal as keyof typeof yoloStatus.models]);
    
    if (isDetecting) {
      // Stop current detection
      if (cleanupFunction) {
        cleanupFunction();
      }
      
      // Force simulation mode if server is not connected
      if (!isServerConnected && mode === 'realtime') {
        setMode('simulation');
        setErrorMessage('Server tidak tersedia. Menggunakan mode simulasi.');
      }
      
      if (mode === 'simulation' || !isServerConnected) {
        // Start new simulation detection for the selected animal
        const cleanup = simulateDetection(selectedAnimal, (result) => {
          setDetections(prev => [result, ...prev].slice(0, 10));
          drawDetection(result);
        });
        
        setCleanupFunction(() => cleanup);
      } else {
        if (yoloStatus.models[selectedAnimal as keyof typeof yoloStatus.models]) {
          // Start real-time YOLO detection
          const intervalId = setInterval(runDetection, 2000);
          setCleanupFunction(() => () => clearInterval(intervalId));
        } else {
          // Fall back to simulation
          setMode('simulation');
          setErrorMessage(`Model YOLO untuk ${selectedAnimal} tidak tersedia. Menggunakan mode simulasi.`);
          
          const cleanup = simulateDetection(selectedAnimal, (result) => {
            setDetections(prev => [result, ...prev].slice(0, 10));
            drawDetection(result);
          });
          
          setCleanupFunction(() => cleanup);
        }
      }
    }
  }, [selectedAnimal]);

  // Toggle between simulation and realtime modes
  const toggleMode = () => {
    // If server is not connected, warn and stay in simulation mode
    if (!isServerConnected && mode === 'simulation') {
      setErrorMessage('Server tidak tersedia. Tidak dapat beralih ke mode YOLO Detection.');
      return;
    }
    
    if (mode === 'simulation') {
      // Switching to realtime
      if (!yoloStatus.available || !yoloStatus.models[selectedAnimal as keyof typeof yoloStatus.models]) {
        setErrorMessage(`Model YOLO untuk ${selectedAnimal} tidak tersedia. Tetap menggunakan mode simulasi.`);
        return;
      }
      setMode('realtime');
      setErrorMessage(null);
    } else {
      // Switching to simulation
      setMode('simulation');
      setErrorMessage(null);
    }
    
    if (isDetecting) {
      // Stop current detection
      if (cleanupFunction) {
        cleanupFunction();
        setCleanupFunction(null);
      }
      
      // Reset error count when changing modes
      setConsecutiveErrors(0);
      
      // Restart detection with new mode
      if (mode === 'realtime') { // Current mode, will change to simulation
        const cleanup = simulateDetection(selectedAnimal, (result) => {
          setDetections(prev => [result, ...prev].slice(0, 10));
          drawDetection(result);
        });
        
        setCleanupFunction(() => cleanup);
      } else { // Current mode is simulation, will change to realtime
        const intervalId = setInterval(runDetection, 2000);
        setCleanupFunction(() => () => clearInterval(intervalId));
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file is a video
      if (!file.type.startsWith('video/')) {
        setErrorMessage('Please select a valid video file.');
        return;
      }
      
      // Reset previous results
      setVideoResults([]);
      setSelectedVideoFrame(null);
      setVideoProcessingProgress(0);
      
      // Set uploaded video
      setUploadedVideo(file);
      
      // Create and set video URL
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // Clear error message
      setErrorMessage(null);
    }
  };

  // Process video for object detection
  const processVideo = async () => {
    if (!uploadedVideo || !isServerConnected) {
      if (!isServerConnected) {
        setErrorMessage('Server tidak tersedia. Tidak dapat memproses video.');
      } else {
        setErrorMessage('Mohon unggah video terlebih dahulu.');
      }
      return;
    }
    
    setIsProcessingVideo(true);
    setVideoResults([]);
    
    try {
      const results: {frameData: string, detection: DetectionResult}[] = [];
      
      // Process video file
      await processVideoFile(
        uploadedVideo,
        selectedAnimal as 'sapi' | 'ayam' | 'kambing',
        0.5, // 1 frame every 2 seconds
        (progress) => {
          setVideoProcessingProgress(progress);
          
          // Update state periodically to show progress
          if (results.length % 5 === 0 || progress === 100) {
            setVideoResults([...results]);
          }
        },
        (detection, frameData) => {
          const resultItem = { frameData, detection };
          results.push(resultItem);
          
          // Add to detections for history
          setDetections(prev => [detection, ...prev].slice(0, 10));
        }
      );
      
      // Final update
      setVideoResults([...results]);
      
      // Auto-select first frame if available
      if (results.length > 0) {
        setSelectedVideoFrame(0);
      }
      
      setErrorMessage(null);
    } catch (error) {
      console.error('Error processing video:', error);
      setErrorMessage('Terjadi kesalahan saat memproses video.');
    } finally {
      setIsProcessingVideo(false);
      setVideoProcessingProgress(100);
    }
  };

  // Start live processing of the uploaded video
  const toggleLiveVideoProcessing = () => {
    if (isProcessingLiveVideo) {
      // Stop processing
      if (liveVideoCleanup) {
        liveVideoCleanup();
        setLiveVideoCleanup(null);
      }
      setIsProcessingLiveVideo(false);
      return;
    }
    
    if (!uploadedVideoRef.current || !videoCanvasRef.current || !isServerConnected) {
      setErrorMessage(isServerConnected 
        ? 'Video belum dimuat dengan benar.' 
        : 'Server tidak tersedia. Tidak dapat melakukan deteksi live.'
      );
      return;
    }
    
    setIsProcessingLiveVideo(true);
    
    // Start live processing
    const cleanup = processVideoWithBoundingBox(
      uploadedVideoRef.current,
      videoCanvasRef.current,
      selectedAnimal as 'sapi' | 'ayam' | 'kambing',
      true,
      setIsProcessingLiveVideo,
      (detection) => {
        // Add to detections history
        setDetections(prev => [detection, ...prev].slice(0, 10));
      }
    );
    
    setLiveVideoCleanup(() => cleanup);
    
    // Play the video
    if (uploadedVideoRef.current && uploadedVideoRef.current.paused) {
      uploadedVideoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        setErrorMessage('Tidak dapat memutar video. Silakan coba lagi.');
      });
    }
  };

  // Stop live processing when tab changes
  useEffect(() => {
    if (activeTab !== 'upload' && liveVideoCleanup) {
      liveVideoCleanup();
      setLiveVideoCleanup(null);
      setIsProcessingLiveVideo(false);
    }
  }, [activeTab]);

  // Draw detection on uploaded video frame
  const drawVideoFrameDetection = (frameIndex: number) => {
    if (!videoCanvasRef.current || !videoResults[frameIndex]) return;
    
    const { frameData, detection } = videoResults[frameIndex];
    
    const img = new Image();
    img.onload = () => {
      const canvas = videoCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw bounding box if available
      if (detection.bbox) {
        const [x, y, width, height] = detection.bbox;
        const boxX = x * canvas.width;
        const boxY = y * canvas.height;
        const boxWidth = width * canvas.width;
        const boxHeight = height * canvas.height;
        
        ctx.strokeStyle = theme.primaryColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Draw label
        ctx.fillStyle = theme.primaryColor;
        ctx.font = '16px Arial';
        
        // Show class info if available
        const labelText = detection.class 
          ? `${detection.ternak} (${detection.class}) ${(detection.confidence * 100).toFixed(0)}%`
          : `${detection.ternak} ${(detection.confidence * 100).toFixed(0)}%`;
          
        ctx.fillText(
          labelText,
          boxX,
          boxY > 20 ? boxY - 5 : boxY + boxHeight + 20
        );
      }
    };
    
    img.src = `data:image/jpeg;base64,${frameData}`;
  };

  // Effect to draw detection when frame is selected
  useEffect(() => {
    if (selectedVideoFrame !== null && videoResults[selectedVideoFrame]) {
      drawVideoFrameDetection(selectedVideoFrame);
    }
  }, [selectedVideoFrame, videoResults]);

  // Clean up video URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-4xl">
            {selectedAnimal === 'sapi' ? '🐄' : selectedAnimal === 'kambing' ? '🐐' : '🐔'}
          </span>
          <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
            {selectedAnimal.charAt(0).toUpperCase() + selectedAnimal.slice(1)} Detection
          </span>
        </h2>
        <div className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          <span className={`h-2 w-2 rounded-full ${isServerConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>YOLO + BoT-SORT {isServerConnected ? '' : '(Offline)'}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mb-4">
          {errorMessage}
        </div>
      )}

      {/* Tab Selection */}
      <div className="mb-4">
        <div className="flex border-b" style={{ borderColor: theme.borderColor }}>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'camera' 
              ? 'border-b-2 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            style={{ borderColor: activeTab === 'camera' ? theme.primaryColor : 'transparent' }}
            onClick={() => setActiveTab('camera')}
          >
            Kamera Langsung
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'upload' 
              ? 'border-b-2 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            style={{ borderColor: activeTab === 'upload' ? theme.primaryColor : 'transparent' }}
            onClick={() => setActiveTab('upload')}
          >
            Unggah Video
          </button>
        </div>
      </div>

      {activeTab === 'camera' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 relative" style={{ borderColor: theme.borderColor }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Camera Feed</h3>
              <div className="flex items-center">
                <span className="text-sm mr-2">Mode:</span>
                <button 
                  onClick={toggleMode}
                  className={`px-3 py-1 text-xs rounded-full ${mode === 'simulation' 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                  disabled={
                    (mode === 'realtime' && (!yoloStatus.available || !yoloStatus.models[selectedAnimal as keyof typeof yoloStatus.models])) ||
                    (!isServerConnected && mode === 'simulation')
                  }
                >
                  {mode === 'simulation' ? 'Simulation' : 'YOLO Detection'}
                </button>
              </div>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video 
                ref={videoRef}
                className="max-w-full max-h-full"
                muted
                playsInline
                style={{ display: stream ? 'block' : 'none' }}
              />
              <canvas 
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ display: stream ? 'block' : 'none' }}
              />
              {!stream && (
                <div className="text-center p-4">
                  <p className="mb-2">Camera feed not available</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Start Camera
                  </button>
                </div>
              )}
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="w-12 h-12 border-4 border-white rounded-full border-t-transparent animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Tombol untuk mematikan kamera */}
            {stream && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm flex items-center gap-1"
                >
                  <span>📴</span> Matikan Kamera
                </button>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4" style={{ borderColor: theme.borderColor }}>
            <h3 className="text-lg font-medium mb-4">Detection Status</h3>
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: darkMode ? '#283747' : '#f8f9fa' }}>
              <p className="font-medium">
                Status: <span style={{ color: isDetecting ? theme.successColor : theme.errorColor }}>
                  {isDetecting ? 'ACTIVE' : 'NOT ACTIVE'}
                </span>
              </p>
              <p>{isDetecting 
                ? `Mendeteksi ${selectedAnimal} menggunakan ${mode === 'simulation' ? 'simulasi' : 'YOLO model'}...` 
                : 'Press Start Detection button to begin'}</p>
              
              {/* Model Availability Status */}
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium">Status:</p>
                <div className="flex items-center mt-1">
                  <span 
                    className="inline-block h-2 w-2 rounded-full mr-2" 
                    style={{ backgroundColor: isServerConnected ? theme.successColor : theme.errorColor }}
                  ></span>
                  <span className="text-sm">Server: {isServerConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                
                <div className="flex items-center mt-1">
                  <span 
                    className="inline-block h-2 w-2 rounded-full mr-2" 
                    style={{ backgroundColor: yoloStatus.models[selectedAnimal as keyof typeof yoloStatus.models] ? theme.successColor : theme.errorColor }}
                  ></span>
                  <span className="text-sm">YOLO model: {yoloStatus.models[selectedAnimal as keyof typeof yoloStatus.models] ? 'Ready' : 'Not available'}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={toggleDetection}
              className="w-full py-2 px-4 rounded-md text-white mb-4 transition-colors"
              style={{ 
                backgroundColor: isDetecting ? theme.errorColor : theme.successColor,
                borderColor: isDetecting ? theme.errorColor : theme.successColor
              }}
              disabled={isProcessing}
            >
              {isDetecting ? 'Stop Detection' : 'Start Detection'}
            </button>

            <h3 className="text-lg font-medium mb-2">Recent Detections</h3>
            <div className="overflow-y-auto max-h-48 border rounded" style={{ borderColor: theme.borderColor }}>
              {detections.length > 0 ? (
                <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left text-sm">Time</th>
                      <th className="px-2 py-1 text-left text-sm">Object</th>
                      <th className="px-2 py-1 text-left text-sm">Detail</th>
                      <th className="px-2 py-1 text-left text-sm">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: theme.borderColor }}>
                    {detections.map((detection, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-opacity-5' : ''} style={{ backgroundColor: index % 2 === 0 ? theme.bgColor : 'transparent' }}>
                        <td className="px-2 py-1 text-sm">
                          {new Date(detection.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-2 py-1 text-sm capitalize">
                          {detection.ternak}
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {detection.class || detection.aktivitas || '-'}
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {(detection.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-3 text-center text-sm opacity-70">No detections yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 relative" style={{ borderColor: theme.borderColor }}>
            <h3 className="text-lg font-medium mb-4">Upload Video</h3>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                Select Video File
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700"
                disabled={isProcessingVideo || isProcessingLiveVideo}
              />
            </div>
            
            {videoUrl && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Preview:</h4>
                <div className="relative aspect-video bg-black">
                  {isProcessingLiveVideo ? (
                    <>
                      <video
                        ref={uploadedVideoRef}
                        src={videoUrl}
                        className="w-full h-full opacity-0 absolute"
                        controls={false}
                        autoPlay
                        muted
                        loop
                      />
                      <canvas
                        ref={videoCanvasRef}
                        className="w-full h-full"
                      />
                    </>
                  ) : (
                    <>
                      <video
                        ref={uploadedVideoRef}
                        src={videoUrl}
                        className="w-full h-full"
                        controls
                      />
                      <canvas
                        ref={videoCanvasRef}
                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        style={{ display: 'none' }}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center flex-wrap gap-2">
              <button
                onClick={processVideo}
                disabled={!uploadedVideo || isProcessingVideo || isProcessingLiveVideo || !isServerConnected}
                className="py-2 px-4 rounded-md text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {isProcessingVideo ? 'Processing...' : 'Deteksi Per-Frame'}
              </button>
              
              {uploadedVideo && (
                <button
                  onClick={toggleLiveVideoProcessing}
                  disabled={!uploadedVideo || isProcessingVideo || !isServerConnected}
                  className="py-2 px-4 rounded-md text-white transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: isProcessingLiveVideo ? theme.errorColor : theme.successColor 
                  }}
                >
                  {isProcessingLiveVideo ? 'Stop Live Detection' : 'Start Live Detection'}
                </button>
              )}
              
              {isProcessingVideo && (
                <div className="flex items-center gap-2 w-full mt-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${videoProcessingProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{videoProcessingProgress}%</span>
                </div>
              )}
            </div>
            
            {isProcessingLiveVideo && (
              <div className="mt-4 p-3 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm">
                <p className="font-medium">Live Detection Mode</p>
                <p>Menjalankan deteksi secara langsung pada video yang sedang diputar.</p>
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-4" style={{ borderColor: theme.borderColor }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Video Analysis Results</h3>
              
              {isProcessingLiveVideo && (
                <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Live Detection</span>
                </div>
              )}
            </div>
            
            {videoResults.length > 0 && !isProcessingLiveVideo ? (
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Detected Frames:</h4>
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 pb-2">
                      {videoResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedVideoFrame(index)}
                          className={`flex-shrink-0 w-16 h-16 relative border-2 ${selectedVideoFrame === index ? 'border-blue-500' : 'border-transparent'}`}
                        >
                          <img
                            src={`data:image/jpeg;base64,${result.frameData}`}
                            alt={`Frame ${index}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1">
                            {(result.detection.confidence * 100).toFixed(0)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedVideoFrame !== null && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Selected Detection:</h4>
                    <div className="aspect-video bg-black relative mb-2">
                      <canvas
                        ref={videoCanvasRef}
                        className="w-full h-full"
                      />
                    </div>
                    
                    <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: darkMode ? '#283747' : '#f8f9fa' }}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium">Object:</p>
                          <p className="capitalize">{videoResults[selectedVideoFrame].detection.ternak}</p>
                        </div>
                        {videoResults[selectedVideoFrame].detection.class && (
                          <div>
                            <p className="font-medium">Class:</p>
                            <p>{videoResults[selectedVideoFrame].detection.class}</p>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">Confidence:</p>
                          <p>{(videoResults[selectedVideoFrame].detection.confidence * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Time:</p>
                          <p>{new Date(videoResults[selectedVideoFrame].detection.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 border rounded-lg" style={{ borderColor: theme.borderColor }}>
                {isProcessingVideo ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p>Processing video, please wait...</p>
                  </div>
                ) : isProcessingLiveVideo ? (
                  <div className="flex flex-col items-center">
                    <p className="text-4xl mb-2">🎥</p>
                    <p className="mb-4">Deteksi sedang berjalan langsung pada video yang diputar</p>
                  </div>
                ) : (
                  <>
                    <p className="text-4xl mb-2">🎬</p>
                    <p className="mb-4">Upload and process a video to see detection results</p>
                    {!isServerConnected && (
                      <p className="text-sm text-red-500">Server tidak tersedia. Fitur deteksi video memerlukan koneksi server.</p>
                    )}
                  </>
                )}
              </div>
            )}
            
            <h3 className="text-lg font-medium mt-6 mb-2">Recent Detections</h3>
            <div className="overflow-y-auto max-h-48 border rounded" style={{ borderColor: theme.borderColor }}>
              {detections.length > 0 ? (
                <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left text-sm">Time</th>
                      <th className="px-2 py-1 text-left text-sm">Object</th>
                      <th className="px-2 py-1 text-left text-sm">Detail</th>
                      <th className="px-2 py-1 text-left text-sm">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: theme.borderColor }}>
                    {detections.map((detection, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-opacity-5' : ''} style={{ backgroundColor: index % 2 === 0 ? theme.bgColor : 'transparent' }}>
                        <td className="px-2 py-1 text-sm">
                          {new Date(detection.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-2 py-1 text-sm capitalize">
                          {detection.ternak}
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {detection.class || detection.aktivitas || '-'}
                        </td>
                        <td className="px-2 py-1 text-sm">
                          {(detection.confidence * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-3 text-center text-sm opacity-70">No detections yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionTab;
