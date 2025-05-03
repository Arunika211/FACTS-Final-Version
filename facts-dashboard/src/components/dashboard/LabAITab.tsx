"use client";

import React, { useState, useEffect } from 'react';
import { fetchSensorData } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import { FiFileText, FiDownload, FiBarChart2, FiAlertTriangle, FiCheckCircle, FiChevronDown } from 'react-icons/fi';
import AIAnalysisCard from './AIAnalysisCard';

// Custom styling for markdown content
const markdownStyles = `
  .markdown-content {
    font-family: 'Inter', sans-serif;
  }
  
  .markdown-content h1 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    background: linear-gradient(to right, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    display: inline-block;
  }
  
  .markdown-content h2 {
    font-size: 1.5rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    color: #4f46e5;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }
  
  .markdown-content h3 {
    font-size: 1.25rem;
    margin-top: 1.2rem;
    margin-bottom: 0.75rem;
    color: #6366f1;
  }
  
  .markdown-content p {
    margin-bottom: 1rem;
    line-height: 1.6;
  }
  
  .markdown-content code {
    background-color: #f3f4f6;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    color: #4f46e5;
  }
  
  .markdown-content pre {
    background-color: #1e293b;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  
  .markdown-content pre code {
    background-color: transparent;
    color: #e2e8f0;
    padding: 0;
  }
  
  .markdown-content blockquote {
    border-left: 4px solid #8b5cf6;
    padding-left: 1rem;
    color: #4b5563;
    margin: 1.5rem 0;
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 0.25rem;
  }
  
  .markdown-content blockquote p {
    margin-bottom: 0;
  }
  
  .markdown-content ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .markdown-content ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .markdown-content li {
    margin-bottom: 0.5rem;
  }
  
  .markdown-content table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 1.5rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .markdown-content th {
    background-color: #6366f1;
    color: white;
    font-weight: 600;
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #4f46e5;
  }
  
  .markdown-content td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .markdown-content tr:last-child td {
    border-bottom: none;
  }
  
  .markdown-content tr:nth-child(even) {
    background-color: #f9fafb;
  }
  
  .dark .markdown-content blockquote {
    background-color: #1e293b;
    color: #e2e8f0;
    border-left-color: #6366f1;
  }
  
  .dark .markdown-content code {
    background-color: #334155;
    color: #a5b4fc;
  }
  
  .dark .markdown-content h2 {
    border-bottom-color: #1e293b;
    color: #a5b4fc;
  }
  
  .dark .markdown-content tr:nth-child(even) {
    background-color: #1e293b;
  }
  
  .dark .markdown-content td {
    border-bottom-color: #1e293b;
  }
  
  .dark .markdown-content th {
    background-color: #4338ca;
    border-bottom-color: #6366f1;
  }
  
  .markdown-content hr {
    border: 0;
    height: 1px;
    background-image: linear-gradient(to right, rgba(99, 102, 241, 0), rgba(99, 102, 241, 0.75), rgba(99, 102, 241, 0));
    margin: 2rem 0;
  }

  /* Styling untuk health monitor */
  .health-monitor table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    margin: 1.5rem 0;
  }

  .health-monitor th {
    background: linear-gradient(45deg, #4f46e5, #6366f1);
    color: white;
    font-weight: 600;
    text-align: left;
    padding: 1rem;
    font-size: 1rem;
  }

  .health-monitor thead tr {
    border-radius: 0.5rem 0.5rem 0 0;
    overflow: hidden;
  }

  .health-monitor td {
    padding: 1rem;
    vertical-align: middle;
    font-size: 1rem;
  }

  .health-monitor .value {
    font-weight: 600;
    font-size: 1.15rem;
    color: #1f2937;
  }

  .dark .health-monitor .value {
    color: #f9fafb;
  }

  .health-monitor .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-weight: 500;
  }

  .health-monitor .badge.success {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .dark .health-monitor .badge.success {
    background-color: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .health-monitor .trend {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Styling untuk trend data */
  .trend-data {
    background-color: #f8fafc;
    border-radius: 0.5rem;
    padding: 1.25rem;
    margin: 1.5rem 0;
    border: 1px solid #e2e8f0;
  }

  .trend-header {
    font-weight: 600;
    color: #6366f1;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.95rem;
  }

  .dark .trend-header {
    color: #a5b4fc;
    border-bottom-color: #334155;
  }

  .dark .trend-data {
    background-color: #1e293b;
    border-color: #334155;
  }

  .trend-item {
    display: flex;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px dashed #e2e8f0;
  }

  .trend-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .dark .trend-item {
    border-bottom-color: #334155;
  }

  .trend-label {
    flex: 0 0 140px;
    font-weight: 600;
    color: #4b5563;
  }

  .dark .trend-label {
    color: #9ca3af;
  }

  .trend-values {
    flex: 1;
    font-family: monospace;
    font-size: 0.95rem;
    color: #1f2937;
    overflow-x: auto;
    white-space: nowrap;
    letter-spacing: 0.025rem;
  }

  .dark .trend-values {
    color: #e5e7eb;
  }

  /* Styling untuk status badge di header */
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-weight: 600;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
  }

  .status-badge.success {
    background-color: #d1fae5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .dark .status-badge.success {
    background-color: rgba(6, 78, 59, 0.4);
    color: #34d399;
    border-color: rgba(6, 95, 70, 0.8);
  }

  .report-meta {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .dark .report-meta {
    color: #9ca3af;
  }

  /* Styling untuk monitor header */
  .monitor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .monitor-title {
    font-weight: 600;
    color: #4b5563;
    font-size: 0.95rem;
  }

  .dark .monitor-title {
    color: #e5e7eb;
  }

  .monitor-timestamp {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .dark .monitor-timestamp {
    color: #9ca3af;
  }

  /* Styling untuk parameter names dan icons */
  .param-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .param-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    font-size: 1.25rem;
  }

  .param-icon.temp {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .param-icon.humidity {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .param-icon.air {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .param-icon.activity {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .dark .param-icon.temp {
    background-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  .dark .param-icon.humidity {
    background-color: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .dark .param-icon.air {
    background-color: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .dark .param-icon.activity {
    background-color: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }

  .param-range {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .dark .param-range {
    color: #9ca3af;
  }

  /* Styling untuk trend charts */
  .trend-chart {
    width: 60px;
    height: 20px;
    background-color: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .dark .trend-chart {
    background-color: #1f2937;
  }

  .trend-line {
    position: absolute;
    height: 2px;
    bottom: 9px;
    left: 0;
    width: 100%;
  }

  .trend-line.up {
    background: linear-gradient(90deg, #d1fae5 0%, #10b981 100%);
    transform: translateY(-4px) skewY(-10deg);
  }

  .trend-line.down {
    background: linear-gradient(90deg, #fee2e2 0%, #ef4444 100%);
    transform: translateY(4px) skewY(10deg);
  }

  .trend-line.neutral {
    background: linear-gradient(90deg, #e5e7eb 0%, #9ca3af 100%);
  }

  .trend-value {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .trend-value.up {
    color: #10b981;
  }

  .trend-value.down {
    color: #ef4444;
  }

  .trend-value.neutral {
    color: #9ca3af;
  }

  .dark .trend-value.up {
    color: #34d399;
  }

  .dark .trend-value.down {
    color: #f87171;
  }

  .dark .trend-value.neutral {
    color: #d1d5db;
  }

  /* Value styling */
  .value.temp {
    color: #ef4444;
  }

  .value.humidity {
    color: #3b82f6;
  }

  .value.air {
    color: #10b981;
  }

  .value.activity {
    color: #f59e0b;
  }

  .dark .value.temp {
    color: #f87171;
  }

  .dark .value.humidity {
    color: #60a5fa;
  }

  .dark .value.air {
    color: #34d399;
  }

  .dark .value.activity {
    color: #fbbf24;
  }

  /* Alert panel styling */
  .alert-panel {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 0.5rem;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .dark .alert-panel {
    background-color: rgba(6, 78, 59, 0.2);
    border-color: rgba(6, 95, 70, 0.4);
  }

  .alert-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background-color: #dcfce7;
    color: #16a34a;
    border-radius: 50%;
    font-size: 1rem;
    font-weight: bold;
  }

  .dark .alert-icon {
    background-color: rgba(22, 163, 74, 0.2);
    color: #4ade80;
  }

  .alert-content {
    flex: 1;
  }

  .alert-title {
    font-weight: 600;
    color: #166534;
    margin-bottom: 0.25rem;
  }

  .dark .alert-title {
    color: #4ade80;
  }

  .alert-message {
    color: #166534;
    font-size: 0.95rem;
  }

  .dark .alert-message {
    color: #a7f3d0;
  }

  /* Recommendations styling */
  .recommendations {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .rec-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    transition: all 0.2s ease;
  }

  .rec-item:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }

  .dark .rec-item {
    background-color: #1f2937;
    border-color: #374151;
  }

  .rec-icon {
    font-size: 1.5rem;
  }

  .rec-content {
    flex: 1;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  /* Report footer */
  .report-footer {
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
  }

  .dark .report-footer {
    color: #9ca3af;
  }

  /* Styling untuk badges tambahan */
  .badge.warning {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .dark .badge.warning {
    background-color: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.4);
  }

  .badge.error {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .dark .badge.error {
    background-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.4);
  }

  .badge.primary {
    background-color: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
    border: 1px solid rgba(79, 70, 229, 0.2);
  }

  .dark .badge.primary {
    background-color: rgba(79, 70, 229, 0.2);
    color: #818cf8;
    border-color: rgba(79, 70, 229, 0.4);
  }

  .status-badge.primary {
    background-color: #ddd6fe;
    color: #4f46e5;
    border: 1px solid #c4b5fd;
  }

  .dark .status-badge.primary {
    background-color: rgba(49, 46, 129, 0.4);
    color: #a5b4fc;
    border-color: rgba(49, 46, 129, 0.8);
  }

  /* Data card styling */
  .data-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    margin: 1.5rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .dark .data-card {
    border-color: #374151;
  }

  /* Summary grid styling */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .summary-card {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all 0.2s ease;
  }

  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .dark .summary-card {
    background-color: #1f2937;
    border-color: #374151;
  }

  .summary-header {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 0.5rem;
  }

  .dark .summary-header {
    color: #9ca3af;
  }

  .summary-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .summary-detail {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .dark .summary-detail {
    color: #6b7280;
  }

  /* Factors styling */
  .factors-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .factor-item {
    display: flex;
    align-items: flex-start;
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    gap: 0.75rem;
    transition: all 0.2s ease;
  }

  .factor-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .dark .factor-item {
    background-color: #1f2937;
    border-color: #374151;
  }

  .factor-icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .factor-content {
    flex: 1;
  }

  .factor-title {
    font-weight: 600;
    margin-bottom: 0.375rem;
    color: #111827;
  }

  .dark .factor-title {
    color: #f9fafb;
  }

  .factor-desc {
    font-size: 0.875rem;
    color: #4b5563;
    line-height: 1.4;
  }

  .dark .factor-desc {
    color: #9ca3af;
  }

  /* Recommendation panel styling */
  .rec-panel {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    margin: 1.5rem 0;
  }

  .dark .rec-panel {
    background-color: #1f2937;
    border-color: #374151;
  }

  .rec-header {
    background-color: #f3f4f6;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .dark .rec-header {
    background-color: #111827;
    border-color: #374151;
  }

  .rec-title {
    font-weight: 600;
    font-size: 1.125rem;
    color: #111827;
  }

  .dark .rec-title {
    color: #f9fafb;
  }

  .rec-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .dark .rec-subtitle {
    color: #9ca3af;
  }

  .rec-list {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .rec-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.375rem;
  }

  .rec-item.success {
    background-color: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .rec-item.warning {
    background-color: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .rec-item.info {
    background-color: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .dark .rec-item.success {
    background-color: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .dark .rec-item.warning {
    background-color: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .dark .rec-item.info {
    background-color: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .rec-item .rec-icon {
    font-size: 1.25rem;
  }

  .rec-item .rec-content {
    flex: 1;
    font-size: 0.9375rem;
    line-height: 1.4;
  }

  /* Param icon additional styles */
  .param-icon.performance {
    background-color: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .param-icon.health {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .param-icon.environment {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .param-icon.consistency {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .dark .param-icon.performance {
    background-color: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }

  .dark .param-icon.health {
    background-color: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  .dark .param-icon.environment {
    background-color: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .dark .param-icon.consistency {
    background-color: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  /* Value colors for new parameters */
  .value.performance {
    color: #f59e0b;
  }

  .value.health {
    color: #ef4444;
  }

  .value.environment {
    color: #10b981;
  }

  .value.consistency {
    color: #3b82f6;
  }

  .dark .value.performance {
    color: #fbbf24;
  }

  .dark .value.health {
    color: #f87171;
  }

  .dark .value.environment {
    color: #34d399;
  }

  .dark .value.consistency {
    color: #60a5fa;
  }
`;

