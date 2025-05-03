"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiDownload, FiInfo } from 'react-icons/fi';

interface SensorChartProps {
  title: string;
  data: {
    x: string[];
    y: number[];
  };
  yAxisTitle: string;
  color: string;
  darkMode: boolean;
  isRealTime?: boolean;
  refreshInterval?: number; // in milliseconds
  onRefresh?: () => void;
  responsiveBreakpoint?: number; // width in pixels
}

const SensorChart: React.FC<SensorChartProps> = ({
  title,
  data,
  yAxisTitle,
  color,
  darkMode,
  isRealTime = false,
  refreshInterval = 5000,
  onRefresh,
  responsiveBreakpoint = 768
}) => {
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverData, setHoverData] = useState<{index: number, value: number} | null>(null);
  const [animate, setAnimate] = useState(false);
  
  // Deteksi touch device - Hanya di client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);
  
  // Handle real-time updates
  useEffect(() => {
    if (!isRealTime || !onRefresh) return;
    
    const interval = setInterval(() => {
      onRefresh();
      setLastUpdated(new Date());
      // Tambahkan animasi saat data diperbarui
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [isRealTime, onRefresh, refreshInterval]);
  
  // Handle responsive behavior - Hanya di client-side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < responsiveBreakpoint);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsiveBreakpoint]);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
    setLastUpdated(new Date());
  }, []);

  // Touch handling untuk perangkat mobile
  const handleTouchStart = useCallback((index: number, value: number) => {
    if (isTouchDevice) {
      setHoverData({index, value});
    }
  }, [isTouchDevice]);
  
  const handleTouchEnd = useCallback(() => {
    if (isTouchDevice) {
      // Delay removing hover data untuk memberi waktu user membaca
      setTimeout(() => setHoverData(null), 1500);
    }
  }, [isTouchDevice]);

  if (!mounted) return <div className="h-64 flex items-center justify-center">Memuat grafik...</div>;
  
  // Format time for display
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
  };

  // In a real implementation, we would use Plotly or Chart.js here
  // For now, we'll create a simple chart visualization
  const maxValue = Math.max(...data.y, 1); // Ensure at least 1 for empty arrays
  
  // Handle chart download (in a real app, this would generate an image)
  const handleDownload = () => {
    alert('Fitur download grafik akan diimplementasikan di versi mendatang');
  };
  
  // Label formater untuk angka
  const formatNumber = (num: number): string => {
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  };
  
  return (
    <div 
      className={`w-full transition-all duration-300 ${isExpanded ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4 md:p-6' : 'h-full p-2'}`}
      ref={chartRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (!isTouchDevice) setHoverData(null);
      }}
    >
      <div className="flex flex-wrap items-center justify-between mb-2">
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        <div className="flex items-center gap-2 ml-auto">
          {isRealTime && (
            <div className="flex items-center gap-1 text-xs">
              <span className="animate-pulse text-green-500">●</span>
              <span className="opacity-70">Live</span>
              <span className="text-xs opacity-50 ml-1 hidden sm:inline">{formatLastUpdated()}</span>
            </div>
          )}
          <div className="flex items-center">
            <button 
              onClick={() => onRefresh?.()}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-transform active:scale-95"
              title="Refresh data"
              aria-label="Segarkan data"
            >
              <FiRefreshCw size={isSmallScreen ? 14 : 16} className={isRealTime ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleDownload}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-transform active:scale-95 hidden sm:block"
              title="Download chart"
              aria-label="Unduh grafik"
            >
              <FiDownload size={isSmallScreen ? 14 : 16} />
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-transform active:scale-95"
              title={isExpanded ? 'Minimize' : 'Maximize'}
              aria-label={isExpanded ? 'Perkecil' : 'Perbesar'}
            >
              {isExpanded ? <FiMinimize2 size={isSmallScreen ? 14 : 16} /> : <FiMaximize2 size={isSmallScreen ? 14 : 16} />}
            </button>
          </div>
        </div>
      </div>
      <div 
        className={`${isExpanded ? 'h-[calc(100vh-150px)]' : 'h-64'} p-2 transition-all duration-300`} 
        style={{ 
          backgroundColor: 'transparent'
        }}
      >
        {data.x.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <FiInfo className="text-gray-400" size={32} />
            <p className="text-gray-500">Tidak ada data tersedia</p>
          </div>
        ) : (
          <div className="h-full relative">
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-6">
              {[0, 1, 2, 3, 4].map((_, i) => (
                <div key={i} className="w-full border-t border-dashed" 
                  style={{ 
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    height: i === 0 ? '1px' : 'auto'
                  }}>
                  <span className="text-xs opacity-50" style={{ fontSize: '0.6rem' }}>
                    {formatNumber(Math.round((maxValue / 4) * (4 - i) * 100) / 100)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Bars */}
            <div className="h-full flex items-end gap-1 relative pb-6 z-10">
              {data.y.map((value, index) => {
                // Limit height to 90% to ensure it stays within container
                const height = Math.min(90, (value / maxValue) * 90);
                const isActive = hoverData?.index === index;
                return (
                  <div 
                    key={index} 
                    className="flex flex-col items-center justify-end flex-1 h-full"
                  >
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ease-in-out ${isActive ? 'opacity-100 shadow-lg' : 'hover:opacity-80'} ${animate && index === data.y.length - 1 ? 'animate-bar-highlight' : ''}`} 
                      style={{ 
                        height: `${height}%`, 
                        backgroundColor: isActive ? `${color}` : color,
                        minHeight: '4px',
                        maxHeight: '90%',
                        transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)'
                      }}
                      onMouseEnter={() => setHoverData({index, value})}
                      onTouchStart={() => handleTouchStart(index, value)}
                      onTouchEnd={handleTouchEnd}
                      title={`${formatNumber(value)}`}
                    />
                    {/* Value tooltip on hover */}
                    {isActive && (
                      <div className="absolute -top-8 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap z-20 animate-fade-in shadow-lg"
                           style={{ left: `${(100 / data.x.length) * index}%`, transform: 'translateX(-50%)' }}>
                        <div className="flex flex-col">
                          <span>{formatNumber(value)} {yAxisTitle}</span>
                          <span className="text-gray-400 text-[9px]">{data.x[index]}</span>
                        </div>
                      </div>
                    )}
                    {/* X-axis labels - show more on larger screens */}
                    {(isSmallScreen ? 
                      index % Math.max(1, Math.ceil(data.x.length / 3)) === 0 : 
                      index % Math.max(1, Math.ceil(data.x.length / (isExpanded ? 12 : 6))) === 0) && (
                      <div className="absolute bottom-0 text-xs truncate text-center" 
                        style={{ 
                          fontSize: '0.65rem',
                          left: `${(100 / data.x.length) * index}%`,
                          width: `${100 / Math.min(data.x.length, isSmallScreen ? 3 : (isExpanded ? 12 : 6))}%`,
                          maxWidth: isExpanded ? '150px' : '100px',
                          transform: 'translateX(-50%)'
                        }}>
                        {data.x[index].split(' ')[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-center flex items-center justify-center gap-1">
        <span>{yAxisTitle}</span>
        {isRealTime && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
            <span className="animate-pulse">●</span>
            <span>Real-time</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default SensorChart;
