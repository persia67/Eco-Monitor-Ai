import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Filter, Info, MapPin, Calendar, Activity, Zap, FileText, Table } from 'lucide-react';
import { Exhaust, AIAnalysisResult } from '../types';
import { STANDARDS } from '../constants';

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
  const selectedExhaust = exhausts.find(e => e.id === selectedExhaustId);

  if (!selectedExhaust) return <div className="text-center p-10 text-slate-500">هیچ اگزوزی یافت نشد.</div>;

  // Transform history data for Recharts
  const chartData = selectedExhaust.history.map(h => ({
    name: h.period,
    date: h.date,
    ...h.data
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 text-sm py-1">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-400 min-w-[30px]">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const currentAnalysis = aiAnalysis?.exhaustId === selectedExhaustId ? aiAnalysis : null;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
      
      {/* Top Bar: Selector & Basic Info */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 pl-4 rounded-xl border border-slate-700 w-full lg:w-auto">
          <div className="bg-blue-600 p-2.5 rounded-lg text-white">
            <Filter size={20} />
          </div>
          <select
            value={selectedExhaustId}
            onChange={(e) => setSelectedExhaustId(parseInt(e.target.value))}
            className="bg-transparent text-white focus:outline-none w-full lg:min-w-[250px] font-bold text-lg"
          >
            {exhausts.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4 lg:gap-8 text-sm text-slate-300 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-700/30 px-4 py-2 rounded-lg">
            <MapPin className="text-blue-400" size={18} />
            <span>موقعیت: <strong className="text-white mr-1">{selectedExhaust.location}</strong></span>
          </div>
          <div className="flex items-center gap-2 bg-slate-700/30 px-4 py-2 rounded-lg">
            <Calendar className="text-emerald-400" size={18} />
            <span>آخرین بررسی: <strong className="text-white mr-1">{selectedExhaust.lastCheck}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: AI Analysis & Actions */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-indigo-500/30 h-full flex flex-col">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">تحلیل هوشمند</h3>
             </div>

             <div className="flex-grow">
               {currentAnalysis ? (
                 <div className="prose prose-invert prose-sm max-w-none bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 pb-2 border-b border-slate-700">
                      <Activity size={12} />
                      <span>تولید شده در: {currentAnalysis.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap font-light leading-relaxed text-slate-200">
                        {currentAnalysis.analysis}
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-12 px-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                    <Activity className="mx-auto text-slate-500 mb-3 opacity-50" size={40} />
                    <p className="text-slate-400">هنوز گزارشی برای این اگزوز در این نشست تولید نشده است.</p>
                 </div>
               )}
             </div>

             <button
                onClick={() => onAnalyze(selectedExhaust, false)}
                disabled={isAnalyzing}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="animate-spin" size={20} />
                    در حال تحلیل...
                  </>
                ) : (
                  <>
                    <Zap size={20} className="fill-white" />
                    {currentAnalysis ? 'تحلیل مجدد' : 'تحلیل وضعیت با هوش مصنوعی'}
                  </>
                )}
              </button>
          </div>
        </div>

        {/* Right Column: Historical Charts & Data Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Combustion Gases Chart */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-slate-700/50">
              <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                گازهای احتراقی (CO, NOx)
              </h3>
              <div className="h-[250px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Line type="monotone" dataKey="CO" name="CO" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                    <Line type="monotone" dataKey="NOx" name="NOx" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* O2 Chart */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-slate-700/50">
              <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                میزان اکسیژن (O2)
              </h3>
              <div className="h-[250px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorO2Details" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 25]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="O2" name="O2 (%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorO2Details)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* History Data Table */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-700/50 overflow-hidden">
             <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <div className="p-2 bg-slate-700 rounded-lg text-slate-200">
                  <Table size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">جدول سوابق اندازه‌گیری</h3>
                   <p className="text-sm text-slate-400">مقادیر ثبت شده در دوره‌های سه ماهه به همراه حد استاندارد</p>
                </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-slate-900/50 text-slate-400">
                   <tr>
                     <th className="p-4 rounded-r-xl">دوره پایش</th>
                     <th className="p-4">تاریخ</th>
                     <th className="p-4 text-center">
                       CO
                       <span className="block text-xs opacity-50 font-normal">حد: {STANDARDS.CO.limit}</span>
                     </th>
                     <th className="p-4 text-center">
                       NOx
                       <span className="block text-xs opacity-50 font-normal">حد: {STANDARDS.NOx.limit}</span>
                     </th>
                     <th className="p-4 text-center">
                       SO2
                       <span className="block text-xs opacity-50 font-normal">حد: {STANDARDS.SO2.limit}</span>
                     </th>
                     <th className="p-4 text-center">
                       PM
                       <span className="block text-xs opacity-50 font-normal">حد: {STANDARDS.PM.limit}</span>
                     </th>
                     <th className="p-4 text-center rounded-l-xl">
                       O2
                       <span className="block text-xs opacity-50 font-normal">نرمال: {STANDARDS.O2.limit}%</span>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="text-slate-300">
                    {selectedExhaust.history.map((record, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors">
                        <td className="p-4 font-bold">{record.period}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{record.date}</td>
                        <td className={`p-4 text-center font-mono ${record.data.CO > STANDARDS.CO.limit ? 'text-red-400 font-bold' : ''}`}>{record.data.CO}</td>
                        <td className={`p-4 text-center font-mono ${record.data.NOx > STANDARDS.NOx.limit ? 'text-red-400 font-bold' : ''}`}>{record.data.NOx}</td>
                        <td className={`p-4 text-center font-mono ${record.data.SO2 > STANDARDS.SO2.limit ? 'text-red-400 font-bold' : ''}`}>{record.data.SO2}</td>
                        <td className={`p-4 text-center font-mono ${record.data.PM > STANDARDS.PM.limit ? 'text-red-400 font-bold' : ''}`}>{record.data.PM}</td>
                        <td className={`p-4 text-center font-mono ${record.data.O2 > 15 ? 'text-amber-400' : ''}`}>{record.data.O2}%</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};