"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { fetchSensorData, fetchCVActivity, sendTestSensorData, generateBatchSensorData } from '@/services/api';
import Sidebar from '@/components/dashboard/Sidebar';
import { FiWifi, FiWifiOff } from 'react-icons/fi';
import LabAITab from '@/components/dashboard/LabAITab';

// Dynamically import components to avoid SSR issues
const MonitoringTab = dynamic(() => import('@/components/dashboard/MonitoringTab'), { ssr: false });
const DetectionTab = dynamic(() => import('@/components/dashboard/DetectionTab'), { ssr: false });

// Hook untuk menangani layout responsif
function useLayoutManager() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return {
    isMobile,
    hasMounted,
    getMarginLeft: (sidebarOpen: boolean) => {
      if (!hasMounted) return '0';
      return sidebarOpen ? (isMobile ? '0' : '16rem') : '4rem';
    },
    getPadding: () => {
      if (!hasMounted) return '1rem';
      return isMobile ? '0.5rem' : '1rem';
    }
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalType>('sapi');
  const [darkMode, setDarkMode] = useState(false);
  const [sensorCount, setSensorCount] = useState(0);
  const [cvCount, setCvCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const layout = useLayoutManager();

  // Check system preference for dark mode on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDarkMode);
    }
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load data counts function - made into a callback so it can be used for real-time updates
  const loadCounts = useCallback(async () => {
    if (!isOnline) return;
    
    try {
      const sensorData = await fetchSensorData();
      const cvData = await fetchCVActivity(selectedAnimal);
      
      // Verifikasi bahwa data yang diterima adalah array
      if (!Array.isArray(sensorData)) {
        console.error('Sensor data bukan array:', sensorData);
        startTransition(() => {
          setSensorCount(0);
          setLastUpdated(new Date());
        });
        return;
      }
      
      if (!Array.isArray(cvData)) {
        console.error('CV data bukan array:', cvData);
        startTransition(() => {
          setCvCount(0);
          setLastUpdated(new Date());
        });
        return;
      }
      
      // Filter by selected animal
      const filteredSensorData = sensorData.filter(item => 
        item && item.ternak?.toLowerCase() === selectedAnimal.toLowerCase()
      );
      
      const filteredCvData = cvData.filter(item => 
        item && item.ternak?.toLowerCase() === selectedAnimal.toLowerCase()
      );
      
      // Update state with transition to reduce visual jank/flashing
      startTransition(() => {
        setSensorCount(filteredSensorData.length);
        setCvCount(filteredCvData.length);
        setLastUpdated(new Date());
      });
    } catch (error) {
      console.error('Error loading data counts:', error);
      if (isOnline) {
        setStatusMessage('Error refreshing data. Menggunakan mode simulasi.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    }
  }, [selectedAnimal, isOnline]);
  
  // Load data counts on mount and when animal changes
  useEffect(() => {
    loadCounts();
    
    // Set up polling based on real-time setting
    let interval: NodeJS.Timeout | null = null;
    
    if (isRealTimeEnabled) {
      interval = setInterval(loadCounts, 10000); // Faster refresh for real-time mode
    } else {
      interval = setInterval(loadCounts, 60000); // Slower refresh when not in real-time mode
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadCounts, isRealTimeEnabled]);

  // Theme colors based on mode
  const theme = {
    primaryColor: darkMode ? '#4da6ff' : '#3366ff',
    secondaryColor: '#0c4da2',
    textColor: darkMode ? '#e0e0e0' : '#333333',
    cardBg: darkMode ? '#2c3e50' : '#ffffff',
    bgColor: darkMode ? '#1e1e1e' : '#f8f9fa',
    successColor: darkMode ? '#00cc66' : '#28a745',
    warningColor: darkMode ? '#ff9933' : '#ffc107',
    errorColor: darkMode ? '#ff5050' : '#dc3545',
    metricBg: darkMode ? '#283747' : '#f8f9fa',
    borderColor: darkMode ? '#4e5d6c' : '#e9ecef',
  };

  // Animal icons mapping
  const animalIcons = {
    sapi: '🐄',
    ayam: '🐔',
    kambing: '🐐'
  } as const;
  
  type AnimalType = keyof typeof animalIcons;

  // Send test data function
  const handleSendTestData = async () => {
    setIsLoading(true);
    setStatusMessage('Mengirim data uji...');
    
    try {
      const success = await sendTestSensorData(selectedAnimal);
      
      if (success) {
        setStatusMessage('Data berhasil dikirim! Memperbarui data...');
        
        // Reload counts after a short delay
        setTimeout(async () => {
          const sensorData = await fetchSensorData();
          const filteredData = sensorData.filter(item => 
            item.ternak?.toLowerCase() === selectedAnimal.toLowerCase()
          );
          setSensorCount(filteredData.length);
          setStatusMessage(null);
          setIsLoading(false);
        }, 2000);
      } else {
        setStatusMessage('Gagal mengirim data. Periksa koneksi Anda.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending test data:', error);
      setStatusMessage('Error mengirim data. Periksa koneksi Anda.');
      setIsLoading(false);
    }
  };

  // Generate batch data function
  const handleGenerateBatchData = async () => {
    setIsLoading(true);
    setStatusMessage('Membuat data uji batch...');
    
    try {
      const success = await generateBatchSensorData(selectedAnimal, 10);
      
      if (success) {
        setStatusMessage('Berhasil membuat 10 data uji! Memperbarui data...');
        
        // Reload counts after a short delay
        setTimeout(async () => {
          const sensorData = await fetchSensorData();
          const filteredData = sensorData.filter(item => 
            item.ternak?.toLowerCase() === selectedAnimal.toLowerCase()
          );
          setSensorCount(filteredData.length);
          setStatusMessage(null);
          setIsLoading(false);
        }, 2000);
      } else {
        setStatusMessage('Gagal membuat beberapa data uji. Periksa koneksi Anda.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error generating batch data:', error);
      setStatusMessage('Error membuat data uji. Periksa koneksi Anda.');
      setIsLoading(false);
    }
  };

  // Render loading state during hydration
  if (!layout.hasMounted) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-2">🐄</div>
        <h1 className="text-xl font-bold mb-4">FACTS Dashboard</h1>
        <div className="animate-pulse">Memuat...</div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        selectedAnimal={selectedAnimal}
        sensorCount={sensorCount}
        cvCount={cvCount}
        isLoading={isLoading}
        darkMode={darkMode}
        isOpen={sidebarOpen}
        animalIcons={animalIcons}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSelectAnimal={(animal) => setSelectedAnimal(animal as AnimalType)}
        onChangeTab={(tab) => setActiveTab(tab)}
        onSendTestData={handleSendTestData}
        onGenerateBatchData={handleGenerateBatchData}
      />
      
      {/* Header */}
      <header className="pro-header sticky top-0 z-10" style={{ 
        marginLeft: layout.getMarginLeft(sidebarOpen),
        transition: 'margin-left 0.3s ease-in-out',
        background: darkMode 
          ? 'linear-gradient(90deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))'
          : 'linear-gradient(90deg, rgba(255, 255, 255, 0.85), rgba(248, 250, 252, 0.9))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="container mx-auto px-2 md:px-4 flex justify-between items-center h-full">
          <h1 className="text-base sm:text-xl md:text-2xl font-bold font-heading bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent truncate animate-gradient animate-fadeSlideIn">
            FACTS Monitoring Dashboard
          </h1>
          <div className="flex items-center gap-1 md:gap-4 animate-fadeSlideIn" style={{ animationDelay: '0.2s' }}>
            {/* Real-time indicator - Visible only on medium screens and up */}
            <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              {isOnline ? (
                <>
                  <FiWifi className="text-green-500" />
                  <span className="text-sm">Terhubung</span>
                  {isRealTimeEnabled && (
                    <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full ml-1 flex items-center gap-1">
                      <span className="animate-pulse">●</span>
                      <span>Live</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <FiWifiOff className="text-red-500" />
                  <span className="text-sm">Offline</span>
                </>
              )}
            </div>
            
            {/* Mobile-only status */}
            <div className="flex md:hidden">
              {isOnline ? (
                <span className="text-green-500">
                  <FiWifi size={16} />
                </span>
              ) : (
                <span className="text-red-500">
                  <FiWifiOff size={16} />
                </span>
              )}
              {isRealTimeEnabled && (
                <span className="animate-pulse text-green-500 ml-1">●</span>
              )}
            </div>
            
            {/* Toggle real-time updates */}
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`transition-all rounded-full px-2 py-1 text-xs sm:text-sm flex items-center gap-1 hover:shadow-md ${
                isRealTimeEnabled 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <span>{isRealTimeEnabled ? '⚡' : '⏱️'}</span>
              <span className="hidden sm:inline">{isRealTimeEnabled ? 'Real-time' : 'Manual'}</span>
            </button>
            
            {/* Toggle dark mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="transition-all rounded-full p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main style={{ 
        marginLeft: layout.getMarginLeft(sidebarOpen),
        transition: 'margin-left 0.3s ease-in-out',
        padding: layout.getPadding()
      }} className="dashboard-layout">
        {/* Status Message */}
        {statusMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fadeSlideIn">
            <div className="bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg text-sm">
              {statusMessage}
            </div>
          </div>
        )}
        
        {/* Display the active tab content */}
        <div className="animate-fadeSlideIn" style={{ animationDelay: '0.3s' }}>
          {activeTab === 'monitoring' && (
            <MonitoringTab 
              selectedAnimal={selectedAnimal} 
              theme={theme}
              darkMode={darkMode}
              isRealTime={isRealTimeEnabled}
              onRefresh={loadCounts}
            />
          )}
          
          {(activeTab === 'vise' || activeTab === 'detection') && (
            <DetectionTab 
              selectedAnimal={selectedAnimal}
              theme={theme}
              darkMode={darkMode}
            />
          )}
          
          {activeTab === 'lab' && (
            <LabAITab
              selectedAnimal={selectedAnimal}
              theme={theme}
              darkMode={darkMode}
              onSelectAnimal={(animal) => setSelectedAnimal(animal as AnimalType)}
            />
          )}
        </div>
        
        {/* Last updated info */}
        {lastUpdated && (
          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 animate-fadeSlideIn" style={{ animationDelay: '0.5s' }}>
            Diperbarui terakhir: {lastUpdated.toLocaleTimeString('id-ID')}
          </div>
        )}
      </main>

      {/* Footer - Make it responsive */}
      <footer className="px-2 py-4 sm:p-6 border-t mt-auto animate-fadeSlideIn" style={{ 
        borderColor: 'var(--border-color)',
        marginLeft: layout.getMarginLeft(sidebarOpen),
        transition: 'margin-left 0.3s ease-in-out',
        animationDelay: '0.6s'
      }}>
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-center md:text-left">
              <div className="text-xl sm:text-2xl hidden sm:block animate-pulse-slow">
                {animalIcons[selectedAnimal as keyof typeof animalIcons]}
              </div>
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent animate-gradient">FACTS Monitoring Dashboard</h3>
                <p className="text-xs sm:text-sm opacity-70">Next.js Version - {new Date().getFullYear()}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              {/* Last updated info in footer - hide on very small screens */}
              {lastUpdated && (
                <div className="text-xs md:text-sm opacity-70 hidden sm:flex items-center gap-1">
                  <span>Pembaruan:</span>
                  <span>{lastUpdated.toLocaleTimeString('id-ID')}</span>
                  {isRealTimeEnabled && <span className="animate-pulse text-xs text-green-500 ml-1">●</span>}
                </div>
              )}
              
              <div className="flex gap-2 sm:gap-4">
                <a href="#" className="text-xs sm:text-sm opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  {'📖'}{' '}Dokumentasi
                </a>
                <a href="#" className="text-xs sm:text-sm opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                  {'🛠️'}{' '}Bantuan
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
