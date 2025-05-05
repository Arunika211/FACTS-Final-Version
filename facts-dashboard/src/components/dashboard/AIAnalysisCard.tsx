"use client";

import React, { useState, useEffect, ComponentProps } from 'react';
import { SensorData, generateAIAnalysis } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';

// Mendefinisikan tipe khusus untuk komponen ReactMarkdown
type MarkdownComponentProps = ComponentProps<typeof ReactMarkdown>["components"];
type ComponentType = keyof Required<MarkdownComponentProps>;

interface AIAnalysisCardProps {
  selectedAnimal: string;
  sensorData: SensorData | null;
  cvData: any | null;
  theme: any;
}

const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ 
  selectedAnimal, 
  sensorData, 
  cvData,
  theme 
}) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAnalysis = async () => {
    if (!sensorData) {
      setError('No sensor data available. Please generate some data first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await generateAIAnalysis(selectedAnimal, sensorData, cvData || {});
      setAnalysis(result);
    } catch (err) {
      console.error('Error generating analysis:', err);
      setError('Failed to generate AI analysis. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Determine status color based on analysis content
  const getStatusColor = () => {
    if (!analysis || typeof analysis !== 'string') return 'var(--info)';
    
    const analysisLower = analysis.toLowerCase();
    
    if (analysisLower.includes('kritis') || 
        analysisLower.includes('buruk') || 
        analysisLower.includes('bahaya')) {
      return 'var(--danger)';
    } else if (analysisLower.includes('waspada') || 
               analysisLower.includes('perhatian') || 
               analysis.includes('peringatan')) {
      return 'var(--warning)';
    } else {
      return 'var(--success)';
    }
  };

  // Get status icon based on analysis content
  const getStatusIcon = () => {
    if (!analysis || typeof analysis !== 'string') return <FiInfo className="text-info" />;
    
    const analysisLower = analysis.toLowerCase();
    
    if (analysisLower.includes('kritis') || 
        analysisLower.includes('buruk') || 
        analysisLower.includes('bahaya')) {
      return <FiAlertTriangle className="text-danger" />;
    } else if (analysisLower.includes('waspada') || 
               analysisLower.includes('perhatian') || 
               analysis.includes('peringatan')) {
      return <FiAlertTriangle className="text-warning" />;
    } else {
      return <FiCheckCircle className="text-success" />;
    }
  };

  // Extract key insights from analysis
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (analysis && typeof analysis === 'string') {
      // Extract bullet points from the analysis
      const insights = analysis.split('\n')
        .filter(line => line.trim().startsWith('*') || line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^[\*\-]\s+/, ''))
        .filter(line => line.length > 10); // Only meaningful insights
      
      setKeyInsights(insights.slice(0, 5)); // Take top 5 insights
    } else {
      setKeyInsights([]);
    }
  }, [analysis]);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 bg-clip-text text-transparent px-2 py-1 rounded-lg" style={{
            backgroundSize: '200% 200%',
            animation: 'gradientShift 6s ease infinite',
            textShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            AI Analysis
          </span>
        </h3>
      </div>

      {!analysis ? (
        <div className="dashboard-card p-6 overflow-hidden" style={{
          background: theme.cardBg === '#1e293b' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))'
            : 'linear-gradient(135deg, rgba(31, 41, 55, 0.7), rgba(55, 65, 81, 0.6))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: theme.cardBg === '#1e293b'
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: theme.cardBg === '#1e293b' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(66, 78, 103, 0.8)'
        }}>
          <div className="flex justify-center mb-8 mt-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-0 border-4 border-dashed border-blue-500 rounded-full animate-spin-slow"></div>
              <div className="text-5xl">🧠</div>
            </div>
          </div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-3 font-heading">Analisis Cerdas dengan Gemini AI</h3>
            <p className="mb-4 opacity-70 max-w-md mx-auto">
              Gemini AI akan menganalisis data ternak Anda dan memberikan rekomendasi personal untuk meningkatkan kesehatan dan produktivitas.
            </p>
          </div>
          
          {error && (
            <div className="p-4 mb-6 rounded-lg text-white bg-red-500 flex items-center gap-3 mx-auto max-w-md">
              <FiAlertTriangle size={20} />
              <p>{error}</p>
            </div>
          )}
          
          <div className="flex justify-center">
            <button 
              className="py-3 rounded-lg text-white transition-all"
              onClick={handleGenerateAnalysis}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                backgroundSize: '200% 200%',
                animation: loading ? 'none' : 'gradientShift 3s ease infinite',
                padding: '0.75rem 2.5rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                transform: loading ? 'none' : 'translateY(0)',
                transition: 'all 0.3s ease',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Menganalisis Data...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FiRefreshCw />
                  <span>Mulai Analisis</span>
                </span>
              )}
            </button>
          </div>
          
          {sensorData && (
            <div className="mt-8 bg-blue-900/20 rounded-lg p-3 border border-blue-800/30 text-xs text-center max-w-md mx-auto">
              <p className="flex items-center justify-center gap-2 text-blue-400">
                <span>ℹ️</span>
                <span>
                  Analisis akan didasarkan pada {Object.keys(sensorData).length} parameter 
                  {selectedAnimal === 'sapi' ? ' sapi' : selectedAnimal === 'kambing' ? ' kambing' : ' ayam' } terakhir yang terekam.
                </span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard-card p-0 overflow-hidden" style={{
          background: theme.cardBg === '#1e293b' 
            ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))'
            : 'linear-gradient(135deg, rgba(31, 41, 55, 0.7), rgba(55, 65, 81, 0.6))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: theme.cardBg === '#1e293b'
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
            : '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: theme.cardBg === '#1e293b' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(66, 78, 103, 0.8)'
        }}>
          <div className="p-4 border-b flex justify-between items-center" 
               style={{ 
                 borderColor: 'var(--border-color)',
                 background: theme.cardBg === '#1e293b'
                   ? `linear-gradient(to right, ${getStatusColor()}30, ${getStatusColor()}10, transparent)`
                   : `linear-gradient(to right, ${getStatusColor()}20, ${getStatusColor()}05, transparent)`
               }}>
            <h3 className="font-bold flex items-center gap-2 font-heading">
              <span className="flex items-center justify-center h-7 w-7 rounded-full"
                    style={{ 
                      backgroundColor: `${getStatusColor()}20`,
                      color: getStatusColor(),
                      border: `2px solid ${getStatusColor()}50`
                    }}>
                {getStatusIcon()}
              </span>
              <span style={{ color: getStatusColor() }}>
                {!analysis || typeof analysis !== 'string' ? '✅ Status Tidak Diketahui' :
                analysis.toLowerCase().includes('kritis') || analysis.toLowerCase().includes('bahaya') 
                  ? '⚠️ Status Kritis' 
                  : analysis.toLowerCase().includes('waspada') || analysis.toLowerCase().includes('perhatian')
                  ? '⚠️ Perlu Perhatian'
                  : '✅ Status Baik'}
              </span>
            </h3>
            <button 
              className="text-sm px-3 py-1.5 rounded flex items-center gap-1 transition-all"
              onClick={() => setAnalysis(null)}
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'white',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
              }}
            >
              <FiRefreshCw size={14} />
              <span>Analisis Baru</span>
            </button>
          </div>
          
          {/* Key Insights Section */}
          {keyInsights.length > 0 && (
            <div className="border-b" style={{ 
              borderColor: theme.cardBg === '#1e293b' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(66, 78, 103, 0.8)'
            }}>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors" 
                onClick={() => setExpandedSections({...expandedSections, insights: !expandedSections.insights})}
                style={{
                  background: theme.cardBg === '#1e293b'
                    ? 'linear-gradient(to right, rgba(55, 48, 163, 0.2), transparent)'
                    : 'linear-gradient(to right, rgba(55, 48, 163, 0.2), transparent)'
                }}
              >
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <span className="text-amber-400">🔑</span>
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Key Insights
                  </span>
                  <span className="text-xs opacity-70 font-normal">({keyInsights.length})</span>
                </h4>
                <span className="text-gray-400 hover:text-gray-300 transition-colors">
                  {expandedSections.insights ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.insights ? 'max-h-96' : 'max-h-0'}`}
                   style={{
                     background: 'rgba(17, 24, 39, 0.4)'
                   }}>
                <ul className="py-2 px-4 space-y-3 border-t border-gray-800">
                  {keyInsights.map((insight, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <span 
                        className="flex items-center justify-center h-5 w-5 mt-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${getStatusColor()}20`,
                          color: getStatusColor(),
                          border: `2px solid ${getStatusColor()}40`
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div className="text-sm markdown-insight">
                        <ReactMarkdown
                          components={{
                            p: ({children}) => <span>{children}</span>,
                            em: ({children}) => <span className="font-medium" style={{color: getStatusColor()}}>{children}</span>,
                            strong: ({children}) => <span className="font-bold">{children}</span>,
                            code: ({children}) => <code className="px-1 py-0.5 bg-gray-800 rounded text-xs">{children}</code>
                          }}
                        >
                          {insight}
                        </ReactMarkdown>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="pb-2 px-4">
                  <div className="border-t border-gray-800 pt-3">
                    <p className="text-xs text-gray-400">
                      Insights are automatically extracted from the AI analysis to highlight key points.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Full Analysis with Enhanced Markdown */}
          <div 
            className="p-6 prose prose-sm max-w-none dark:prose-invert markdown-content"
            style={{ 
              maxHeight: '500px', 
              overflowY: 'auto',
              fontSize: '1rem',
              lineHeight: '1.6',
              background: 'rgba(17, 24, 39, 0.4)'
            }}
          >
            <div className="mb-6">
              <div 
                className="inline-block px-3 py-1 text-sm rounded-full mb-2"
                style={{ 
                  backgroundColor: `${getStatusColor()}15`,
                  color: getStatusColor(),
                  border: `1px solid ${getStatusColor()}30`
                }}
              >
                {analysis.toLowerCase().includes('kritis') || analysis.toLowerCase().includes('bahaya') 
                  ? '⚠️ Status Kritis' 
                  : analysis.toLowerCase().includes('waspada') || analysis.toLowerCase().includes('perhatian')
                  ? '⚠️ Perlu Perhatian'
                  : '✅ Status Baik'}
              </div>
              <ReactMarkdown
                components={{
                  h2: ({children}) => <h2 className="text-xl font-bold mt-6 mb-3 pb-2 border-b border-gray-700" style={{color: 'var(--primary)'}}>{children}</h2>,
                  ul: ({children}) => <ul className="my-3 pl-5 space-y-2">{children}</ul>,
                  ol: ({children}) => <ol className="my-3 pl-5 space-y-2 list-decimal">{children}</ol>,
                  li: ({children}) => <li className="pl-2">{children}</li>,
                  p: ({children}) => <p className="my-3">{children}</p>,
                  em: ({children}) => <em className="font-medium not-italic" style={{color: getStatusColor()}}>{children}</em>
                }}
              >
                {analysis}
              </ReactMarkdown>
            </div>
          </div>
          
          {/* Footer */}
          <div 
            className="p-4 border-t flex items-center justify-between" 
            style={{ 
              borderColor: theme.cardBg === '#1e293b' ? 'rgba(55, 65, 81, 0.5)' : 'rgb(55, 65, 81)',
              background: 'linear-gradient(to right, rgba(55, 48, 163, 0.3), rgba(17, 24, 39, 0.4))',
              backdropFilter: 'blur(8px)'
            }}
          >
            <p className="flex items-center gap-1">
              <span className="opacity-70">Analysis generated by</span>
              <span className="font-medium flex items-center gap-1">
                <svg viewBox="0 0 24 24" height="16" width="16" fill="currentColor" className="text-blue-400">
                  <path d="M22.92 10.55c-.2-.4-.75-1.05-1.65-1.05h-6.75l.5-2.2c.15-.6 0-1.2-.35-1.7-.4-.45-.95-.7-1.55-.7h-2.2c-.45 0-.85.3-1 .75l-1.6 6.8h-3.1c-.6 0-1.2.55-1.2 1.15l.05 5.5c0 .6.45 1.1 1.05 1.15h2.6c-.35.65-.6 1.4-.6 2.2 0 .3.05.6.1.9.05.3.15.6.3.85h6.05c.75 0 1.45-.35 1.9-.95.4-.45.6-1.05.6-1.7v-1.3c0-.65-.25-1.25-.7-1.7-.4-.4-.95-.65-1.55-.7h-2.7c.25-.55.4-1.15.4-1.75 0-.25-.05-.5-.1-.75h10.9c1 0 1.85-.75 2-1.75.05-.35 0-.7-.05-1.05-.1-.4-.25-.8-.55-1.25zm-1.2 2c0 .35-.35.6-.7.6h-11.25l-.05 1.15c0 1-.85 1.85-1.85 1.85h-2.6l-.05-5.5h3.1c.5 0 .9-.3 1.05-.75l1.55-6.8c0-.05.05-.05.05-.1h2.2c.1 0 .15.05.2.1.05.05.05.15.05.25l-.5 2.2c-.15.5 0 1 .35 1.45.35.4.85.65 1.4.65h7.65c.2 0 .4.1.5.25.1.2.15.15.15.35.05.35.05.6 0 .9z"/>
                </svg>
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Google Gemini AI
                </span>
              </span>
            </p>
            <span 
              className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-medium" 
              style={{ 
                backgroundColor: `${getStatusColor()}15`,
                color: getStatusColor(),
                border: `1px solid ${getStatusColor()}30`
              }}
            >
              {getStatusIcon()}
              <span>
                {!analysis || typeof analysis !== 'string' ? 'Neutral' :
                 analysis.toLowerCase().includes('kritis') || analysis.toLowerCase().includes('bahaya') 
                 ? 'Critical' 
                 : analysis.toLowerCase().includes('waspada') || analysis.toLowerCase().includes('perhatian') 
                 ? 'Warning' 
                 : 'Good'}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Ideal parameters reference card */}
      {analysis && (
        <div className="dashboard-card p-0 mt-5 overflow-hidden shadow-sm parameter-card" style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 15px -2px rgba(0, 0, 0, 0.2)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(55, 65, 81, 0.5)'
        }}>
          <div 
            className="px-4 py-3 border-b flex justify-between items-center transition-colors" 
            style={{ 
              borderColor: 'var(--border-color)',
              background: 'linear-gradient(to right, rgba(79, 70, 229, 0.2), rgba(49, 46, 129, 0.05))'
            }}
          >
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <span className="text-indigo-400">💡</span>
              <span className="text-indigo-400 font-semibold">
                Parameter Ideal {selectedAnimal.charAt(0).toUpperCase() + selectedAnimal.slice(1)}
              </span>
            </h4>
            <div 
              className="cursor-pointer flex items-center gap-1 text-xs text-indigo-400"
              onClick={() => setExpandedSections({...expandedSections, parameters: !expandedSections.parameters})}
            >
              <span>{expandedSections.parameters ? 'Sembunyikan' : 'Lihat'} Detail</span>
              {expandedSections.parameters ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>
          
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections.parameters !== false ? 'max-h-[500px]' : 'max-h-0'}`}>
            <div className="p-4">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left font-medium text-gray-300 bg-gray-800/80 rounded-tl-lg">Parameter</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-300 bg-gray-800/80">Nilai Ideal</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-300 bg-gray-800/80 rounded-tr-lg">Status Saat Ini</th>
                  </tr>
                </thead>
                <tbody style={{
                  backgroundColor: 'rgba(17, 24, 39, 0.4)'
                }}>
                  <tr>
                    <td className="py-3 px-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center">
                          🌡️
                        </span>
                        <span className="font-medium">Suhu</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        {selectedAnimal === 'sapi' ? '38-39°C' : 
                        selectedAnimal === 'kambing' ? '38.5-39.5°C' : '40-42°C'}
                      </span>
                    </td>
                    <td className="py-3 px-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1" 
                          style={{
                            backgroundColor: sensorData && sensorData.suhu ? 
                              (sensorData.suhu > 40 ? 'rgba(239, 68, 68, 0.1)' : 
                              sensorData.suhu < 37 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 
                              'rgba(16, 185, 129, 0.1)',
                            color: sensorData && sensorData.suhu ? 
                              (sensorData.suhu > 40 ? 'var(--danger)' : 
                              sensorData.suhu < 37 ? 'var(--warning)' : 'var(--success)') : 
                              'var(--success)',
                            border: sensorData && sensorData.suhu ? 
                              (sensorData.suhu > 40 ? '1px solid rgba(239, 68, 68, 0.3)' : 
                              sensorData.suhu < 37 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)') : 
                              '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {sensorData?.suhu?.toFixed(1) || '--'}°C
                          {sensorData && sensorData.suhu && (
                            <span>
                              {sensorData.suhu > 40 ? <FiAlertTriangle size={12} /> : 
                              sensorData.suhu < 37 ? <FiAlertTriangle size={12} /> : 
                              <FiCheckCircle size={12} />}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="py-3 px-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                          💧
                        </span>
                        <span className="font-medium">Kelembaban</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        {selectedAnimal === 'sapi' ? '60-80%' : 
                        selectedAnimal === 'kambing' ? '60-70%' : '50-70%'}
                      </span>
                    </td>
                    <td className="py-3 px-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1" 
                          style={{
                            backgroundColor: sensorData && (sensorData.kelembapan || sensorData.kelembaban) ? 
                              ((sensorData.kelembapan || sensorData.kelembaban) > 80 ? 'rgba(239, 68, 68, 0.1)' : 
                              (sensorData.kelembapan || sensorData.kelembaban) < 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 
                              'rgba(16, 185, 129, 0.1)',
                            color: sensorData && (sensorData.kelembapan || sensorData.kelembaban) ? 
                              ((sensorData.kelembapan || sensorData.kelembaban) > 80 ? 'var(--danger)' : 
                              (sensorData.kelembapan || sensorData.kelembaban) < 50 ? 'var(--warning)' : 'var(--success)') : 
                              'var(--success)',
                            border: sensorData && (sensorData.kelembapan || sensorData.kelembaban) ? 
                              ((sensorData.kelembapan || sensorData.kelembaban) > 80 ? '1px solid rgba(239, 68, 68, 0.3)' : 
                              (sensorData.kelembapan || sensorData.kelembaban) < 50 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)') : 
                              '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {sensorData?.kelembapan?.toFixed(1) || sensorData?.kelembaban?.toFixed(1) || '--'}%
                          {sensorData && (sensorData.kelembapan || sensorData.kelembaban) && (
                            <span>
                              {(sensorData.kelembapan || sensorData.kelembaban) > 80 ? <FiAlertTriangle size={12} /> : 
                              (sensorData.kelembapan || sensorData.kelembaban) < 50 ? <FiAlertTriangle size={12} /> : 
                              <FiCheckCircle size={12} />}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td className="py-3 px-3" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center">
                          🌬️
                        </span>
                        <span className="font-medium">Kualitas Udara</span>
                      </div>
                    </td>
                    <td className="py-3 px-3" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="px-2 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        {"< 200 ppm"}
                      </span>
                    </td>
                    <td className="py-3 px-3" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1" 
                          style={{
                            backgroundColor: sensorData && sensorData.kualitas_udara ? 
                              (sensorData.kualitas_udara > 300 ? 'rgba(239, 68, 68, 0.1)' : 
                              sensorData.kualitas_udara > 200 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 
                              'rgba(16, 185, 129, 0.1)',
                            color: sensorData && sensorData.kualitas_udara ? 
                              (sensorData.kualitas_udara > 300 ? 'var(--danger)' : 
                              sensorData.kualitas_udara > 200 ? 'var(--warning)' : 'var(--success)') : 
                              'var(--success)',
                            border: sensorData && sensorData.kualitas_udara ? 
                              (sensorData.kualitas_udara > 300 ? '1px solid rgba(239, 68, 68, 0.3)' : 
                              sensorData.kualitas_udara > 200 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)') : 
                              '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {sensorData?.kualitas_udara?.toFixed(0) || '--'} ppm
                          {sensorData && sensorData.kualitas_udara && (
                            <span>
                              {sensorData.kualitas_udara > 300 ? <FiAlertTriangle size={12} /> : 
                              sensorData.kualitas_udara > 200 ? <FiAlertTriangle size={12} /> : 
                              <FiCheckCircle size={12} />}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                <p className="flex items-start gap-2">
                  <span className="mt-0.5">ℹ️</span>
                  <span>
                    Parameter ideal untuk setiap jenis ternak berbeda. Nilai di atas merupakan rentang ideal untuk
                    {selectedAnimal === 'sapi' ? ' sapi' : selectedAnimal === 'kambing' ? ' kambing' : ' ayam'} 
                    berdasarkan data penelitian. Pantau parameter ini secara berkala untuk memastikan kesehatan ternak optimal.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisCard;
