import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { AlertCircle, Activity } from 'lucide-react';
import { Exhaust } from '../types';
import { STANDARDS, DIAGNOSTIC_SYSTEM } from '../constants';

interface DashboardProps {
  exhausts: Exhaust[];
  onAnalyze: (exhaust: Exhaust) => void;
  isAnalyzing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ exhausts, onAnalyze, isAnalyzing }) => {

  const calculateStatus = (value: number, limit: number) => {
    const percentage = (value / limit) * 100;
    if (percentage <= 80) return { status: 'خوب', color: '#10b981', level: 'safe' };
    if (percentage <= 100) return { status: 'قابل قبول', color: '#f59e0b', level: 'warning' };
    if (percentage <= 120) return { status: 'خطر', color: '#ef4444', level: 'danger' };
    return { status: 'بحرانی', color: '#dc2626', level: 'critical' };
  };

  const getExhaustOverallStatus = (exhaustData: any) => {
    let maxPercentage = 0;
    Object.keys(STANDARDS).forEach(pollutant => {
      const percentage = (exhaustData[pollutant] / STANDARDS[pollutant].limit) * 100;
      if (percentage > maxPercentage) maxPercentage = percentage;
    });
    return calculateStatus(maxPercentage * STANDARDS.CO.limit / 100, STANDARDS.CO.limit);
  };

  const getDetailedDiagnostic = (exhaustData: Exhaust) => {
    const diagnostics: any[] = [];
    Object.entries(exhaustData.data).forEach(([pollutant, value]) => {
      const limit = STANDARDS[pollutant].limit;
      const percentage = ((value as number) / limit) * 100;
      
      if (percentage > 100) {
        const severity = percentage > 120 ? 'veryHigh' : 'high';
        diagnostics.push({
          pollutant: STANDARDS[pollutant].name,
          value: value,
          limit: limit,
          percentage: percentage.toFixed(1),
          issue: DIAGNOSTIC_SYSTEM[pollutant][severity as 'high' | 'veryHigh']
        });
      }
    });
    return diagnostics;
  };

  const getRadarData = (exhaustData: any) => {
    return Object.keys(STANDARDS).map(pollutant => ({
      pollutant: STANDARDS[pollutant].name,
      value: (exhaustData[pollutant] / STANDARDS[pollutant].limit) * 100,
      fullMark: 100
    }));
  };

  const getComparisonData = () => {
    return Object.keys(STANDARDS).map(pollutant => ({
      name: STANDARDS[pollutant].name,
      استاندارد: STANDARDS[pollutant].limit,
      ...exhausts.reduce((acc: any, exhaust) => {
        acc[exhaust.name] = exhaust.data[pollutant];
        return acc;
      }, {})
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {exhausts.map(exhaust => {
          const overallStatus = getExhaustOverallStatus(exhaust.data);
          const diagnostics = getDetailedDiagnostic(exhaust);
          
          return (
            <div key={exhaust.id} className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-700/50 hover:border-slate-600 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-white">{exhaust.name}</h3>
                  <p className="text-sm text-slate-400">{exhaust.location}</p>
                  <p className="text-xs text-slate-500 mt-1">آخرین بررسی: {exhaust.lastCheck}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-white shadow-lg`} style={{backgroundColor: overallStatus.color}}>
                  {overallStatus.status}
                </div>
              </div>

              <div className="mb-6 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getRadarData(exhaust.data)}>
                    <PolarGrid stroke="#475569" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="pollutant" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <PolarRadiusAxis angle={90} domain={[0, 150]} tick={{fill: '#64748b'}} />
                    <Radar name="درصد استاندارد" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {Object.entries(exhaust.data).map(([pollutant, value]) => {
                  const limit = STANDARDS[pollutant].limit;
                  const val = value as number;
                  const status = calculateStatus(val, limit);
                  const percentage = ((val / limit) * 100).toFixed(1);
                  
                  return (
                    <div key={pollutant} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-200">{STANDARDS[pollutant].name}</span>
                        <span className="text-sm font-medium" style={{color: status.color}}>{status.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-900 rounded-full h-2.5">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${Math.min(parseFloat(percentage), 100)}%`,
                              backgroundColor: status.color
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400 min-w-[80px] text-left" dir="ltr">
                          {val} / {limit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {diagnostics.length > 0 && (
                <div className="mt-4 bg-red-950/40 border border-red-500/30 rounded-xl p-4">
                  <h4 className="font-bold mb-2 flex items-center gap-2 text-red-400">
                    <AlertCircle size={18} />
                    هشدار سیستم:
                  </h4>
                  {diagnostics.map((diag, idx) => (
                    <div key={idx} className="text-sm mb-2 last:mb-0 text-slate-300">
                      <strong className="text-red-300">{diag.pollutant}</strong> ({diag.percentage}%):
                      <p className="mt-1 text-xs opacity-80">{diag.issue}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => onAnalyze(exhaust)}
                disabled={isAnalyzing}
                className="group w-full mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="animate-spin" size={20} />
                    در حال تحلیل هوشمند...
                  </>
                ) : (
                  <>
                    <Activity size={20} className="group-hover:scale-110 transition-transform" />
                    تحلیل پیشرفته با AI
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-700/50">
        <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
          <Activity className="text-green-500" />
          مقایسه جامع آلاینده‌ها با استانداردهای ISO 14001
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getComparisonData()} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'}}
                labelStyle={{color: '#94a3b8', marginBottom: '0.5rem'}}
              />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Bar dataKey="استاندارد" fill="#10b981" radius={[4, 4, 0, 0]} name="حد استاندارد" />
              {exhausts.map((exhaust, idx) => (
                <Bar key={exhaust.id} dataKey={exhaust.name} fill={['#3b82f6', '#f59e0b', '#8b5cf6'][idx % 3]} radius={[4, 4, 0, 0]} name={exhaust.name} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};