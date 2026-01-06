import React, { useState } from 'react';
import { Activity, FileText, TrendingUp, Menu, Zap } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { AnalysisResult } from './components/AnalysisResult';
import { Exhaust, PollutantData, AIAnalysisResult, TabType } from './types';
import { INITIAL_EXHAUSTS } from './constants';
import { generateExhaustAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [exhausts, setExhausts] = useState<Exhaust[]>(INITIAL_EXHAUSTS);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddData = (exhaustId: string, newData: PollutantData) => {
    setExhausts(prev => prev.map(exhaust => {
      if (exhaust.id === parseInt(exhaustId)) {
        return {
          ...exhaust,
          data: newData,
          lastCheck: new Date().toLocaleDateString('fa-IR')
        };
      }
      return exhaust;
    }));
    setActiveTab('dashboard');
  };

  const handleAddExhaust = (name: string, location: string) => {
    const newId = exhausts.length > 0 ? Math.max(...exhausts.map(e => e.id)) + 1 : 1;
    const newExhaust: Exhaust = {
      id: newId,
      name,
      location,
      data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 0 },
      lastCheck: 'ثبت نشده'
    };
    setExhausts(prev => [...prev, newExhaust]);
  };

  const handleAnalyze = async (exhaust: Exhaust) => {
    setIsAnalyzing(true);
    // Switch to analysis tab immediately to show loading state context if desired, 
    // but here we wait for result or show loading on button
    try {
      const resultText = await generateExhaustAnalysis(exhaust);
      setAiAnalysis({
        exhaustId: exhaust.id,
        analysis: resultText,
        timestamp: new Date().toLocaleString('fa-IR')
      });
      setActiveTab('analysis');
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'داشبورد وضعیت', icon: Activity },
    { id: 'data-entry', label: 'مدیریت و ورود داده‌ها', icon: FileText },
    { id: 'analysis', label: 'تحلیل هوشمند AI', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-black text-white selection:bg-blue-500 selection:text-white" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <header className="mb-10 animate-in slide-in-from-top-5 duration-700">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 border border-blue-600/30 relative overflow-hidden">
             {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                  سامانه هوشمند <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">EcoMonitor</span>
                </h1>
                <p className="text-blue-100/80 font-medium text-lg max-w-2xl">
                  پایش لحظه‌ای آلاینده‌های صنعتی منطبق با استانداردهای ISO 14001 با بهره‌گیری از هوش مصنوعی مولد
                </p>
              </div>
              <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                 <Zap className="text-yellow-400 fill-yellow-400" />
                 <span className="font-bold">Gemini 3 Powered</span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm sticky top-4 z-50 shadow-xl">
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-sm md:text-base ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]' 
                  : 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
              onAnalyze={handleAnalyze} 
              isAnalyzing={isAnalyzing} 
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
        </main>
      </div>
    </div>
  );
};

export default App;