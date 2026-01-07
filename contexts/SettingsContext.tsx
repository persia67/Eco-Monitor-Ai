import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Language = 'fa' | 'en';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
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
  'gemini.powered': { fa: 'Gemini 3 Powered', en: 'Powered by Gemini 3' },

  // Generic
  'loading': { fa: 'در حال تحلیل...', en: 'Analyzing...' },
  'location': { fa: 'موقعیت', en: 'Location' },
  'lastCheck': { fa: 'آخرین بررسی', en: 'Last Check' },
  'period': { fa: 'دوره پایش', en: 'Monitoring Period' },
  'date': { fa: 'تاریخ', en: 'Date' },
  'standard': { fa: 'حد', en: 'Limit' },
  'normal': { fa: 'نرمال', en: 'Normal' },
  
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

  // Pollutants
  'pol.CO': { fa: 'مونوکسید کربن', en: 'Carbon Monoxide' },
  'pol.NOx': { fa: 'اکسیدهای نیتروژن', en: 'Nitrogen Oxides' },
  'pol.SO2': { fa: 'دی‌اکسید گوگرد', en: 'Sulfur Dioxide' },
  'pol.PM': { fa: 'ذرات معلق', en: 'Particulate Matter' },
  'pol.O2': { fa: 'اکسیژن', en: 'Oxygen' },
  'pol.CO2': { fa: 'دی‌اکسید کربن', en: 'Carbon Dioxide' },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('fa');

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

  return (
    <SettingsContext.Provider value={{ 
      theme, 
      language, 
      toggleTheme, 
      toggleLanguage, 
      t,
      dir: language === 'fa' ? 'rtl' : 'ltr'
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