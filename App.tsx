import React, { useState, useEffect, useRef } from 'react';
import { Activity, FileText, TrendingUp, Menu, Zap, BarChart3, Info, Moon, Sun, Languages, Palette, MessageSquare, Wifi, WifiOff, Database } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { AnalysisResult } from './components/AnalysisResult';
import { MeasurementHistory } from './components/HistoryLog';
import { ExhaustDetails } from './components/ExhaustDetails';
import { ChatBot } from './components/ChatBot';
import { Exhaust, PollutantData, AIAnalysisResult, TabType, QueueItem } from './types';
import { INITIAL_EXHAUSTS } from './constants';
import { generateExhaustAnalysis } from './services/geminiService';
import { useSettings, AccentColor } from './contexts/SettingsContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType | 'chat'>('dashboard');
  
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

  // Offline Queue State
  const [offlineQueue, setOfflineQueue] = useState<QueueItem[]>(() => {
    try {
      const saved = localStorage.getItem('ecomonitor_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Navigation visual state
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { theme, toggleTheme, language, toggleLanguage, t, dir, accentColor, setAccentColor, themeColors } = useSettings();

  // Persist data when changed
  useEffect(() => {
    localStorage.setItem('ecomonitor_exhausts', JSON.stringify(exhausts));
  }, [exhausts]);

  // Persist queue when changed
  useEffect(() => {
    localStorage.setItem('ecomonitor_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Monitor Network Status and Sync
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

  // Sync logic
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
        // Sync queue to main state
        setExhausts(prev => {
            let nextState = [...prev];
            offlineQueue.forEach(item => {
                nextState = nextState.map(ex => {
                    if (ex.id === parseInt(item.exhaustId)) {
                        return {
                            ...ex,
                            data: item.data,
                            lastCheck: item.timestamp,
                            history: [
                                ...ex.history, 
                                {
                                    period: item.period,
                                    date: item.timestamp,
                                    data: item.data
                                }
                            ]
                        };
                    }
                    return ex;
                });
            });
            return nextState;
        });

        // Clear queue
        setOfflineQueue([]);
        alert(t('queue.synced'));
    }
  }, [isOnline, offlineQueue, t]);
  
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

    if (!isOnline) {
        // Add to offline queue
        const queueItem: QueueItem = {
            id: Date.now().toString(),
            exhaustId,
            data: newData,
            period,
            timestamp
        };
        setOfflineQueue(prev => [...prev, queueItem]);
        alert(t('queue.added'));
        return;
    }

    // Standard online behavior
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
    if (!isOnline) {
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
    { id: 'analysis', label: t('nav.analysis'), icon: TrendingUp },
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
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <header className="mb-10 animate-in slide-in-from-top-5 duration-700">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-slate-900/20 border border-gray-200 dark:border-slate-700 relative overflow-hidden transition-all duration-300">
             {/* Gradient Background based on Theme */}
             <div 
               className="absolute top-0 right-0 w-full h-full opacity-0 dark:opacity-20 pointer-events-none transition-colors duration-500"
               style={{ background: `linear-gradient(to right, ${themeColors.primary}, transparent)` }}
             />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                  {t('app.title')} <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.hover})` }}>EcoMonitor</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-lg max-w-2xl">
                  {t('app.subtitle')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                
                {/* Online Status Indicator & Queue Count */}
                <div 
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                    isOnline 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  }`}
                  title={isOnline ? t('status.online') : t('status.offline')}
                >
                  {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                  <span className="hidden sm:inline">{isOnline ? t('status.online') : t('status.offline')}</span>
                  
                  {offlineQueue.length > 0 && (
                      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
                          <Database size={14} className="text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400 text-xs">
                              {offlineQueue.length} {t('queue.pending')}
                          </span>
                      </div>
                  )}
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                    <Palette size={16} className="text-slate-500 ml-1" />
                    {colors.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setAccentColor(c.id)}
                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${c.bg} ${accentColor === c.id ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleTheme}
                        className="p-3 rounded-xl bg-gray-100 dark:bg-white/10 text-slate-700 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button 
                        onClick={toggleLanguage}
                        className="p-3 rounded-xl bg-gray-100 dark:bg-white/10 text-slate-700 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all font-bold w-12"
                    >
                        {language === 'fa' ? 'En' : 'فا'}
                    </button>
                </div>
                
                <div className="hidden md:flex items-center gap-3 bg-blue-50 dark:bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-blue-100 dark:border-white/10">
                    <Zap className="text-amber-500 dark:text-yellow-400 fill-amber-500 dark:fill-yellow-400" />
                    <span className="font-bold text-slate-800 dark:text-white">{t('gemini.powered')}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation - Always visible sticky dock with compact effect on scroll */}
        <nav 
          className={`
            flex flex-row items-center gap-2 mb-8 
            backdrop-blur-xl sticky top-4 z-50 
            overflow-x-auto custom-scrollbar
            transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            border
            ${isScrolled 
              ? 'bg-white/95 dark:bg-slate-800/95 shadow-2xl border-gray-300 dark:border-slate-600 p-2 rounded-[2rem] mx-0 md:mx-auto md:max-w-4xl' 
              : 'bg-white/60 dark:bg-slate-900/50 shadow-lg border-gray-200 dark:border-slate-800 p-3 rounded-2xl w-full'}
          `}
        >
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 min-w-[120px] rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap
                ${isScrolled ? 'py-3 px-4 text-sm' : 'py-4 px-6 text-sm md:text-base'}
                ${activeTab === tab.id 
                  ? 'text-white shadow-md scale-[1.02]' 
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
              style={activeTab === tab.id ? { backgroundColor: themeColors.primary, boxShadow: `0 4px 12px ${themeColors.primary}40` } : {}}
            >
              <tab.icon size={isScrolled ? 18 : 22} strokeWidth={2.5} className="transition-all duration-300" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="min-h-[500px]">
          {activeTab === 'dashboard' && (
            <Dashboard 
              exhausts={exhausts} 
              onAnalyze={(e) => handleAnalyze(e, true)} 
              isAnalyzing={isAnalyzing} 
              isOnline={isOnline}
            />
          )}
          
          {activeTab === 'details' && (
            <ExhaustDetails 
              exhausts={exhausts}
              aiAnalysis={aiAnalysis}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
              isOnline={isOnline}
            />
          )}
          
          {activeTab === 'data-entry' && (
            <DataEntry 
              exhausts={exhausts} 
              onAddData={handleAddData} 
              onAddExhaust={handleAddExhaust}
              onImportData={handleImportData}
              isOnline={isOnline}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisResult 
              analysis={aiAnalysis}
              exhausts={exhausts} 
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'chat' && (
             <ChatBot isOnline={isOnline} />
          )}

          {activeTab === 'history' && (
            <MeasurementHistory exhausts={exhausts} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;