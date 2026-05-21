import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalAiSettings, getLocalAiSettings, saveLocalAiSettings } from '../services/localAiService';

type Theme = 'light' | 'dark';
type Language = 'fa' | 'en';
export type AccentColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  accentColor: AccentColor;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  setAccentColor: (color: AccentColor) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  themeColors: { primary: string; hover: string; light: string; text: string };
  localAiSettings: LocalAiSettings;
  updateLocalAiSettings: (settings: LocalAiSettings) => void;
}

const translations: Record<string, Record<Language, string>> = {
  // App Header & Nav
  'app.title': { fa: 'سامانه هوشمند', en: 'Smart System' },
  'app.subtitle': { fa: 'پایش لحظه‌ای آلاینده‌های صنعتی منطبق با استانداردهای ISO 14001', en: 'Real-time industrial emission monitoring compliant with ISO 14001' },
  'nav.dashboard': { fa: 'داشبورد وضعیت', en: 'Dashboard' },
  'nav.details': { fa: 'جزئیات اگزوز', en: 'Exhaust Details' },
  'nav.dataEntry': { fa: 'مدیریت داده‌ها', en: 'Data Management' },
  'nav.analysis': { fa: 'تحلیل هوشمند', en: 'AI Analysis' },
  'nav.history': { fa: 'روند کلی', en: 'History' },
  'nav.chat': { fa: 'گفتگوی هوشمند', en: 'AI Chat' },
  'nav.visualizer': { fa: 'تصویرساز هوشمند', en: 'AI Visualizer' },
  'gemini.powered': { fa: 'Gemini 3 Powered', en: 'Powered by Gemini 3' },

  // Generic
  'loading': { fa: 'در حال تحلیل...', en: 'Analyzing...' },
  'location': { fa: 'موقعیت', en: 'Location' },
  'lastCheck': { fa: 'آخرین بررسی', en: 'Last Check' },
  'period': { fa: 'دوره پایش', en: 'Monitoring Period' },
  'date': { fa: 'تاریخ', en: 'Date' },
  'standard': { fa: 'حد', en: 'Limit' },
  'normal': { fa: 'نرمال', en: 'Normal' },
  
  // Connectivity
  'status.online': { fa: 'آنلاین', en: 'Online' },
  'status.offline': { fa: 'آفلاین', en: 'Offline' },
  'error.offline': { fa: 'عدم دسترسی به اینترنت', en: 'No Internet Connection' },
  'error.offlineDesc': { fa: 'برای استفاده از قابلیت‌های هوش مصنوعی، لطفاً به اینترنت متصل شوید.', en: 'Please connect to the internet to use AI features.' },
  
  // Exhaust Details
  'details.notFound': { fa: 'هیچ اگزوزی یافت نشد.', en: 'No exhaust found.' },
  'details.list': { fa: 'لیست اگزوزها', en: 'Exhaust List' },
  'details.charts': { fa: 'نمودارها', en: 'Charts' },
  'details.combustion': { fa: 'گازهای احتراقی (CO, NOx)', en: 'Combustion Gases (CO, NOx)' },
  'details.oxygen': { fa: 'میزان اکسیژن (O2)', en: 'Oxygen Level (O2)' },
  'details.particles': { fa: 'ذرات معلق (PM)', en: 'Particulate Matter (PM)' },
  'details.so2': { fa: 'دی‌اکسید گوگرد (SO2)', en: 'Sulfur Dioxide (SO2)' },
  'details.tableTitle': { fa: 'جدول سوابق اندازه‌گیری', en: 'Measurement History Table' },
  'details.tableDesc': { fa: 'مقادیر ثبت شده در دوره‌های فصلی به همراه حد استاندارد', en: 'Recorded values per season with standard limits' },
  'details.aiTitle': { fa: 'تحلیل هوشمند وضعیت', en: 'AI Status Analysis' },
  'details.aiGenerated': { fa: 'تولید شده در', en: 'Generated at' },
  'details.noReport': { fa: 'هنوز گزارشی برای این اگزوز تولید نشده است.', en: 'No report generated yet.' },
  'details.analyzeBtn': { fa: 'تحلیل پیشرفته با AI', en: 'Advanced AI Analysis' },
  'details.reAnalyzeBtn': { fa: 'تحلیل مجدد وضعیت', en: 'Re-analyze Status' },
  'details.getAnalysisBtn': { fa: 'دریافت تحلیل هوشمند', en: 'Get AI Analysis' },

  // Chat & Visualizer
  'chat.welcome': { fa: 'سلام! من دستیار هوشمند شما هستم. می‌توانید سوالات فنی خود را در مورد بویلرها، استانداردها و رفع عیب سیستم بپرسید.', en: 'Hello! I am your AI assistant. You can ask technical questions about boilers, standards, and troubleshooting.' },
  'chat.placeholder': { fa: 'سوال خود را بپرسید...', en: 'Ask your question...' },
  'chat.offlinePlaceholder': { fa: 'اتصال اینترنت برقرار نیست', en: 'No internet connection' },
  'chat.send': { fa: 'ارسال', en: 'Send' },
  'chat.clear': { fa: 'شروع مجدد', en: 'New Chat' },
  'chat.thinking': { fa: 'در حال تحلیل عمیق...', en: 'Thinking deeply...' },
  'viz.title': { fa: 'تصویرساز صنعتی', en: 'Industrial Visualizer' },
  'viz.subtitle': { fa: 'تولید تصاویر سه‌بعدی و دیاگرام‌های فنی با مدل Gemini 3 Pro Image', en: 'Generate 3D models and technical diagrams with Gemini 3 Pro Image' },
  'viz.promptPlaceholder': { fa: 'توصیف تصویر مورد نظر را بنویسید (مثلاً: مدل سه بعدی مشعل بویلر با شعله آبی)...', en: 'Describe the image (e.g., 3D model of a boiler burner with blue flame)...' },
  'viz.generate': { fa: 'تولید تصویر', en: 'Generate Image' },
  'viz.aspectRatio': { fa: 'نسبت تصویر', en: 'Aspect Ratio' },
  'viz.selectKey': { fa: 'انتخاب کلید API (الزامی)', en: 'Select API Key (Required)' },

  // Pollutants
  'pol.CO': { fa: 'مونوکسید کربن', en: 'Carbon Monoxide' },
  'pol.NOx': { fa: 'اکسیدهای نیتروژن', en: 'Nitrogen Oxides' },
  'pol.SO2': { fa: 'دی‌اکسید گوگرد', en: 'Sulfur Dioxide' },
  'pol.PM': { fa: 'ذرات معلق', en: 'Particulate Matter' },
  'pol.O2': { fa: 'اکسیژن', en: 'Oxygen' },
  'pol.CO2': { fa: 'دی‌اکسید کربن', en: 'Carbon Dioxide' },
  
  // Colors
  'color.blue': { fa: 'آبی', en: 'Blue' },
  'color.emerald': { fa: 'زمردی', en: 'Emerald' },
  'color.violet': { fa: 'بنفش', en: 'Violet' },
  'color.amber': { fa: 'کهربایی', en: 'Amber' },
  'color.rose': { fa: 'سرخ', en: 'Rose' },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('fa');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [localAiSettings, setLocalAiSettings] = useState<LocalAiSettings>(() => getLocalAiSettings());

  const updateLocalAiSettings = (newSettings: LocalAiSettings) => {
    setLocalAiSettings(newSettings);
    saveLocalAiSettings(newSettings);
  };

  useEffect(() => {
    // Apply Theme
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Apply Language Direction
    const root = window.document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'fa' ? 'rtl' : 'ltr');
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fa' ? 'en' : 'fa');
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const getThemeColors = () => {
    switch(accentColor) {
        case 'emerald': return { primary: '#059669', hover: '#047857', light: '#ecfdf5', text: '#065f46' };
        case 'violet': return { primary: '#7c3aed', hover: '#6d28d9', light: '#f5f3ff', text: '#5b21b6' };
        case 'amber': return { primary: '#d97706', hover: '#b45309', light: '#fffbeb', text: '#92400e' };
        case 'rose': return { primary: '#e11d48', hover: '#be123c', light: '#fff1f2', text: '#9f1239' };
        default: return { primary: '#2563eb', hover: '#1d4ed8', light: '#eff6ff', text: '#1e40af' }; // blue
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      theme, 
      language, 
      accentColor,
      toggleTheme, 
      toggleLanguage, 
      setAccentColor,
      t,
      dir: language === 'fa' ? 'rtl' : 'ltr',
      themeColors: getThemeColors(),
      localAiSettings,
      updateLocalAiSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};