interface LabAITabProps {
  selectedAnimal: string;
  theme: any;
  darkMode: boolean;
  onSelectAnimal?: (animal: string) => void;
}

const LabAITab: React.FC<LabAITabProps> = ({ selectedAnimal, theme, darkMode, onSelectAnimal }) => {
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cvData, setCvData] = useState<any>(null);
  
  // Animal icons mapping
  const animalIcons = {
    sapi: '🐄',
    ayam: '🐔',
    kambing: '🐐'
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSensorData();
        const filteredData = data.filter(item => 
          item.ternak?.toLowerCase() === selectedAnimal.toLowerCase()
        );
        setSensorData(filteredData);
        
        // Simulasi data aktivitas ternak dari kamera (CV)
        // Ini bisa diganti dengan API call asli ke endpoint CV jika tersedia
        setCvData({
          aktivitas: `Terdeteksi ${Math.floor(Math.random() * 5) + 1} ${selectedAnimal}`,
          confidence: Math.random().toFixed(2)
        });
        
        setError(null);
      } catch (err) {
        console.error('Error loading sensor data:', err);
        setError('Failed to load sensor data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedAnimal]);

  const generateReport = () => {
    setGeneratingReport(true);
    
    // Simulate report generation
    setTimeout(() => {
      const reportTypes = [
        {
          title: "Kondisi Kesehatan Ternak",
          content: `# 🩺 Laporan Kesehatan ${selectedAnimal.charAt(0).toUpperCase() + selectedAnimal.slice(1)}

<div class="report-header">
  <div class="status-badge success">STATUS: SEHAT</div>
  <div class="report-meta">${new Date().toLocaleDateString('id-ID')}</div>
</div>

> ### 💯 Kesimpulan Analisis
> ${selectedAnimal === 'sapi' ? 'Sapi' : selectedAnimal === 'kambing' ? 'Kambing' : 'Ayam'} dalam kondisi kesehatan yang **optimal**. Semua parameter vital berada dalam rentang normal dan tidak terdeteksi tanda-tanda risiko kesehatan.

## 📊 Vital Signs Monitor

<div class="health-monitor">
  <div class="monitor-header">
    <div class="monitor-title">Parameter Vital Ternak - Pemantauan Realtime</div>
    <div class="monitor-timestamp">Update terakhir: ${new Date().toLocaleTimeString('id-ID')}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Parameter</th>
        <th style="width: 25%;">Nilai</th>
        <th style="width: 25%;">Status</th>
        <th style="width: 25%;">Tren (24 jam)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon temp">🌡️</div>
            <div>
              <strong>Suhu Tubuh</strong>
              <div class="param-range">Normal: 36.5-39.5°C</div>
            </div>
          </div>
        </td>
        <td><span class="value temp">${(35 + Math.random() * 5).toFixed(1)}°C</span></td>
        <td><span class="badge success">✅ Normal</span></td>
        <td>
          <div class="trend">
            <div class="trend-chart">
              <div class="trend-line ${Math.random() > 0.5 ? 'up' : 'down'}"></div>
            </div>
            <div class="trend-value ${Math.random() > 0.5 ? 'up' : 'down'}">${Math.random() > 0.5 ? '↗️ +0.2°C' : '↘️ -0.3°C'}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon humidity">💧</div>
            <div>
              <strong>Kelembaban Lingkungan</strong>
              <div class="param-range">Optimal: 45-75%</div>
            </div>
          </div>
        </td>
        <td><span class="value humidity">${(50 + Math.random() * 30).toFixed(1)}%</span></td>
        <td><span class="badge success">✅ Optimal</span></td>
        <td>
          <div class="trend">
            <div class="trend-chart">
              <div class="trend-line ${Math.random() > 0.5 ? 'up' : 'down'}"></div>
            </div>
            <div class="trend-value ${Math.random() > 0.5 ? 'up' : 'down'}">${Math.random() > 0.5 ? '↗️ +2%' : '↘️ -1.5%'}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon air">🌬️</div>
            <div>
              <strong>Kualitas Udara</strong>
              <div class="param-range">Baik: <200 ppm</div>
            </div>
          </div>
        </td>
        <td><span class="value air">${(150 + Math.random() * 100).toFixed(0)} ppm</span></td>
        <td><span class="badge success">✅ Baik</span></td>
        <td>
          <div class="trend">
            <div class="trend-chart">
              <div class="trend-line ${Math.random() > 0.5 ? 'up' : 'down'}"></div>
            </div>
            <div class="trend-value ${Math.random() > 0.5 ? 'up' : 'down'}">${Math.random() > 0.5 ? '↗️ +15 ppm' : '↘️ -12 ppm'}</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon activity">🏃</div>
            <div>
              <strong>Tingkat Aktivitas</strong>
              <div class="param-range">Aktif: >5/10</div>
            </div>
          </div>
        </td>
        <td><span class="value activity">${Math.floor(Math.random() * 5) + 6}/10</span></td>
        <td><span class="badge success">✅ Aktif</span></td>
        <td>
          <div class="trend">
            <div class="trend-chart">
              <div class="trend-line ${Math.random() > 0.5 ? 'up' : 'neutral'}"></div>
            </div>
            <div class="trend-value ${Math.random() > 0.5 ? 'up' : 'neutral'}">${Math.random() > 0.5 ? '↗️ +1' : '→ Stabil'}</div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

## 🌡️ Tren Kesehatan 7 Hari Terakhir

<div class="trend-data">
  <div class="trend-header">Tracking Perubahan Parameter Vital - 7 Hari Terakhir</div>
  <div class="trend-item">
    <div class="trend-label">Suhu Tubuh:</div>
    <div class="trend-values">${Array.from({length: 7}, () => (35 + Math.random() * 5).toFixed(1)).join(' → ')}°C</div>
  </div>
  <div class="trend-item">
    <div class="trend-label">Kelembaban:</div>
    <div class="trend-values">${Array.from({length: 7}, () => (50 + Math.random() * 30).toFixed(0)).join(' → ')}%</div>
  </div>
  <div class="trend-item">
    <div class="trend-label">Kualitas Udara:</div>
    <div class="trend-values">${Array.from({length: 7}, () => (150 + Math.random() * 100).toFixed(0)).join(' → ')} ppm</div>
  </div>
</div>

## 🚨 ALERT: Parameter Kritis Yang Perlu Diperhatikan

<div class="alert-panel">
  <div class="alert-icon">✓</div>
  <div class="alert-content">
    <div class="alert-title">Tidak Ada Parameter Kritis</div>
    <div class="alert-message">Semua indikator menunjukkan stabilitas kondisi kandang dan kesehatan ternak yang optimal.</div>
  </div>
</div>

## 💊 Program Nutrisi & Suplemen
1. **Vitamin A & D3**: Diberikan setiap 3 bulan 
2. **Mineral Kompleks**: Tambahan pada pakan harian
3. **Probiotik**: Suplementasi mingguan untuk kesehatan pencernaan

## 🔍 Catatan Veteriner
${selectedAnimal === 'sapi' ? '- Kondisi kulit dan bulu sangat baik, menandakan nutrisi yang adekuat' : selectedAnimal === 'kambing' ? '- Kondisi kuku dalam keadaan baik dan tidak memerlukan pemotongan' : '- Kondisi jengger dan pial menunjukkan status kesehatan yang baik'}
- Pertahankan protokol biosekuriti yang sudah dilakukan
- Lanjutkan program vaksinasi sesuai jadwal

## 📝 Rekomendasi Preventif

<div class="recommendations">
  <div class="rec-item">
    <div class="rec-icon">🧹</div>
    <div class="rec-content">Pertahankan kondisi kandang yang bersih dan kering</div>
  </div>
  <div class="rec-item">
    <div class="rec-icon">💨</div>
    <div class="rec-content">Pastikan ventilasi udara tetap baik pada semua cuaca</div>
  </div>
  <div class="rec-item">
    <div class="rec-icon">🥗</div>
    <div class="rec-content">Berikan pakan berkualitas tinggi secara teratur</div>
  </div>
  <div class="rec-item">
    <div class="rec-icon">🩺</div>
    <div class="rec-content">Lakukan pemeriksaan rutin setiap minggu</div>
  </div>
</div>

---
<div class="report-footer">
  Laporan ini dihasilkan secara otomatis oleh Lab AI FACTS System pada ${new Date().toLocaleString('id-ID')}
</div>`
        },
        {
          title: "Analisis Produktivitas",
          content: `# 📈 Analisis Produktivitas ${selectedAnimal.charAt(0).toUpperCase() + selectedAnimal.slice(1)}

<div class="report-header">
  <div class="status-badge primary">RESUME DATA TERNAK</div>
  <div class="report-meta">${new Date().toLocaleDateString('id-ID')}</div>
</div>

> ### 💼 Ringkasan Produktivitas Ternak
> ${selectedAnimal === 'sapi' ? 'Produktivitas sapi' : selectedAnimal === 'kambing' ? 'Produktivitas kambing' : 'Produktivitas ayam'} menunjukkan **kondisi yang baik** berdasarkan data yang terkumpul. Tingkat aktivitas dan kondisi lingkungan mendukung performa ternak yang optimal.

## 📊 Indikator Produktivitas Ternak

<div class="data-card">
  <table>
    <thead>
      <tr>
        <th>Parameter</th>
        <th>Nilai</th>
        <th>Status</th>
        <th>Catatan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon performance">⚡</div>
            <div>
              <strong>Performa Harian</strong>
              <div class="param-range">Dari data aktivitas</div>
            </div>
          </div>
        </td>
        <td><span class="value performance">${Math.floor(Math.random() * 3) + 7}/10</span></td>
        <td><span class="badge success">Baik</span></td>
        <td>Berdasarkan tingkat aktivitas ternak</td>
      </tr>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon health">❤️</div>
            <div>
              <strong>Indeks Kesehatan</strong>
              <div class="param-range">Dari parameter vital</div>
            </div>
          </div>
        </td>
        <td><span class="value health">${Math.floor(Math.random() * 10) + 85}%</span></td>
        <td><span class="badge success">Sehat</span></td>
        <td>Dihitung dari suhu tubuh dan aktivitas</td>
      </tr>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon environment">🏠</div>
            <div>
              <strong>Kualitas Lingkungan</strong>
              <div class="param-range">Dari data kandang</div>
            </div>
          </div>
        </td>
        <td><span class="value environment">${Math.floor(Math.random() * 15) + 80}%</span></td>
        <td><span class="badge success">Optimal</span></td>
        <td>Berdasarkan kelembaban dan kualitas udara</td>
      </tr>
      <tr>
        <td>
          <div class="param-name">
            <div class="param-icon consistency">📆</div>
            <div>
              <strong>Konsistensi Data</strong>
              <div class="param-range">Dari jumlah data</div>
            </div>
          </div>
        </td>
        <td><span class="value consistency">${sensorData.length} titik</span></td>
        <td><span class="badge ${sensorData.length > 50 ? 'success' : sensorData.length > 20 ? 'warning' : 'error'}">${sensorData.length > 50 ? 'Baik' : sensorData.length > 20 ? 'Cukup' : 'Kurang'}</span></td>
        <td>Jumlah data yang tersedia untuk analisis</td>
      </tr>
    </tbody>
  </table>
</div>

## 📉 Rangkuman Data Ternak 

<div class="summary-grid">
  <div class="summary-card">
    <div class="summary-header">Suhu Tubuh</div>
    <div class="summary-value temp">${(sensorData.reduce((sum, item) => sum + (item.suhu || 37), 0) / (sensorData.length || 1)).toFixed(1)}°C</div>
    <div class="summary-detail">Rata-rata dari ${sensorData.length} data</div>
  </div>
  
  <div class="summary-card">
    <div class="summary-header">Kelembaban</div>
    <div class="summary-value humidity">${(sensorData.reduce((sum, item) => sum + (item.kelembaban || 60), 0) / (sensorData.length || 1)).toFixed(1)}%</div>
    <div class="summary-detail">Rata-rata dari ${sensorData.length} data</div>
  </div>
  
  <div class="summary-card">
    <div class="summary-header">Aktivitas</div>
    <div class="summary-value activity">${(sensorData.reduce((sum, item) => sum + (item.aktivitas || 7), 0) / (sensorData.length || 1)).toFixed(1)}/10</div>
    <div class="summary-detail">Rata-rata dari ${sensorData.length} data</div>
  </div>
  
  <div class="summary-card">
    <div class="summary-header">Kualitas Udara</div>
    <div class="summary-value air">${(sensorData.reduce((sum, item) => sum + (item.kualitas_udara || 180), 0) / (sensorData.length || 1)).toFixed(0)} ppm</div>
    <div class="summary-detail">Rata-rata dari ${sensorData.length} data</div>
  </div>
</div>

## 💡 Faktor Yang Mempengaruhi Produktivitas

<div class="factors-container">
  <div class="factor-item">
    <div class="factor-icon">🌡️</div>
    <div class="factor-content">
      <div class="factor-title">Suhu & Kelembaban</div>
      <div class="factor-desc">Kondisi suhu dan kelembaban yang optimal mendukung kesehatan dan produktivitas ternak.</div>
    </div>
  </div>
  
  <div class="factor-item">
    <div class="factor-icon">🥕</div>
    <div class="factor-content">
      <div class="factor-title">Pakan & Nutrisi</div>
      <div class="factor-desc">Pastikan pemberian pakan tepat jumlah dan terjadwal secara konsisten.</div>
    </div>
  </div>
  
  <div class="factor-item">
    <div class="factor-icon">🦠</div>
    <div class="factor-content">
      <div class="factor-title">Tingkat Stres & Kesehatan</div>
      <div class="factor-desc">Jaga tingkat stres rendah dan atasi potensi penyakit dengan cepat.</div>
    </div>
  </div>
  
  <div class="factor-item">
    <div class="factor-icon">👨‍🌾</div>
    <div class="factor-content">
      <div class="factor-title">Manajemen Ternak</div>
      <div class="factor-desc">Penanganan ternak secara tepat dan pemantauan rutin meningkatkan produktivitas.</div>
    </div>
  </div>
</div>

## 📝 Rekomendasi Berdasarkan Data

<div class="rec-panel">
  <div class="rec-header">
    <div class="rec-title">Rekomendasi Praktis</div>
    <div class="rec-subtitle">Berdasarkan ${sensorData.length} titik data ternak ${selectedAnimal}</div>
  </div>

  <div class="rec-list">
    ${sensorData.length > 0 && sensorData.some(item => (item.suhu || 0) > 39) ? 
      `<div class="rec-item warning">
        <div class="rec-icon">🌡️</div>
        <div class="rec-content">Perhatikan suhu kandang, terdapat beberapa titik data dengan suhu di atas normal</div>
      </div>` : 
      `<div class="rec-item success">
        <div class="rec-icon">🌡️</div>
        <div class="rec-content">Pertahankan suhu kandang saat ini yang sudah optimal</div>
      </div>`
    }
    
    ${sensorData.length > 0 && sensorData.some(item => (item.kelembaban || 0) > 80) ? 
      `<div class="rec-item warning">
        <div class="rec-icon">💧</div>
        <div class="rec-content">Tingkatkan ventilasi kandang untuk mengurangi kelembaban yang tinggi</div>
      </div>` : 
      `<div class="rec-item success">
        <div class="rec-icon">💧</div>
        <div class="rec-content">Kelembaban kandang sudah ideal, lanjutkan pemantauan rutin</div>
      </div>`
    }
    
    ${sensorData.length > 0 && sensorData.some(item => (item.kualitas_udara || 0) > 250) ? 
      `<div class="rec-item warning">
        <div class="rec-icon">🌬️</div>
        <div class="rec-content">Kualitas udara perlu diperbaiki, periksa ventilasi dan kebersihan kandang</div>
      </div>` : 
      `<div class="rec-item success">
        <div class="rec-icon">🌬️</div>
        <div class="rec-content">Kualitas udara kandang sudah baik, pertahankan kondisi ini</div>
      </div>`
    }
    
    ${sensorData.length < 30 ? 
      `<div class="rec-item info">
        <div class="rec-icon">📊</div>
        <div class="rec-content">Tambahkan lebih banyak data untuk analisis yang lebih akurat</div>
      </div>` : 
      `<div class="rec-item success">
        <div class="rec-icon">📊</div>
        <div class="rec-content">Jumlah data sudah cukup untuk analisis yang akurat</div>
      </div>`
    }
  </div>
</div>

---
<div class="report-footer">
  Laporan ini dibuat berdasarkan ${sensorData.length} titik data dari ${selectedAnimal} | ${new Date().toLocaleString('id-ID')}
</div>`
        },
        {
          title: "Laporan Nutrisi & Pakan",
          content: `# 🍽️ Laporan Nutrisi & Pakan ${selectedAnimal.charAt(0).toUpperCase() + selectedAnimal.slice(1)}

![Nutrition Badge](https://img.shields.io/badge/Nutrition-Optimal-success) ![Feed Efficiency Badge](https://img.shields.io/badge/Feed_Efficiency-High-blue)

> ### 🌿 Ringkasan Kesimpulan Nutrisi
> Pola konsumsi dan manajemen pakan ${selectedAnimal === 'sapi' ? 'sapi' : selectedAnimal === 'kambing' ? 'kambing' : 'ayam'} menunjukkan efisiensi **tinggi** dengan komposisi nutrisi yang seimbang. Konversi pakan ke produk sangat optimal dan melampaui standar industri.

## 📊 Analisis Konsumsi Pakan

| Parameter | Nilai | Status | Rekomendasi |
| --- | --- | --- | --- |
| **Konsumsi Harian** | ${selectedAnimal === 'sapi' ? '12-15' : selectedAnimal === 'kambing' ? '3-4' : '0.1-0.12'} kg/hari | ✅ Normal | Pertahankan |
| **Efisiensi Konversi** | ${(65 + Math.random() * 25).toFixed(1)}% | ${Math.random() > 0.7 ? '⭐⭐⭐⭐⭐' : '⭐⭐⭐⭐'} | Tingkatkan enzim pencernaan |
| **Rasio Pakan:Produk** | 1:${(selectedAnimal === 'ayam' ? 0.35 : 0.8) + Math.random() * 0.2} | ✅ Efisien | Tambah probiotik |
| **Biaya per Kg Pakan** | Rp ${selectedAnimal === 'sapi' ? 3200 : selectedAnimal === 'kambing' ? 3500 : 5000} | 📊 Standar | Evaluasi supplier alternatif |

## 🧪 Komposisi Nutrisi Optimal

${'```'}
┌────────────────────────────────────────────────────┐
│                                              ┌───┐ │
│ Protein [${selectedAnimal === 'sapi' ? '16-18%' : selectedAnimal === 'kambing' ? '14-16%' : '18-20%'}]  ████████████████████      │   │ │
│                                              │   │ │
│ Serat [${selectedAnimal === 'sapi' ? '18-22%' : selectedAnimal === 'kambing' ? '15-20%' : '3-5%'}]    ███████████████████████     │   │ │
│                                              │   │ │
│ Lemak [${selectedAnimal === 'sapi' ? '3-5%' : selectedAnimal === 'kambing' ? '3-4%' : '4-6%'}]     ██████                     │ R │ │
│                                              │ e │ │
│ Mineral [${selectedAnimal === 'sapi' ? '5-7%' : selectedAnimal === 'kambing' ? '4-6%' : '3-4%'}]   ████████                   │ q │ │
│                                              │ u │ │
│ Vitamin     █████                            │ i │ │
│                                              │ r │ │
│ Lainnya     ███                              │ e │ │
│                                              │ d │ │
└────────────────────────────────────────────────────┘
${'```'}

## 🍃 Sumber Bahan Pakan Premium
1. **Hijauan Utama**: ${selectedAnimal === 'sapi' ? 'Rumput Gajah, Alfalfa' : selectedAnimal === 'kambing' ? 'Daun Gamal, Rumput Benggala' : 'Jagung Berkualitas, Bekatul'}
2. **Konsentrat**: ${selectedAnimal === 'sapi' ? 'Dedak Padi, Ampas Tahu' : selectedAnimal === 'kambing' ? 'Bungkil Kelapa, Dedak' : 'Bungkil Kedelai, Tepung Ikan'}
3. **Suplemen**: Mineral kompleks, Vitamin A-D-E, Probiotik
4. **Cairan**: Air bersih ad libitum dengan suplementasi elektrolit berkala

## 📈 Program Pakan Berdasarkan Fase Produksi

| Fase | Komposisi Pakan | Frekuensi | Jumlah |
| --- | --- | --- | --- |
| **${selectedAnimal === 'sapi' ? 'Laktasi Awal' : selectedAnimal === 'kambing' ? 'Laktasi' : 'Masa Bertelur Puncak'}** | Protein ${selectedAnimal === 'sapi' ? '18%' : selectedAnimal === 'kambing' ? '16%' : '20%'}, Serat ${selectedAnimal === 'sapi' ? '18%' : selectedAnimal === 'kambing' ? '15%' : '3%'} | ${selectedAnimal === 'ayam' ? '3-4x' : '2-3x'}/hari | ${selectedAnimal === 'sapi' ? '15' : selectedAnimal === 'kambing' ? '4' : '0.12'} kg/hari |
| **${selectedAnimal === 'sapi' ? 'Laktasi Tengah' : selectedAnimal === 'kambing' ? 'Pemeliharaan' : 'Masa Bertelur Normal'}** | Protein ${selectedAnimal === 'sapi' ? '16%' : selectedAnimal === 'kambing' ? '14%' : '18%'}, Serat ${selectedAnimal === 'sapi' ? '20%' : selectedAnimal === 'kambing' ? '18%' : '4%'} | ${selectedAnimal === 'ayam' ? '3x' : '2x'}/hari | ${selectedAnimal === 'sapi' ? '12' : selectedAnimal === 'kambing' ? '3' : '0.10'} kg/hari |
| **${selectedAnimal === 'sapi' ? 'Kering' : selectedAnimal === 'kambing' ? 'Bunting' : 'Molting'}** | Protein ${selectedAnimal === 'sapi' ? '14%' : selectedAnimal === 'kambing' ? '15%' : '16%'}, Serat ${selectedAnimal === 'sapi' ? '22%' : selectedAnimal === 'kambing' ? '20%' : '5%'} | ${selectedAnimal === 'ayam' ? '2x' : '2x'}/hari | ${selectedAnimal === 'sapi' ? '10' : selectedAnimal === 'kambing' ? '3.5' : '0.08'} kg/hari |

## 💧 Manajemen Air Minum
* **Konsumsi Optimal**: ${selectedAnimal === 'sapi' ? '40-60' : selectedAnimal === 'kambing' ? '3-9' : '0.2-0.3'} liter/hari
* **Suhu Air Ideal**: 15-20°C
* **Kualitas**: TDS < 1000 ppm, pH 6.5-7.5
* **Akses**: 24 jam non-stop

## 📝 Rekomendasi Strategis Pakan
1. 🌿 Tingkatkan porsi hijauan segar untuk asupan vitamin alami dan serat
2. 🧂 Tambahkan suplemen mineral spesifik sesuai analisis tanah lokal
3. 💧 Pastikan akses air bersih selalu tersedia dengan sistem nipple/waterer otomatis
4. 🌦️ Sesuaikan formula pakan dengan perubahan musim (lebih banyak energi saat cuaca dingin)

## 🔄 Siklus Rotasi Pakan
Implementasikan rotasi bahan pakan setiap ${selectedAnimal === 'sapi' ? '14' : selectedAnimal === 'kambing' ? '21' : '7'} hari untuk mencegah kebosanan dan memaksimalkan asupan nutrisi bervariasi.

---
*Laporan ini dihasilkan secara otomatis oleh Lab AI FACTS System pada ${new Date().toLocaleString('id-ID')}*`
        }
      ];
      
      setActiveReport(reportTypes[Math.floor(Math.random() * reportTypes.length)].content);
      setGeneratingReport(false);
    }, 3000);
  };

  const handleSelectAnimal = (animal: string) => {
    if (onSelectAnimal) {
      onSelectAnimal(animal);
    }
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">{animalIcons[selectedAnimal as keyof typeof animalIcons]}</div>
    <div>
          <h2 className="text-2xl font-bold mb-1">Lab AI Analysis</h2>
          <p className="text-sm opacity-70">Analisis AI untuk {selectedAnimal} berdasarkan data sensor & kamera</p>
        </div>
        <div className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-medium">
          <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Powered by Gemini AI</span>
        </div>
      </div>
      
      {/* Tambahkan komponen AI Analysis yang sudah terkoneksi dengan Google Gemini */}
      <AIAnalysisCard 
        selectedAnimal={selectedAnimal} 
        sensorData={sensorData.length > 0 ? sensorData[0] : null}
        cvData={cvData}
        theme={theme}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="dashboard-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold flex items-center gap-2">
              <FiBarChart2 className="text-primary" />
              <span>Data Sensor Terbaru</span>
            </h3>
          </div>
          <div className="p-4">
      {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
        </div>
            ) : sensorData.length === 0 ? (
              <div className="text-center p-4">
                <p className="opacity-70">Tidak ada data sensor untuk {selectedAnimal}</p>
        </div>
      ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="stats-card">
                    <div className="stats-icon temp">🌡️</div>
                    <div className="stats-content">
                      <div className="stats-value">{sensorData[0].suhu?.toFixed(1) || 'N/A'}°C</div>
                      <div className="stats-label">Suhu</div>
                  </div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-icon humidity">💧</div>
                    <div className="stats-content">
                      <div className="stats-value">{sensorData[0].kelembaban?.toFixed(1) || sensorData[0].kelembapan?.toFixed(1) || 'N/A'}%</div>
                      <div className="stats-label">Kelembaban</div>
                </div>
                  </div>
                  <div className="stats-card">
                    <div className="stats-icon air">🌬️</div>
                    <div className="stats-content">
                      <div className="stats-value">{sensorData[0].kualitas_udara?.toFixed(0) || 'N/A'} ppm</div>
                      <div className="stats-label">Kualitas Udara</div>
                  </div>
                </div>
                  <div className="stats-card">
                    <div className="stats-icon time">⏱️</div>
                    <div className="stats-content">
                      <div className="stats-value">{new Date(sensorData[0].timestamp).toLocaleTimeString()}</div>
                      <div className="stats-label">Update Terakhir</div>
                  </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
          
        <div className="dashboard-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold flex items-center gap-2">
              <FiFileText className="text-primary" />
              <span>Reports</span>
                  </h3>
                </div>
          <div className="p-4">
            <div className="space-y-4">
              <p className="text-sm opacity-70">
                Pilih jenis laporan untuk melihat analisis detail tentang ternak Anda
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  className="report-card"
                  onClick={() => generateReport()}
                  disabled={generatingReport}
                >
                  <div className="report-icon health">🩺</div>
                  <div className="report-content">
                    <div className="report-title">Laporan Kesehatan</div>
                    <div className="report-desc">Analisis kondisi kesehatan ternak</div>
                </div>
                </button>
                
                <button
                  className="report-card"
                  onClick={() => generateReport()}
                  disabled={generatingReport}
                >
                  <div className="report-icon productivity">📈</div>
                  <div className="report-content">
                    <div className="report-title">Analisis Produktivitas</div>
                    <div className="report-desc">Metrik kinerja & performa ternak</div>
                  </div>
                </button>
              </div>
              
              {generatingReport && (
                <div className="text-center py-3">
                  <div className="inline-block animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                  <span>Generating report...</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* ... existing code ... */}
    </div>
  );
};

export default LabAITab;
