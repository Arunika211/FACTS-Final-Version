"use client";

import React, { useEffect, useState, useRef } from 'react';
import { SensorData, fetchSensorData, formatTimestamp, fetchCVActivity } from '@/services/api';
import SensorMetric from './SensorMetric';
import dynamic from 'next/dynamic';
import AIAnalysisCard from './AIAnalysisCard';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

// Dynamically import the chart component to avoid SSR issues
const SensorChart = dynamic(() => import('./SensorChart'), { ssr: false });

interface MonitoringTabProps {
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
  isRealTime?: boolean;
  onRefresh?: () => Promise<void>;
}

const MonitoringTab: React.FC<MonitoringTabProps> = ({
  selectedAnimal,
  theme,
  darkMode,
  isRealTime = false,
  onRefresh
}) => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [cvData, setCvData] = useState<any[]>([]);
  const [latestCvData, setLatestCvData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs untuk mencegah flashing/berkedip ketika data baru datang
  const sensorDataRef = useRef<SensorData[]>([]);
  const latestDataRef = useRef<SensorData | null>(null);
  const cvDataRef = useRef<any[]>([]);
  const latestCvDataRef = useRef<any | null>(null);

  // Fetch sensor data
  useEffect(() => {
    const loadSensorData = async () => {
      try {
        // Pastikan fungsi fetchSensorData dipanggil dengan benar
        // Periksa apakah fetchSensorData menerima parameter
        const data = await fetchSensorData();
        
        // Validasi data
        if (!Array.isArray(data)) {
          console.error('Received non-array sensor data:', data);
          return;
        }
        
        // Filter data by selected animal
        const validData = data
          .filter(item => item && item.timestamp && item.ternak?.toLowerCase() === selectedAnimal.toLowerCase());
        
        // Sort by timestamp (newest first)
        validData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Hanya update state jika data benar-benar berbeda
        if (JSON.stringify(validData) !== JSON.stringify(sensorDataRef.current)) {
          sensorDataRef.current = validData;
          setSensorData(validData);
          
          if (validData.length > 0 && 
              (!latestDataRef.current || 
               new Date(validData[0].timestamp).getTime() !== new Date(latestDataRef.current.timestamp).getTime())) {
            latestDataRef.current = validData[0];
            setLatestData(validData[0]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading sensor data:', err);
        setError('Failed to load sensor data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadSensorData();
    
    // Set up polling based on real-time setting
    const interval = setInterval(loadSensorData, isRealTime ? 5000 : 30000);
    
    return () => clearInterval(interval);
  }, [selectedAnimal, isRealTime]);

  // Fetch CV activity data
  useEffect(() => {
    const loadCVData = async () => {
      try {
        const data = await fetchCVActivity(selectedAnimal);
        
        // Validasi data
        if (!Array.isArray(data)) {
          console.error('Received non-array CV data:', data);
          return;
        }
        
        // Pastikan setiap item memiliki timestamp
        const validData = data.filter(item => item && item.timestamp);
        
        // Sort by timestamp (newest first)
        validData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Hanya update state jika data benar-benar berbeda
        if (JSON.stringify(validData) !== JSON.stringify(cvDataRef.current)) {
          cvDataRef.current = validData;
          setCvData(validData);
          
          if (validData.length > 0 && 
              (!latestCvDataRef.current || 
               new Date(validData[0].timestamp).getTime() !== new Date(latestCvDataRef.current.timestamp).getTime())) {
            latestCvDataRef.current = validData[0];
            setLatestCvData(validData[0]);
          }
        }
      } catch (err) {
        console.error('Error loading CV activity data:', err);
      }
    };

    loadCVData();
    
    // Set up polling based on real-time setting
    const interval = setInterval(loadCVData, isRealTime ? 5000 : 30000);
    
    return () => clearInterval(interval);
  }, [selectedAnimal, isRealTime]);

  // Update latest sensor data when sensorData changes
  useEffect(() => {
    setLatestData(sensorData.length > 0 ? sensorData[0] : null);
  }, [sensorData]);

  // Prepare chart data
  const prepareChartData = (key: keyof SensorData) => {
    const chartData = {
      x: sensorData.map(item => formatTimestamp(item.timestamp)).reverse(),
      y: sensorData.map(item => Number(item[key]) || 0).reverse()
    };
    return chartData;
  };

  // Determine status based on values and animal type
  const getTemperatureStatus = (temp: number): 'normal' | 'warning' | 'danger' => {
    if (selectedAnimal === 'sapi') {
      return temp < 38 ? 'normal' : temp < 40 ? 'warning' : 'danger';
    } else if (selectedAnimal === 'kambing') {
      return temp < 38.5 ? 'normal' : temp < 40 ? 'warning' : 'danger';
    } else { // ayam
      return temp < 38 ? 'normal' : temp < 40 ? 'warning' : 'danger';
    }
  };

  const getHumidityStatus = (humidity: number): 'normal' | 'warning' | 'danger' => {
    if (humidity < 60) return 'warning';
    if (humidity > 85) return 'warning';
    return 'normal';
  };

  const getAirQualityStatus = (quality: number): 'normal' | 'warning' | 'danger' => {
    if (quality > 300) return 'danger';
    if (quality > 200) return 'warning';
    return 'normal';
  };

  const getActivityStatus = (value: number): 'normal' | 'warning' | 'danger' => {
    if (value > 8) return 'danger';
    if (value > 5) return 'warning';
    return 'normal';
  };

  // Function to determine overall status based on all sensor readings
  const getOverallStatus = (data: SensorData): 'normal' | 'warning' | 'danger' => {
    // Check temperature
    if (data.suhu !== undefined) {
      if (getTemperatureStatus(data.suhu) === 'danger') return 'danger';
      if (getTemperatureStatus(data.suhu) === 'warning') return 'warning';
    }
    
    // Check humidity - bisa menggunakan kelembapan atau kelembaban
    const humidity = data.kelembapan !== undefined ? data.kelembapan : data.kelembaban;
    if (humidity !== undefined) {
      if (getHumidityStatus(humidity) === 'danger') return 'danger';
      if (getHumidityStatus(humidity) === 'warning') return 'warning';
    }
    
    // Check air quality
    if (data.kualitas_udara !== undefined) {
      if (getAirQualityStatus(data.kualitas_udara) === 'danger') return 'danger';
      if (getAirQualityStatus(data.kualitas_udara) === 'warning') return 'warning';
    }
    
    // Check activity
    if (data.aktivitas !== undefined) {
      if (getActivityStatus(data.aktivitas) === 'danger') return 'danger';
      if (getActivityStatus(data.aktivitas) === 'warning') return 'warning';
    }
    
    return 'normal';
  };

  // Animal icons
  const animalIcons = {
    sapi: '🐄',
    ayam: '🐔',
    kambing: '🐐'
  } as const;
  
  type AnimalIconType = keyof typeof animalIcons;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-4xl animate-pulse" style={{ animationDuration: '3s' }}>
            {animalIcons[selectedAnimal as AnimalIconType]}
          </span>
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent px-3 py-1 rounded-lg" style={{
            backgroundSize: '200% 200%',
            animation: 'gradientShift 5s ease infinite',
            textShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            {selectedAnimal.charAt(0).toUpperCase() + selectedAnimal.slice(1)} Monitoring
          </span>
        </h2>
        <div className="flex items-center gap-2 text-sm px-3 py-1 rounded-full" style={{
          background: darkMode ? 'rgba(31, 41, 55, 0.7)' : 'rgba(243, 244, 246, 0.7)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <span className="animate-pulse h-2 w-2 rounded-full bg-green-500"></span>
          <span>Live Monitoring</span>
        </div>
      </div>

      {loading && <p className="text-center py-4">Loading sensor data...</p>}
      
      {error && (
        <div className="p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && sensorData.length === 0 && (
        <div className="p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mb-4">
          No sensor data available for {selectedAnimal}. Please ensure your sensors are connected and sending data.
        </div>
      )}

      {latestData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="sensor-wrapper overflow-hidden">
              <SensorMetric
                title="Temperature"
                value={latestData.suhu?.toFixed(1) || '--'}
                unit="°C"
                icon="🌡️"
                status={latestData.suhu ? getTemperatureStatus(latestData.suhu) : 'normal'}
                theme={theme}
              />
              <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 text-xs border-t" style={{ borderColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div className="pt-2 pb-1">
                  <span className="font-medium text-[9px] sm:text-[10px] md:text-xs text-blue-400">Ideal:</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium bg-blue-900/30 text-blue-400 border border-blue-800/50">
                    {selectedAnimal === 'sapi' ? '38-39°C' : selectedAnimal === 'kambing' ? '38.5-39.5°C' : '40-42°C'}
                  </span>
                  <span 
                    className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium flex items-center gap-0.5" 
                    style={{ 
                      backgroundColor: latestData.suhu ? 
                        (getTemperatureStatus(latestData.suhu) === 'normal' ? 'rgba(16, 185, 129, 0.1)' : 
                         getTemperatureStatus(latestData.suhu) === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 
                        'rgba(16, 185, 129, 0.1)',
                      color: latestData.suhu ? 
                        (getTemperatureStatus(latestData.suhu) === 'normal' ? 'var(--success)' : 
                         getTemperatureStatus(latestData.suhu) === 'warning' ? 'var(--warning)' : 'var(--danger)') : 
                        'var(--success)',
                      border: latestData.suhu ? 
                        (getTemperatureStatus(latestData.suhu) === 'normal' ? '1px solid rgba(16, 185, 129, 0.3)' : 
                         getTemperatureStatus(latestData.suhu) === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)') : 
                        '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {latestData.suhu ? 
                      (getTemperatureStatus(latestData.suhu) === 'normal' ? 'Normal' : 
                       getTemperatureStatus(latestData.suhu) === 'warning' ? 'Warn' : 'Kritis') : 
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="sensor-wrapper overflow-hidden">
              <SensorMetric
                title="Humidity"
                value={latestData.kelembapan?.toFixed(1) || latestData.kelembaban?.toFixed(1) || '--'}
                unit="%"
                icon="💧"
                status={latestData.kelembapan ? getHumidityStatus(latestData.kelembapan) : latestData.kelembaban ? getHumidityStatus(latestData.kelembaban) : 'normal'}
                theme={theme}
              />
              <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 text-xs border-t" style={{ borderColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div className="pt-2 pb-1">
                  <span className="font-medium text-[9px] sm:text-[10px] md:text-xs text-blue-400">Ideal:</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium bg-blue-900/30 text-blue-400 border border-blue-800/50">
                    {selectedAnimal === 'sapi' ? '60-80%' : selectedAnimal === 'kambing' ? '60-70%' : '50-70%'}
                  </span>
                  <span 
                    className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium flex items-center gap-0.5" 
                    style={{ 
                      backgroundColor: (latestData.kelembapan || latestData.kelembaban) ? 
                        (getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'normal' ? 'rgba(16, 185, 129, 0.1)' : 
                         getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 
                        'rgba(16, 185, 129, 0.1)',
                      color: (latestData.kelembapan || latestData.kelembaban) ? 
                        (getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'normal' ? 'var(--success)' : 
                         getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'warning' ? 'var(--warning)' : 'var(--danger)') : 
                        'var(--success)',
                      border: (latestData.kelembapan || latestData.kelembaban) ? 
                        (getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'normal' ? '1px solid rgba(16, 185, 129, 0.3)' : 
                         getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)') : 
                        '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {(latestData.kelembapan || latestData.kelembaban) ? 
                      (getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'normal' ? 'Normal' : 
                       getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'warning' ? 'Warn' : 'Kritis') : 
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="sensor-wrapper overflow-hidden">
              <SensorMetric
                title="Air Quality"
                value={latestData.kualitas_udara?.toFixed(0) || '--'}
                unit="ppm"
                icon="🌬️"
                status={latestData.kualitas_udara ? getAirQualityStatus(latestData.kualitas_udara) : 'normal'}
                theme={theme}
              />
              <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 text-xs border-t" style={{ borderColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div className="pt-2 pb-1">
                  <span className="font-medium text-[9px] sm:text-[10px] md:text-xs text-blue-400">Ideal:</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium bg-blue-900/30 text-blue-400 border border-blue-800/50">
                    {"<200ppm"}
                  </span>
                  <span 
                    className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium flex items-center gap-0.5" 
                    style={{ 
                      backgroundColor: latestData.kualitas_udara ? 
                        (getAirQualityStatus(latestData.kualitas_udara) === 'normal' ? 'rgba(16, 185, 129, 0.1)' : 
                         getAirQualityStatus(latestData.kualitas_udara) === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 
                        'rgba(16, 185, 129, 0.1)',
                      color: latestData.kualitas_udara ? 
                        (getAirQualityStatus(latestData.kualitas_udara) === 'normal' ? 'var(--success)' : 
                         getAirQualityStatus(latestData.kualitas_udara) === 'warning' ? 'var(--warning)' : 'var(--danger)') : 
                        'var(--success)',
                      border: latestData.kualitas_udara ? 
                        (getAirQualityStatus(latestData.kualitas_udara) === 'normal' ? '1px solid rgba(16, 185, 129, 0.3)' : 
                         getAirQualityStatus(latestData.kualitas_udara) === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)') : 
                        '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {latestData.kualitas_udara ? 
                      (getAirQualityStatus(latestData.kualitas_udara) === 'normal' ? 'OK' : 
                       getAirQualityStatus(latestData.kualitas_udara) === 'warning' ? 'Warn' : 'Bad') : 
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="sensor-wrapper overflow-hidden">
              <SensorMetric
                title="Activity"
                value={latestData.aktivitas?.toFixed(1) || '--'}
                unit="level"
                icon="🏃"
                status={latestData.aktivitas !== undefined ? getActivityStatus(latestData.aktivitas) : 'normal'}
                theme={theme}
              />
              <div className="px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 text-xs border-t" style={{ borderColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div className="pt-2 pb-1">
                  <span className="font-medium text-[9px] sm:text-[10px] md:text-xs text-blue-400">Ideal:</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium bg-blue-900/30 text-blue-400 border border-blue-800/50">
                    {"3-5 lvl"}
                  </span>
                  <span 
                    className="px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] rounded-full font-medium flex items-center gap-0.5" 
                    style={{ 
                      backgroundColor: latestData.aktivitas !== undefined ? 
                        (getActivityStatus(latestData.aktivitas) === 'normal' ? 'rgba(16, 185, 129, 0.1)' : 
                         getActivityStatus(latestData.aktivitas) === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 
                        'rgba(16, 185, 129, 0.1)',
                      color: latestData.aktivitas !== undefined ? 
                        (getActivityStatus(latestData.aktivitas) === 'normal' ? 'var(--success)' : 
                         getActivityStatus(latestData.aktivitas) === 'warning' ? 'var(--warning)' : 'var(--danger)') : 
                        'var(--success)',
                      border: latestData.aktivitas !== undefined ? 
                        (getActivityStatus(latestData.aktivitas) === 'normal' ? '1px solid rgba(16, 185, 129, 0.3)' : 
                         getActivityStatus(latestData.aktivitas) === 'warning' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)') : 
                        '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {latestData.aktivitas !== undefined ? 
                      (getActivityStatus(latestData.aktivitas) === 'normal' ? 'OK' : 
                       getActivityStatus(latestData.aktivitas) === 'warning' ? 'Warn' : 'High') : 
                      'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {sensorData.length >= 2 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 bg-clip-text text-transparent px-2 py-1 rounded-lg" style={{
                    backgroundSize: '200% 200%',
                    animation: 'gradientShift 6s ease infinite'
                  }}>Sensor Data Charts</span>
                </h3>
                <div className="flex items-center gap-2">
                  <select 
                    className="text-sm border rounded-md px-2 py-1"
                    style={{ 
                      borderColor: 'var(--border-color)',
                      background: darkMode ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                    }}
                    defaultValue="24h"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="6h">Last 6 Hours</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Charts Section - now takes 2 columns on large screens */}
                <div className="lg:col-span-2 dashboard-card p-0 overflow-hidden">
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold font-heading ml-4 mt-4">Sensor Data Trends</h3>
                      {isRealTime && (
                        <div className="text-sm px-3 py-1 mr-4 mt-4 rounded-full" style={{
                          background: darkMode ? 'rgba(6, 78, 59, 0.5)' : 'rgba(220, 252, 231, 0.7)',
                          color: darkMode ? 'rgba(74, 222, 128, 1)' : 'rgba(22, 101, 52, 1)',
                          backdropFilter: 'blur(2px)',
                          WebkitBackdropFilter: 'blur(2px)',
                        }}>
                          <span className="animate-pulse">●</span>
                          <span>Real-time Updates</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                      {/* Temperature Chart */}
                      <div className="dashboard-card p-4">
                        <SensorChart
                          title="Temperature Trend"
                          data={{
                            x: sensorData.slice(0, 10).map(item => formatTimestamp(item.timestamp)).reverse(),
                            y: sensorData.slice(0, 10).map(item => item.suhu || 0).reverse()
                          }}
                          yAxisTitle="Temperature (°C)"
                          color={theme.primaryColor}
                          darkMode={darkMode}
                          isRealTime={isRealTime}
                          onRefresh={onRefresh}
                          responsiveBreakpoint={768}
                        />
                      </div>
                      
                      {/* Humidity Chart */}
                      <div className="dashboard-card p-4">
                        <SensorChart
                          title="Humidity Trend"
                          data={{
                            x: sensorData.slice(0, 10).map(item => formatTimestamp(item.timestamp)).reverse(),
                            y: sensorData.slice(0, 10).map(item => item.kelembapan || item.kelembaban || 0).reverse()
                          }}
                          yAxisTitle="Humidity (%)"
                          color={theme.secondaryColor}
                          darkMode={darkMode}
                          isRealTime={isRealTime}
                          onRefresh={onRefresh}
                          responsiveBreakpoint={768}
                        />
                      </div>
                      
                      {/* Air Quality Chart */}
                      <div className="dashboard-card p-4">
                        <SensorChart
                          title="Air Quality Trend"
                          data={{
                            x: sensorData.slice(0, 10).map(item => formatTimestamp(item.timestamp)).reverse(),
                            y: sensorData.slice(0, 10).map(item => item.kualitas_udara || 0).reverse()
                          }}
                          yAxisTitle="Air Quality (ppm)"
                          color={theme.warningColor}
                          darkMode={darkMode}
                          isRealTime={isRealTime}
                          onRefresh={onRefresh}
                          responsiveBreakpoint={768}
                        />
                      </div>
                      
                      {/* Feed Distance Chart */}
                      <div className="dashboard-card p-4">
                        <SensorChart
                          title="Feed Level Trend"
                          data={{
                            x: sensorData.slice(0, 10).map(item => formatTimestamp(item.timestamp)).reverse(),
                            y: sensorData.slice(0, 10).map(item => item.jarak_pakan || 0).reverse()
                          }}
                          yAxisTitle="Distance (cm)"
                          color={theme.successColor}
                          darkMode={darkMode}
                          isRealTime={isRealTime}
                          onRefresh={onRefresh}
                          responsiveBreakpoint={768}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h4 className="font-medium">Activity Level Over Time</h4>
                  </div>
                  <div className="h-72">
                    <SensorChart
                      title=""
                      data={prepareChartData('aktivitas')}
                      yAxisTitle="Activity Level"
                      color="var(--secondary)"
                      darkMode={darkMode}
                    />
                  </div>
                </div>
                
                {/* Right side content - new column that sits next to the charts */}
                <div className="lg:col-span-1">
                  {/* Health Status Overview Card */}
                  <div className="dashboard-card overflow-hidden mb-6">
                    <div className="p-4 border-b flex justify-between items-center" style={{ 
                      borderColor: 'var(--border-color)',
                      background: latestData && getOverallStatus(latestData) === 'normal' 
                        ? 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)'
                        : latestData && getOverallStatus(latestData) === 'warning'
                        ? 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)'
                        : 'linear-gradient(to right, rgba(239, 68, 68, 0.1), transparent)'
                    }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <span>{
                          latestData && getOverallStatus(latestData) === 'normal'
                            ? <FiCheckCircle className="text-success" />
                            : latestData && getOverallStatus(latestData) === 'warning'
                            ? <FiAlertTriangle className="text-warning" />
                            : <FiAlertTriangle className="text-danger" />
                        }</span>
                        <span>Current Status</span>
                      </h4>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ 
                        backgroundColor: latestData && getOverallStatus(latestData) === 'normal' 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : latestData && getOverallStatus(latestData) === 'warning'
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: latestData && getOverallStatus(latestData) === 'normal'
                          ? 'var(--success)'
                          : latestData && getOverallStatus(latestData) === 'warning'
                          ? 'var(--warning)'
                          : 'var(--danger)'
                      }}>
                        {latestData && getOverallStatus(latestData) === 'normal' ? 'Healthy' : 
                         latestData && getOverallStatus(latestData) === 'warning' ? 'Warning' : 'Critical'}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="text-sm font-medium mb-1">Temperature</h5>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">{latestData?.suhu?.toFixed(1) || '--'}°C</span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{
                              backgroundColor: latestData?.suhu 
                                ? (getTemperatureStatus(latestData.suhu) === 'normal' 
                                  ? 'rgba(16, 185, 129, 0.1)' 
                                  : getTemperatureStatus(latestData.suhu) === 'warning' 
                                  ? 'rgba(245, 158, 11, 0.1)' 
                                  : 'rgba(239, 68, 68, 0.1)')
                                : 'rgba(16, 185, 129, 0.1)',
                              color: latestData?.suhu
                                ? (getTemperatureStatus(latestData.suhu) === 'normal'
                                  ? 'var(--success)'
                                  : getTemperatureStatus(latestData.suhu) === 'warning'
                                  ? 'var(--warning)'
                                  : 'var(--danger)')
                                : 'var(--success)'
                            }}>
                              {latestData?.suhu
                                ? (getTemperatureStatus(latestData.suhu) === 'normal'
                                  ? 'Normal'
                                  : getTemperatureStatus(latestData.suhu) === 'warning'
                                  ? 'Warning'
                                  : 'High')
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-1">Humidity</h5>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">
                              {latestData?.kelembapan?.toFixed(1) || latestData?.kelembaban?.toFixed(1) || '--'}%
                            </span>
                            {latestData && (latestData.kelembapan || latestData.kelembaban) && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                backgroundColor: getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'normal'
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'warning'
                                  ? 'rgba(245, 158, 11, 0.1)'
                                  : 'rgba(239, 68, 68, 0.1)',
                                color: getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'normal'
                                  ? 'var(--success)'
                                  : getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'warning'
                                  ? 'var(--warning)'
                                  : 'var(--danger)'
                              }}>
                                {getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'normal'
                                  ? 'Normal'
                                  : getHumidityStatus(latestData.kelembapan || latestData.kelembaban) === 'warning'
                                  ? 'Warning'
                                  : 'Critical'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h5 className="text-sm font-medium mb-1">Air Quality</h5>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">{latestData?.kualitas_udara?.toFixed(0) || '--'} ppm</span>
                            {latestData?.kualitas_udara && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                backgroundColor: latestData.kualitas_udara > 300 
                                  ? 'rgba(239, 68, 68, 0.1)' 
                                  : latestData.kualitas_udara > 200 
                                  ? 'rgba(245, 158, 11, 0.1)' 
                                  : 'rgba(16, 185, 129, 0.1)',
                                color: latestData.kualitas_udara > 300 
                                  ? 'var(--danger)' 
                                  : latestData.kualitas_udara > 200 
                                  ? 'var(--warning)' 
                                  : 'var(--success)'
                              }}>
                                {latestData.kualitas_udara > 300 
                                  ? 'Poor' 
                                  : latestData.kualitas_udara > 200 
                                  ? 'Moderate' 
                                  : 'Good'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-1">Activity</h5>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">{latestData?.aktivitas?.toFixed(1) || '--'}</span>
                            {latestData?.aktivitas !== undefined && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                backgroundColor: latestData.aktivitas > 8 
                                  ? 'rgba(239, 68, 68, 0.1)' 
                                  : latestData.aktivitas > 5 
                                  ? 'rgba(245, 158, 11, 0.1)' 
                                  : 'rgba(16, 185, 129, 0.1)',
                                color: latestData.aktivitas > 8 
                                  ? 'var(--danger)' 
                                  : latestData.aktivitas > 5 
                                  ? 'var(--warning)' 
                                  : 'var(--success)'
                              }}>
                                {latestData.aktivitas > 8 
                                  ? 'High' 
                                  : latestData.aktivitas > 5 
                                  ? 'Moderate' 
                                  : 'Normal'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Correlation info */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                        <h5 className="text-sm font-medium mb-2">Parameter Correlation</h5>
                        <p className="text-xs opacity-80">
                          {selectedAnimal === 'sapi' 
                            ? 'Higher temperatures correlate with increased activity levels in cattle, which may indicate heat stress.'
                            : selectedAnimal === 'kambing'
                            ? 'Goats show increased activity with changes in air quality, suggesting sensitivity to environmental conditions.'
                            : 'Chickens exhibit decreased activity when humidity levels are suboptimal, affecting overall health.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recommendations Card */}
                  <div className="dashboard-card overflow-hidden mb-6">
                    <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <span>💡</span>
                        <span>Recommendations</span>
                      </h4>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-3 text-sm">
                        {latestData?.suhu && getTemperatureStatus(latestData.suhu) !== 'normal' && (
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">⚠️</span>
                            <span>Monitor temperature and adjust environment conditions</span>
                          </li>
                        )}
                        {latestData && (latestData.kelembapan || latestData.kelembaban) && 
                          getHumidityStatus(latestData.kelembapan || latestData.kelembaban) !== 'normal' && (
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">⚠️</span>
                            <span>Improve ventilation to optimize humidity levels</span>
                          </li>
                        )}
                        {latestData?.kualitas_udara && latestData.kualitas_udara > 200 && (
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">⚠️</span>
                            <span>Clean the housing to improve air quality</span>
                          </li>
                        )}
                        {latestData?.aktivitas && latestData.aktivitas > 5 && (
                          <li className="flex items-start gap-2">
                            <span className="text-warning mt-0.5">⚠️</span>
                            <span>Check for unusual activity patterns</span>
                          </li>
                        )}
                        {/* Default recommendations */}
                        <li className="flex items-start gap-2">
                          <span className="text-info mt-0.5">ℹ️</span>
                          <span>Maintain regular feeding schedule</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-info mt-0.5">ℹ️</span>
                          <span>Ensure clean water supply is always available</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Ideal Parameters Card */}
                  <div className="dashboard-card overflow-hidden">
                    <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <h4 className="font-medium flex items-center gap-2">
                        <span>📋</span>
                        <span>Ideal Conditions</span>
                      </h4>
                    </div>
                    <div className="p-4">
                      <h5 className="text-sm font-medium mb-2">For {selectedAnimal.charAt(0).toUpperCase() + selectedAnimal.slice(1)}</h5>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <td className="py-1.5 font-medium">Temperature:</td>
                            <td className="py-1.5">{selectedAnimal === 'sapi' ? '38-39°C' : selectedAnimal === 'kambing' ? '38.5-39.5°C' : '40-42°C'}</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <td className="py-1.5 font-medium">Humidity:</td>
                            <td className="py-1.5">{selectedAnimal === 'sapi' ? '60-80%' : selectedAnimal === 'kambing' ? '60-70%' : '50-70%'}</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <td className="py-1.5 font-medium">Air Quality:</td>
                            <td className="py-1.5">{"< 200 ppm"}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-medium">Activity Level:</td>
                            <td className="py-1.5">{"3-5 lvl"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className="text-xl">📃</span>
                <span className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent px-2 py-1 rounded-lg" style={{
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 7s ease infinite'
                }}>Recent Sensor Data</span>
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  className="text-sm px-3 py-1 rounded-md transition-colors"
                  style={{ 
                    background: darkMode 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))' 
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(29, 78, 216, 0.9))',
                    color: 'white',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={() => console.log('Export data')}
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="dashboard-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Temperature (°C)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Humidity (%)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Air Quality</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {sensorData.slice(0, 10).map((data, index) => (
                      <tr 
                        key={index} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${index % 2 === 0 ? 'bg-gray-50 bg-opacity-30 dark:bg-gray-800 dark:bg-opacity-30' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm">{formatTimestamp(data.timestamp)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className={data.suhu !== undefined ? (data.suhu > 30 ? 'text-red-500' : data.suhu < 20 ? 'text-blue-500' : '') : ''}
                          >
                            {data.suhu?.toFixed(1) || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className={data.kelembapan !== undefined ? (data.kelembapan > 80 ? 'text-blue-500' : data.kelembapan < 40 ? 'text-yellow-500' : '') : 
                                      data.kelembaban !== undefined ? (data.kelembaban > 80 ? 'text-blue-500' : data.kelembaban < 40 ? 'text-yellow-500' : '') : ''}
                          >
                            {data.kelembapan?.toFixed(1) || data.kelembaban?.toFixed(1) || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className={data.kualitas_udara !== undefined ? (data.kualitas_udara > 300 ? 'text-red-500' : data.kualitas_udara > 200 ? 'text-yellow-500' : '') : ''}
                          >
                            {data.kualitas_udara?.toFixed(0) || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className={data.aktivitas !== undefined ? (data.aktivitas > 8 ? 'text-red-500' : data.aktivitas > 5 ? 'text-yellow-500' : '') : ''}
                          >
                            {data.aktivitas?.toFixed(1) || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span 
                            className="px-2 py-1 text-xs rounded-full" 
                            style={{
                              backgroundColor: getOverallStatus(data) === 'normal' ? 'rgba(16, 185, 129, 0.1)' : 
                                            getOverallStatus(data) === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: getOverallStatus(data) === 'normal' ? 'var(--success)' : 
                                     getOverallStatus(data) === 'warning' ? 'var(--warning)' : 'var(--danger)'
                            }}
                          >
                            {getOverallStatus(data) === 'normal' ? 'Normal' : 
                             getOverallStatus(data) === 'warning' ? 'Warning' : 'Alert'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sensorData.length > 10 && (
                <div className="p-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-xs opacity-70">Showing 10 of {sensorData.length} records</span>
                  <div className="flex gap-2">
                    <button className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border-color)' }}>Previous</button>
                    <button className="text-xs px-2 py-1 rounded border" style={{ borderColor: 'var(--border-color)' }}>Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonitoringTab;
