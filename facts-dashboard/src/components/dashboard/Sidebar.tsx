"use client";

import React, { useEffect, useState, useRef } from 'react';
import { SensorData } from '@/services/api';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface SidebarProps {
  activeTab: string;
  selectedAnimal: string;
  sensorCount: number;
  cvCount: number;
  isLoading: boolean;
  darkMode: boolean;
  isOpen: boolean;
  animalIcons: Record<string, string>;
  onToggleSidebar: () => void;
  onSelectAnimal: (animal: string) => void;
  onChangeTab: (tab: string) => void;
  onSendTestData: () => void;
  onGenerateBatchData: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  selectedAnimal,
  sensorCount,
  cvCount,
  isLoading,
  darkMode,
  isOpen,
  animalIcons,
  onToggleSidebar,
  onSelectAnimal,
  onChangeTab,
  onSendTestData,
  onGenerateBatchData
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Refs untuk mendapatkan posisi tombol dropdown
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownBtnCollapsedRef = useRef<HTMLButtonElement>(null);
  
  // State untuk posisi dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  // Fungsi untuk menghitung posisi dropdown
  const calculateDropdownPosition = () => {
    if (isOpen && dropdownBtnRef.current) {
      const rect = dropdownBtnRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    } else if (!isOpen && dropdownBtnCollapsedRef.current) {
      const rect = dropdownBtnCollapsedRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX 
      });
    }
  };
  
  // Update posisi dropdown saat buka/tutup
  useEffect(() => {
    if (dropdownOpen) {
      calculateDropdownPosition();
    }
  }, [dropdownOpen]);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Deteksi perangkat mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Menghindari rendering yang tidak konsisten antara server dan client
  if (!isClient) {
    return null; // Atau render loading state
  }

  // Handler untuk toggle dropdown
  const handleToggleDropdown = () => {
    calculateDropdownPosition();
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      <aside 
        className={`fixed top-0 left-0 h-full z-10 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-16'} overflow-hidden pro-sidebar ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        {/* Tombol tutup sidebar untuk tampilan mobile */}
        {isMobile && isOpen && (
          <button 
            onClick={onToggleSidebar}
            className="absolute top-4 right-4 p-3 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all z-30"
            aria-label="Tutup sidebar"
          >
            <span className="text-xl font-bold">×</span>
          </button>
        )}

        {/* Toggle Button - Inside sidebar - tampil hanya jika tidak mobile */}
        {!isMobile && (
          <button 
            onClick={onToggleSidebar}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-opacity-80 transition-all pro-btn pro-btn-primary z-10"
            aria-label={isOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        )}

        <div className="p-4 pt-16 h-full overflow-y-auto font-body" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {/* CSS untuk menghilangkan scrollbar di browser WebKit */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Logo/Title - Always visible */}
          <div className="flex items-center justify-center mb-8">
            <div className={`text-3xl ${isOpen ? '' : 'mx-auto'} transition-all`}>
              {animalIcons[selectedAnimal] || '🐄'}
            </div>
            {isOpen && (
              <h1 className="ml-2 text-lg font-bold font-heading bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                FACTS
              </h1>
            )}
          </div>

          {/* Content only visible when sidebar is open */}
          {isOpen && (
            <>
              {/* Animal Selection with Dropdown */}
              <div className="mb-6 animate-fade-in">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2 font-heading">
                  <span style={{ color: 'var(--secondary)' }}>🐾</span>
                  <span>Pilih Hewan</span>
                </h3>
                
                {/* Dropdown button */}
                <div className="relative">
                  <button 
                    ref={dropdownBtnRef}
                    onClick={handleToggleDropdown}
                    className="p-2 rounded-lg flex items-center justify-between w-full pro-btn-outline"
                    style={{ boxShadow: 'var(--shadow-sm)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{animalIcons[selectedAnimal]}</span>
                      <span className="capitalize font-medium">{selectedAnimal}</span>
                    </div>
                    {dropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2 font-heading">
                  <span style={{ color: 'var(--accent)' }}>📊</span>
                  <span>Tampilan Dashboard</span>
                </h3>
                <div className="pro-tabs flex flex-col space-y-1.5">
                  <button
                    onClick={() => onChangeTab('monitoring')}
                    className={`pro-tab ${activeTab === 'monitoring' ? 'pro-tab-active' : ''} flex items-center justify-start gap-2 py-2`}
                  >
                    <span className="text-lg">📈</span>
                    <span>Monitoring</span>
                    {activeTab === 'monitoring' && <span className="animate-pulse text-xs text-green-500 ml-auto">●</span>}
                  </button>
                  <button
                    onClick={() => onChangeTab('vise')}
                    className={`pro-tab ${activeTab === 'vise' || activeTab === 'detection' ? 'pro-tab-active' : ''} flex items-center justify-start gap-2 py-2`}
                  >
                    <span className="text-lg">🔍</span>
                    <span>Vise AI</span>
                    {(activeTab === 'vise' || activeTab === 'detection') && <span className="animate-pulse text-xs text-blue-500 ml-auto">●</span>}
                  </button>
                  <button
                    onClick={() => onChangeTab('lab')}
                    className={`pro-tab ${activeTab === 'lab' ? 'pro-tab-active' : ''} flex items-center justify-start gap-2 py-2`}
                  >
                    <span className="text-lg">🧪</span>
                    <span>Lab AI</span>
                    {activeTab === 'lab' && <span className="animate-pulse text-xs text-purple-500 ml-auto">●</span>}
                  </button>
                </div>
              </div>
              
              {/* Metrics Summary */}
              <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2 font-heading">
                  <span style={{ color: 'var(--info)' }}>📊</span>
                  <span>Ringkasan Data</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                    <span className="animate-pulse">●</span>
                    <span>Live</span>
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="pro-metric text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--primary)' }}></div>
                    <div className="text-2xl mb-1 font-heading" style={{ color: 'var(--primary)' }}>
                      {sensorCount}
                      <span className="text-xs ml-1 animate-pulse">↑</span>
                    </div>
                    <p className="text-xs opacity-70">Data Sensor</p>
                    <p className="text-[10px] mt-1 opacity-50">Baru saja</p>
                  </div>
                  <div className="pro-metric text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--secondary)' }}></div>
                    <div className="text-2xl mb-1 font-heading" style={{ color: 'var(--secondary)' }}>
                      {cvCount}
                      <span className="text-xs ml-1 animate-pulse">↑</span>
                    </div>
                    <p className="text-xs opacity-70">Aktivitas CV</p>
                    <p className="text-[10px] mt-1 opacity-50">Baru saja</p>
                  </div>
                </div>
              </div>
              
              {/* Test Connection Buttons */}
              <div className="space-y-2 animate-fade-in mb-12" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={onSendTestData}
                  disabled={isLoading}
                  className="pro-btn pro-btn-secondary w-full py-2 flex items-center justify-center gap-2 text-sm"
                  style={{
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span>{isLoading ? '⏳' : '🔄'}</span>
                  <span>Kirim Data Uji</span>
                </button>
                
                <button
                  onClick={onGenerateBatchData}
                  disabled={isLoading}
                  className="pro-btn pro-btn-primary w-full py-2 flex items-center justify-center gap-2 text-sm"
                  style={{
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span>{isLoading ? '⏳' : '📊'}</span>
                  <span>Buat 10 Data</span>
                </button>
              </div>
            </>
          )}
          
          {/* Content only visible when sidebar is collapsed */}
          {!isOpen && !isMobile && (
            <div className="flex flex-col items-center space-y-6 mt-8">
              {/* Animal Dropdown Icon for collapsed state */}
              <div className="relative">
                <button
                  ref={dropdownBtnCollapsedRef}
                  onClick={handleToggleDropdown}
                  className={`p-2 rounded-full transition-all ${selectedAnimal ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title="Pilih hewan"
                >
                  <span className="text-xl">{animalIcons[selectedAnimal]}</span>
                </button>
              </div>
              
              {/* Tab Icons */}
              <div className="border-t w-8 my-2 border-gray-200 dark:border-gray-700"></div>
              <button
                onClick={() => onChangeTab('monitoring')}
                className={`p-2 rounded-full transition-all relative ${activeTab === 'monitoring' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Monitoring"
              >
                <span className="text-xl">📈</span>
                {activeTab === 'monitoring' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>}
              </button>
              <button
                onClick={() => onChangeTab('vise')}
                className={`p-2 rounded-full transition-all relative ${activeTab === 'vise' || activeTab === 'detection' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Vise AI"
              >
                <span className="text-xl">🔍</span>
                {(activeTab === 'vise' || activeTab === 'detection') && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>}
              </button>
              <button
                onClick={() => onChangeTab('lab')}
                className={`p-2 rounded-full transition-all relative ${activeTab === 'lab' ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Lab AI"
              >
                <span className="text-xl">🧪</span>
                {activeTab === 'lab' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>}
              </button>
              
              {/* Action buttons dengan margin bottom agar tidak bertabrakan */}
              <div className="space-y-3 mb-12">
                <button
                  onClick={onSendTestData}
                  disabled={isLoading}
                  className="p-2 rounded-full transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Kirim Data Uji"
                >
                  <span className="text-xl">{isLoading ? '⏳' : '🔄'}</span>
                </button>
                
                <button
                  onClick={onGenerateBatchData}
                  disabled={isLoading}
                  className="p-2 rounded-full transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Buat 10 Data Uji"
                >
                  <span className="text-xl">{isLoading ? '⏳' : '📊'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      {/* Overlay for mobile menu when sidebar is open */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={onToggleSidebar}
        ></div>
      )}

      {/* Mobile Toggle Button - Outside sidebar - visible only on mobile */}
      {isMobile && !isOpen && (
        <button
          onClick={onToggleSidebar}
          className="fixed z-20 bottom-4 left-4 p-3 rounded-full shadow-lg bg-primary text-white hover:bg-opacity-90 transition-all animate-bounce"
          aria-label="Buka sidebar"
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      {/* Dropdown overlay - rendered outside of sidebar to prevent layout issues */}
      {dropdownOpen && (
        <>
          {/* Invisible overlay to catch clicks outside dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setDropdownOpen(false)}
          />
          
          {/* Dropdown content */}
          <div 
            className="fixed z-50 rounded-md bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 py-1 w-56 animate-fadeIn"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {Object.entries(animalIcons).map(([animal, icon]) => (
              <div 
                key={animal}
                onClick={() => {
                  onSelectAnimal(animal);
                  setDropdownOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${selectedAnimal === animal ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <span className="text-xl">{icon}</span>
                <span className="capitalize">{animal}</span>
                {selectedAnimal === animal && (
                  <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
