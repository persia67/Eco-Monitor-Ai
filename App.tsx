import React, { useState } from 'react';
import { Activity, FileText, TrendingUp, Menu, Zap, BarChart3, Info, Moon, Sun, Languages } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { AnalysisResult } from './components/AnalysisResult';
import { MeasurementHistory } from './components/HistoryLog';
import { ExhaustDetails } from './components/ExhaustDetails';
import { Exhaust, PollutantData, AIAnalysisResult, TabType } from './types';
import { INITIAL_EXHAUSTS } from './constants';
import { generateExhaustAnalysis } from './services/geminiService';
import { useSettings } from './contexts/SettingsContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [exhausts, setExhausts] = useState<Exhaust[]>(INITIAL_EXHAUSTS);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { theme, toggleTheme, language, toggleLanguage, t, dir } = useSettings();
  
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
    { id: 'history', label: t('nav.history'), icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-slate-900 dark:to-black text-slate-900 dark:text-white transition-colors duration-300" dir={dir}>
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <header className="mb-10 animate-in slide-in-from-top-5 duration-700">
          <div className="bg-white dark:bg-gradient-to-r dark:from-blue-700 dark:to-indigo-800 rounded-3xl p-8 shadow-xl dark:shadow-blue-900/20 border border-gray-200 dark:border-blue-600/30 relative overflow-hidden transition-all duration-300">
             {/* Background Pattern (Dark Mode Only) */}
            <div className="absolute top-0 left-0 w-full h-full opacity-0 dark:opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                  {t('app.title')} <span className="text-blue-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:to-blue-300">EcoMonitor</span>
                </h1>
                <p className="text-slate-600 dark:text-blue-100/80 font-medium text-lg max-w-2xl">
                  {t('app.subtitle')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
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
                    <span className="font-bold text-blue-900 dark:text-white">{t('gemini.powered')}</span>
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
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 min-w-[140px] py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-sm md:text-base ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]' 
                  : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
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
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisResult 
              analysis={aiAnalysis}
              exhausts={exhausts} 
              onBack={() => setActiveTab('dashboard')}
            />
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