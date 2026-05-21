import React from 'react';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { AlertCircle, Activity, WifiOff } from 'lucide-react';
import { Exhaust } from '../types';
import { STANDARDS, DIAGNOSTIC_SYSTEM } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface DashboardProps {
  exhausts: Exhaust[];
  onAnalyze: (exhaust: Exhaust) => void;
  isAnalyzing: boolean;
  isOnline: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ exhausts, onAnalyze, isAnalyzing, isOnline }) => {
  const { themeColors, t } = useSettings();

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

  const comparisonData = Object.keys(STANDARDS).map(pollutant => ({
    name: STANDARDS[pollutant].name,
    استاندارد: STANDARDS[pollutant].limit,
    ...exhausts.reduce((acc: any, exhaust) => {
      acc[exhaust.name] = exhaust.data[pollutant];
      return acc;
    }, {})
  }));

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-6">
        {exhausts.map(exhaust => {
          const overallStatus = getExhaustOverallStatus(exhaust.data);
          const diagnostics = getDetailedDiagnostic(exhaust);
          
          return (
            <div key={exhaust.id} className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600 transition-all min-w-0">
              <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-1 text-slate-800 dark:text-white truncate max-w-[200px] md:max-w-none">{exhaust.name}</h3>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{exhaust.location}</p>
                  <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-1">آخرین بررسی: {exhaust.lastCheck}</p>
                </div>
                <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm text-white shadow-lg whitespace-nowrap`} style={{backgroundColor: overallStatus.color}}>
                  {overallStatus.status}
                </div>
              </div>

              <div className="mb-6 h-[200px] sm:h-[220px] w-full" dir="ltr">
                <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData(exhaust.data)}>
                    <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="pollutant" tick={{fill: '#64748b', fontSize: 10}} />
                    <PolarRadiusAxis angle={90} domain={[0, 150]} tick={{fill: '#64748b', fontSize: 10}} />
                    <Radar name="درصد استاندارد" dataKey="value" stroke={themeColors.primary} fill={themeColors.primary} fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 md:space-y-3">
                {Object.entries(exhaust.data).map(([pollutant, value]) => {
                  const limit = STANDARDS[pollutant].limit;
                  const val = value as number;
                  const status = calculateStatus(val, limit);
                  const percentage = ((val / limit) * 100).toFixed(1);
                  
                  return (
                    <div key={pollutant} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 md:p-3 border border-gray-100 dark:border-slate-600/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-200">{STANDARDS[pollutant].name}</span>
                        <span className="text-xs md:text-sm font-medium" style={{color: status.color}}>{status.status}</span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-900 rounded-full h-2 md:h-2.5">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${Math.min(parseFloat(percentage), 100)}%`,
                              backgroundColor: status.color
                            }}
                          />
                        </div>
                        <span className="text-[10px] md:text-xs font-mono text-slate-500 dark:text-slate-400 min-w-[60px] md:min-w-[80px] text-left" dir="ltr">
                          {val} / {limit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {diagnostics.length > 0 && (
                <div className="mt-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl p-3 md:p-4">
                  <h4 className="font-bold mb-2 flex items-center gap-2 text-sm md:text-base text-red-600 dark:text-red-400">
                    <AlertCircle size={16} />
                    هشدار سیستم:
                  </h4>
                  {diagnostics.map((diag, idx) => (
                    <div key={idx} className="text-xs md:text-sm mb-2 last:mb-0 text-slate-600 dark:text-slate-300">
                      <strong className="text-red-500 dark:text-red-300">{diag.pollutant}</strong> ({diag.percentage}%):
                      <p className="mt-1 opacity-80">{diag.issue}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => onAnalyze(exhaust)}
                disabled={isAnalyzing || !isOnline}
                title={!isOnline ? t('error.offlineDesc') : ''}
                className="group w-full mt-6 py-3 rounded-xl font-bold text-sm md:text-base text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={isOnline 
                  ? { backgroundImage: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.hover})`, boxShadow: `0 10px 15px -3px ${themeColors.primary}30` } 
                  : { backgroundColor: '#94a3b8' }
                }
              >
                {!isOnline ? (
                  <>
                    <WifiOff size={18} />
                    {t('error.offline')}
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Activity className="animate-spin" size={18} />
                    در حال تحلیل...
                  </>
                ) : (
                  <>
                    <Activity size={18} className="group-hover:scale-110 transition-transform" />
                    تحلیل پیشرفته با AI
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 w-full min-w-0">
        <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="text-green-500" size={24} />
          <span className="text-sm md:text-lg">مقایسه جامع آلاینده‌ها با استانداردهای ISO 14001</span>
        </h3>
        <div className="h-[300px] md:h-[400px] w-full" dir="ltr">
          <ResponsiveContainer width="99%" height="100%" minWidth={0}>
            <BarChart data={comparisonData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} dy={10} interval={0} />
              <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'}}
                labelStyle={{color: '#94a3b8', marginBottom: '0.5rem'}}
              />
              <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
              <Bar dataKey="استاندارد" fill="#94a3b8" radius={[4, 4, 0, 0]} name="حد استاندارد" />
              {exhausts.map((exhaust, idx) => (
                <Bar 
                  key={exhaust.id} 
                  dataKey={exhaust.name} 
                  fill={[themeColors.primary, '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'][idx % 5]} 
                  radius={[4, 4, 0, 0]} 
                  name={exhaust.name}
                >
                  {comparisonData.map((entry: any, index: number) => {
                    const value = entry[exhaust.name] as number;
                    const limit = entry['استاندارد'] as number;
                    const { color } = calculateStatus(value, limit);
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};