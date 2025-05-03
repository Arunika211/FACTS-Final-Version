import React, { useEffect, useState } from 'react';

interface SensorMetricProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: string;
  status?: 'normal' | 'warning' | 'danger';
  theme: {
    successColor: string;
    warningColor: string;
    errorColor: string;
    borderColor: string;
    textColor: string;
  };
}

const SensorMetric: React.FC<SensorMetricProps> = ({
  title,
  value,
  unit,
  icon,
  status = 'normal',
  theme
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsVerySmallScreen(window.innerWidth < 400);
    };
    
    // Set initial values
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine status color
  const getStatusColor = () => {
    switch (status) {
      case 'danger':
        return theme.errorColor;
      case 'warning':
        return theme.warningColor;
      case 'normal':
      default:
        return theme.successColor;
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'danger':
        return 'rgba(239, 68, 68, 0.1)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)';
      case 'normal':
      default:
        return 'rgba(16, 185, 129, 0.1)';
    }
  };

  // Simplify status text for mobile devices
  const getStatusText = () => {
    if (isVerySmallScreen) {
      switch (status) {
        case 'danger': return '⚠️ K';
        case 'warning': return '⚠️ W';
        case 'normal': default: return '✓ OK';
      }
    } else if (isMobile) {
      switch (status) {
        case 'danger': return '⚠️ Kritis';
        case 'warning': return '⚠️ Warn';
        case 'normal': default: return '✓ OK';
      }
    } else {
      switch (status) {
        case 'danger': return '⚠️ Kritis';
        case 'warning': return '⚠️ Warning';
        case 'normal': default: return '✓ Normal';
      }
    }
  };

  return (
    <div 
      className="sensor-card transition-all duration-300 ease-in-out relative overflow-hidden rounded-xl p-2 sm:p-3 md:p-4 hover:-translate-y-1"
      style={{ 
        background: `linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '12px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `${getStatusColor()}40`,
        boxShadow: `0 4px 15px -2px rgba(0, 0, 0, 0.2), 0 0 0 1px ${getStatusColor()}20`,
        transform: 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10,
      }}
    >
      {/* Glass effect shine overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-20"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none'
        }}
      ></div>
      
      {/* Status indicator */}
      <div 
        className="absolute top-0 left-0 w-full h-1 sm:h-1.5 z-20"
        style={{ 
          background: `linear-gradient(90deg, transparent 0%, ${getStatusColor()} 50%, transparent 100%)`,
          opacity: 0.8
        }}
      ></div>
      
      <div className="flex justify-between items-start mb-1 sm:mb-2 md:mb-3 relative z-30">
        <div className="flex items-center">
          <div 
            className={`text-base sm:text-lg md:text-xl lg:text-2xl mr-1 sm:mr-2 p-1 sm:p-1.5 rounded-full ${isVerySmallScreen ? '' : 'animate-pulse-slow'}`}
            style={{ 
              background: getStatusBg(),
              backgroundImage: `linear-gradient(135deg, ${getStatusBg()}, ${getStatusColor()}30)`,
              boxShadow: `0 0 15px ${getStatusColor()}40`,
              animationDuration: '3s',
              position: 'relative',
              zIndex: 30
            }}
          >
            {icon}
          </div>
          <h3 className="font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base truncate max-w-[80px] sm:max-w-full">{title}</h3>
        </div>
        <div 
          className={`status-indicator w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full ${isVerySmallScreen ? '' : 'animate-pulse'}`}
          style={{ 
            background: getStatusColor(),
            boxShadow: `0 0 0 2px ${getStatusBg()}`,
            animationDuration: '2s',
            position: 'relative',
            zIndex: 30
          }}
        ></div>
      </div>
      
      <div className="mb-1 sm:mb-2 relative z-30">
        <div 
          className="text-xl sm:text-2xl md:text-3xl font-bold transition-all flex items-baseline" 
          style={{ 
            color: getStatusColor(),
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {value}
          {unit && <span className="text-xs sm:text-sm md:text-base ml-0.5 opacity-80">{unit}</span>}
        </div>
      </div>
      
      <div 
        className="w-full h-1 sm:h-1.5 md:h-2 mt-1 sm:mt-1.5 md:mt-2 rounded-full relative z-30"
        style={{ 
          background: `${getStatusColor()}20`,
          overflow: 'hidden'
        }}
      >
        <div 
          className="h-full rounded-full relative"
          style={{ 
            width: `${typeof value === 'number' ? Math.min(value, 100) : 50}%`,
            background: `linear-gradient(90deg, ${getStatusColor()}90 0%, ${getStatusColor()} 100%)`,
            boxShadow: `0 0 10px ${getStatusColor()}80`,
            transition: 'width 0.5s ease-in-out'
          }}
        >
          {/* Animated shine effect on progress bar */}
          <div 
            className={`absolute inset-0 ${isVerySmallScreen ? '' : 'barHighlight'}`}
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              animation: isVerySmallScreen ? 'none' : 'barHighlight 2s infinite linear'
            }}
          ></div>
        </div>
      </div>
      
      <div 
        className="text-[8px] sm:text-[9px] md:text-xs mt-1 sm:mt-1.5 md:mt-2 font-medium flex items-center gap-1 relative z-30"
        style={{ 
          color: getStatusColor(),
          opacity: 0.9
        }}
      >
        {getStatusText()}
      </div>
    </div>
  );
};

export default SensorMetric;
