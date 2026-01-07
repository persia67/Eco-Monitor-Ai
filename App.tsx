import React, { useState } from 'react';
import { Activity, FileText, TrendingUp, Menu, Zap, BarChart3, Info, Moon, Sun, Languages, Palette, MessageSquare } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { AnalysisResult } from './components/AnalysisResult';
import { MeasurementHistory } from './components/HistoryLog';
import { ExhaustDetails } from './components/ExhaustDetails';
import { ChatBot } from './components/ChatBot';
import { Exhaust, PollutantData, AIAnalysisResult, TabType } from './types';
import { INITIAL_EXHAUSTS } from './constants';
import { generateExhaustAnalysis } from './services/geminiService';
import { useSettings, AccentColor } from './contexts/SettingsContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType | 'chat'>('dashboard');
  const [exhausts, setExhausts] = useState<Exhaust[]>(INITIAL_EXHAUSTS);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { theme, toggleTheme, language, toggleLanguage, t, dir, accentColor, setAccentColor, themeColors } = useSettings();
  
  const handleAddData = (exhaustId: string, newData: PollutantData, period: string) => {
    setExhausts(prev => prev.map(exhaust => {
      if (exhaust.id === parseInt(exhaustId)) {
        return {
          ...exhaust,
          data: newData,
          lastCheck: new Date().toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US'),
          history: [
            ...exhaust.history, 
            {
                period: period,
                date: new Date().toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US'),
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

        {/* Navigation */}
        <nav className="flex flex-col sm:flex-row gap-3 mb-8 bg-white/60 dark:bg-slate-900/50 p-2 rounded-2xl border border-gray-200 dark:border-slate-800 backdrop-blur-sm sticky top-4 z-50 shadow-lg dark:shadow-xl overflow-x-auto transition-all duration-300">
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[140px] py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-sm md:text-base ${
                activeTab === tab.id 
                  ? 'text-white shadow-lg scale-[1.02]' 
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              style={activeTab === tab.id ? { backgroundColor: themeColors.primary, boxShadow: `0 10px 15px -3px ${themeColors.primary}50` } : {}}
            >
              <tab.icon size={22} strokeWidth={2.5} />
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
            />
          )}
          
          {activeTab === 'details' && (
            <ExhaustDetails 
              exhausts={exhausts}
              aiAnalysis={aiAnalysis}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
            />
          )}
          
          {activeTab === 'data-entry' && (
            <DataEntry 
              exhausts={exhausts} 
              onAddData={handleAddData} 
              onAddExhaust={handleAddExhaust}
              onImportData={handleImportData}
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
             <ChatBot />
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