import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Filter, Info, MapPin, Calendar, Activity, Zap, FileText, Table, ChevronLeft } from 'lucide-react';
import { Exhaust, AIAnalysisResult } from '../types';
import { STANDARDS } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface ExhaustDetailsProps {
  exhausts: Exhaust[];
  aiAnalysis: AIAnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyze: (exhaust: Exhaust, switchTab?: boolean) => void;
}

export const ExhaustDetails: React.FC<ExhaustDetailsProps> = ({ 
  exhausts, aiAnalysis, isAnalyzing, onAnalyze 
}) => {
  const [selectedExhaustId, setSelectedExhaustId] = useState<number>(exhausts[0]?.id || 1);
  const { t, language, themeColors } = useSettings();
  const selectedExhaust = exhausts.find(e => e.id === selectedExhaustId);

  if (!selectedExhaust) return <div className="text-center p-10 text-slate-500">{t('details.notFound')}</div>;

  // Transform history data for Recharts
  const chartData = selectedExhaust.history.map(h => ({
    name: h.period,
    date: h.date,
    ...h.data
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="font-bold text-slate-900 dark:text-slate-200 mb-2 border-b border-gray-200 dark:border-slate-700 pb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-sm py-1">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-600 dark:text-slate-400 min-w-[30px]">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const currentAnalysis = aiAnalysis?.exhaustId === selectedExhaustId ? aiAnalysis : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-5 duration-500">
      
      {/* Sidebar: Exhaust List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Filter size={20} style={{ color: themeColors.primary }}/>
                {t('details.list')}
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {exhausts.map(ex => (
                    <button
                        key={ex.id}
                        onClick={() => setSelectedExhaustId(ex.id)}
                        className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between group`}
                        style={selectedExhaustId === ex.id 
                          ? { backgroundColor: `${themeColors.primary}20`, borderColor: `${themeColors.primary}80`, color: 'inherit' }
                          : {}}
                    >
                        <div className="flex flex-col">
                            <span className={`font-bold text-sm ${selectedExhaustId === ex.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>{ex.name}</span>
                            <span className="text-xs opacity-70 mt-1 flex items-center gap-1 text-slate-400">
                                <MapPin size={10} />
                                {ex.location}
                            </span>
                        </div>
                        {selectedExhaustId === ex.id && (
                          language === 'fa' 
                            ? <ChevronLeft size={16} style={{ color: themeColors.primary }} />
                            : <ChevronLeft size={16} style={{ color: themeColors.primary }} className="rotate-180" />
                        )}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Top Info Bar */}
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 flex flex-wrap gap-6 items-center justify-between transition-colors duration-300">
            <div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{selectedExhaust.name}</h2>
                 <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <MapPin size={16} />
                    {t('location')}: {selectedExhaust.location}
                 </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/30 px-4 py-2 rounded-lg text-sm border border-gray-200 dark:border-slate-600/30">
                <Calendar className="text-emerald-500 dark:text-emerald-400" size={18} />
                <span className="text-slate-600 dark:text-slate-300">{t('lastCheck')}: <strong className="text-slate-900 dark:text-white mr-1">{selectedExhaust.lastCheck}</strong></span>
            </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Combustion Gases Chart */}
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300">
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                {t('details.combustion')}
              </h3>
              <div className="h-[250px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: '12px', color: '#64748b'}} />
                    <Line type="monotone" dataKey="CO" name="CO" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                    <Line type="monotone" dataKey="NOx" name="NOx" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* O2 Chart */}
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300">
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full" style={{backgroundColor: themeColors.primary}}></span>
                {t('details.oxygen')}
              </h3>
              <div className="h-[250px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorO2Details" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis tick={{fill: '#64748b', fontSize: 12}} domain={[0, 25]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="O2" name="O2 (%)" stroke={themeColors.primary} fillOpacity={1} fill="url(#colorO2Details)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>

        {/* History Table */}
         <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 overflow-hidden transition-colors duration-300">
             <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-slate-700 pb-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-200">
                  <Table size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('details.tableTitle')}</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">{t('details.tableDesc')}</p>
                </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-gray-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                   <tr>
                     <th className="p-4 rounded-r-xl">{t('period')}</th>
                     <th className="p-4">{t('date')}</th>
                     <th className="p-4 text-center">
                       CO
                       <span className="block text-xs opacity-50 font-normal">{t('standard')}: {STANDARDS.CO.limit}</span>
                     </th>
                     <th className="p-4 text-center">
                       NOx
                       <span className="block text-xs opacity-50 font-normal">{t('standard')}: {STANDARDS.NOx.limit}</span>
                     </th>
                     <th className="p-4 text-center">
                       SO2
                       <span className="block text-xs opacity-50 font-normal">{t('standard')}: {STANDARDS.SO2.limit}</span>
                     </th>
                     <th className="p-4 text-center">
                       PM
                       <span className="block text-xs opacity-50 font-normal">{t('standard')}: {STANDARDS.PM.limit}</span>
                     </th>
                     <th className="p-4 text-center rounded-l-xl">
                       O2
                       <span className="block text-xs opacity-50 font-normal">{t('normal')}: {STANDARDS.O2.limit}%</span>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="text-slate-700 dark:text-slate-300">
                    {selectedExhaust.history.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-slate-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="p-4 font-bold">{record.period}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{record.date}</td>
                        <td className={`p-4 text-center font-mono ${record.data.CO > STANDARDS.CO.limit ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}>{record.data.CO}</td>
                        <td className={`p-4 text-center font-mono ${record.data.NOx > STANDARDS.NOx.limit ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}>{record.data.NOx}</td>
                        <td className={`p-4 text-center font-mono ${record.data.SO2 > STANDARDS.SO2.limit ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}>{record.data.SO2}</td>
                        <td className={`p-4 text-center font-mono ${record.data.PM > STANDARDS.PM.limit ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}>{record.data.PM}</td>
                        <td className={`p-4 text-center font-mono ${record.data.O2 > 15 ? 'text-amber-500 dark:text-amber-400' : ''}`}>{record.data.O2}%</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>

        {/* AI Analysis Section */}
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300" 
             style={{ borderColor: `${themeColors.primary}30` }}>
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('details.aiTitle')} (Gemini AI)</h3>
             </div>

             <div className="mb-6">
               {currentAnalysis ? (
                 <div className="prose prose-sm max-w-none bg-white/50 dark:bg-slate-900/50 p-6 rounded-xl border border-gray-100 dark:border-slate-700/50 dark:prose-invert">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                      <Activity size={12} />
                      <span>{t('details.aiGenerated')}: {currentAnalysis.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap font-light leading-relaxed text-slate-700 dark:text-slate-200">
                        {currentAnalysis.analysis}
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/20">
                    <p className="text-slate-500 dark:text-slate-400">{t('details.noReport')}</p>
                 </div>
               )}
             </div>

             <button
                onClick={() => onAnalyze(selectedExhaust, false)}
                disabled={isAnalyzing}
                className="w-full sm:w-auto text-white py-3 px-8 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.hover})`, boxShadow: `0 10px 15px -3px ${themeColors.primary}30` }}
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="animate-spin" size={20} />
                    {t('loading')}
                  </>
                ) : (
                  <>
                    <Zap size={20} className="fill-white" />
                    {currentAnalysis ? t('details.reAnalyzeBtn') : t('details.getAnalysisBtn')}
                  </>
                )}
              </button>
        </div>
      </div>
    </div>
  );
};