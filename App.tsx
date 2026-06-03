import React, { useState, useEffect } from 'react';
import { Activity, FileText, TrendingUp, Zap, BarChart3, Info, Moon, Sun, Palette, MessageSquare, Wifi, WifiOff, Settings, Cpu } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { AnalysisResult } from './components/AnalysisResult';
import { MeasurementHistory } from './components/HistoryLog';
import { ExhaustDetails } from './components/ExhaustDetails';
import { ChatBot } from './components/ChatBot';
import { LocalAiSettingsModal } from './components/LocalAiSettingsModal';
import { Exhaust, PollutantData, AIAnalysisResult, TabType } from './types';
import { INITIAL_EXHAUSTS } from './constants';
import { generateExhaustAnalysis } from './services/geminiService';
import { useSettings, AccentColor } from './contexts/SettingsContext';
import { AppLogo } from './components/AppLogo';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType | 'chat'>('dashboard');
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  
  // Initialize state from LocalStorage or fallback to constants
  const [exhausts, setExhausts] = useState<Exhaust[]>(() => {
    try {
      const saved = localStorage.getItem('ecomonitor_exhausts');
      return saved ? JSON.parse(saved) : INITIAL_EXHAUSTS;
    } catch (e) {
      console.error("Failed to load from local storage", e);
      return INITIAL_EXHAUSTS;
    }
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Real-time AI filtering states
  const [filteredExhausts, setFilteredExhausts] = useState<Exhaust[] | null>(null);
  const [aiFilterExplanation, setAiFilterExplanation] = useState<string | null>(null);
  
  // Navigation visual state
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { theme, toggleTheme, language, toggleLanguage, t, dir, accentColor, setAccentColor, themeColors, localAiSettings } = useSettings();

  // Persist data when changed
  useEffect(() => {
    localStorage.setItem('ecomonitor_exhausts', JSON.stringify(exhausts));
  }, [exhausts]);

  // Monitor Network Status
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
  
  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddData = (exhaustId: string, newData: PollutantData, period: string) => {
    const timestamp = new Date().toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US');

    setExhausts(prev => prev.map(exhaust => {
      if (exhaust.id === parseInt(exhaustId)) {
        return {
          ...exhaust,
          data: newData,
          lastCheck: timestamp,
          history: [
            ...exhaust.history, 
            {
                period: period,
                date: timestamp,
                data: newData
            }
          ]
        };
      }
      return exhaust;
    }));
    setActiveTab('details');
  };

  const handleAddExhaust = (name: string, location: string) => {
    const newId = exhausts.length > 0 ? Math.max(...exhausts.map(e => e.id)) + 1 : 1;
    const newExhaust: Exhaust = {
      id: newId,
      name,
      location,
      data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 0, O2: 0 },
      history: [],
      lastCheck: 'ثبت نشده'
    };
    setExhausts(prev => [...prev, newExhaust]);
  };

  const handleImportData = (data: Exhaust[]) => {
      setExhausts(data);
  };

  const handleAnalyze = async (exhaust: Exhaust, switchTab: boolean = true) => {
    const canAnalyzeOffline = localAiSettings.mode === 'ollama' || localAiSettings.mode === 'huggingface';
    if (!isOnline && !canAnalyzeOffline) {
      alert(t('error.offlineDesc'));
      return;
    }

    setIsAnalyzing(true);
    try {
      const resultText = await generateExhaustAnalysis(exhaust);
      setAiAnalysis({
        exhaustId: exhaust.id,
        analysis: resultText,
        timestamp: new Date().toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US')
      });
      if (switchTab) setActiveTab('analysis');
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Activity },
    { id: 'details', label: t('nav.details'), icon: Info },
    { id: 'data-entry', label: t('nav.dataEntry'), icon: FileText },
    { id: 'chat', label: t('nav.chat'), icon: MessageSquare },
    { id: 'history', label: t('nav.history'), icon: BarChart3 }
  ];

  const colors: { id: AccentColor; bg: string }[] = [
    { id: 'blue', bg: 'bg-blue-600' },
    { id: 'emerald', bg: 'bg-emerald-600' },
    { id: 'violet', bg: 'bg-violet-600' },
    { id: 'amber', bg: 'bg-amber-600' },
    { id: 'rose', bg: 'bg-rose-600' },
  ];

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-slate-900 dark:to-black text-slate-900 dark:text-white transition-colors duration-300" 
      dir={dir}
      style={{
        '--theme-primary': themeColors.primary,
        '--theme-hover': themeColors.hover,
        '--theme-light': themeColors.light,
        '--theme-text': themeColors.text,
      } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-8 pb-20 md:pb-8">
        
        {/* Header */}
        <header className="mb-6 md:mb-10 animate-in slide-in-from-top-5 duration-700">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 md:p-8 shadow-xl dark:shadow-slate-900/20 border border-gray-200 dark:border-slate-700 relative overflow-hidden transition-all duration-300">
             <div 
               className="absolute top-0 right-0 w-full h-full opacity-0 dark:opacity-20 pointer-events-none transition-colors duration-500"
               style={{ background: `linear-gradient(to right, ${themeColors.primary}, transparent)` }}
             />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-inner flex items-center justify-center shrink-0">
                  <AppLogo size={62} animated={true} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-2 tracking-tight flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start">
                    <span>{t('app.title')}</span>
                    <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.hover})` }}>EcoMonitor AI</span>
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-xs md:text-sm max-w-2xl">
                    {t('app.subtitle')}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div 
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs md:text-sm font-bold transition-all w-full sm:w-auto ${
                    isOnline 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  }`}
                >
                  {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                  <span>{isOnline ? t('status.online') : t('status.offline')}</span>
                </div>

                <div className="flex w-full sm:w-auto justify-center gap-2">
                    <div className="flex items-center gap-1.5 p-2 bg-gray-100 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                        <Palette size={16} className="text-slate-500 ml-1 hidden sm:block" />
                        {colors.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setAccentColor(c.id)}
                                className={`w-5 h-5 md:w-6 md:h-6 rounded-full transition-transform hover:scale-110 ${c.bg} ${accentColor === c.id ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2.5 md:p-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={toggleLanguage} className="p-2.5 md:p-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 font-bold w-12 text-sm">
                            {language === 'fa' ? 'En' : 'فا'}
                        </button>
                        <button 
                            onClick={() => setShowGlobalSettings(true)} 
                            className="p-2.5 md:p-3 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all text-slate-700 dark:text-slate-300"
                            title={language === 'fa' ? 'تنظیمات هوش مصنوعی' : 'AI Settings'}
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="hidden xl:flex items-center gap-3 bg-blue-50 dark:bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-blue-100 dark:border-white/10">
                    <Zap className="text-amber-500 dark:text-yellow-400 fill-amber-500 dark:fill-yellow-400" />
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{t('gemini.powered')}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav 
          className={`
            flex flex-row items-center gap-2 mb-6 
            backdrop-blur-xl sticky top-2 z-50 
            overflow-x-auto custom-scrollbar scroll-smooth
            transition-all duration-500 border
            ${isScrolled 
              ? 'bg-white/95 dark:bg-slate-800/95 shadow-2xl border-gray-300 dark:border-slate-600 p-1.5 md:p-2 rounded-2xl md:rounded-[2rem] mx-0 md:mx-auto md:max-w-4xl' 
              : 'bg-white/60 dark:bg-slate-900/50 shadow-lg border-gray-200 dark:border-slate-800 p-2 md:p-3 rounded-2xl w-full'}
          `}
        >
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 min-w-[auto] md:min-w-[120px] rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap
                ${isScrolled ? 'py-2.5 px-3 text-xs md:text-sm' : 'py-3 px-4 md:py-4 md:px-6 text-xs md:text-base'}
                ${activeTab === tab.id 
                  ? 'text-white shadow-md scale-[1.02]' 
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
              style={activeTab === tab.id ? { backgroundColor: themeColors.primary, boxShadow: `0 4px 12px ${themeColors.primary}40` } : {}}
            >
              <tab.icon size={isScrolled ? 16 : 20} strokeWidth={2.5} className="shrink-0" />
              <span className={isScrolled ? 'hidden sm:inline' : 'inline'}>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Dynamic AI Filter Badge banner */}
        {filteredExhausts !== null && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl shrink-0 flex items-center justify-center">
                <Cpu size={20} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">فیلتر استخراج هوشمند فعال است</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  برنامه در حال نمایش {filteredExhausts.length} دودکش منتخب بر اساس فیلتر استخراج هوش مصنوعی است. کلینیک تحلیل، نمودارها و شاخص‌های برنامه منطبق بر این فیلتر تغییر کرده‌اند.
                </p>
                {aiFilterExplanation && (
                  <div className="text-[11px] bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-xl mt-2 text-slate-700 dark:text-slate-300 max-h-[140px] overflow-y-auto leading-relaxed custom-scrollbar">
                    {aiFilterExplanation}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setFilteredExhausts(null);
                setAiFilterExplanation(null);
              }}
              className="text-xs font-bold text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/20 px-4 py-2 border border-red-200 dark:border-rose-800 rounded-xl whitespace-nowrap"
            >
              حذف فیلتر هوشمند
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="min-h-[500px]">
          {activeTab === 'dashboard' && (
            <Dashboard exhausts={filteredExhausts || exhausts} onAnalyze={(e) => handleAnalyze(e, true)} isAnalyzing={isAnalyzing} isOnline={isOnline} />
          )}
          {activeTab === 'details' && (
            <ExhaustDetails exhausts={filteredExhausts || exhausts} aiAnalysis={aiAnalysis} isAnalyzing={isAnalyzing} onAnalyze={handleAnalyze} isOnline={isOnline} />
          )}
          {activeTab === 'data-entry' && (
            <DataEntry 
              exhausts={exhausts} 
              onAddData={handleAddData} 
              onAddExhaust={handleAddExhaust} 
              onImportData={handleImportData}
              filteredExhausts={filteredExhausts}
              onSetFilteredExhausts={setFilteredExhausts}
              aiFilterExplanation={aiFilterExplanation}
              onSetAiFilterExplanation={setAiFilterExplanation}
            />
          )}
          {activeTab === 'analysis' && (
            <AnalysisResult analysis={aiAnalysis} exhausts={filteredExhausts || exhausts} onBack={() => setActiveTab('dashboard')} />
          )}
          {activeTab === 'chat' && <ChatBot isOnline={isOnline} />}
          {activeTab === 'history' && <MeasurementHistory exhausts={filteredExhausts || exhausts} />}
        </main>
      </div>

      {/* Global AI Settings Modal */}
      <LocalAiSettingsModal 
        isOpen={showGlobalSettings} 
        onClose={() => setShowGlobalSettings(false)} 
      />
    </div>
  );
};

export default App;