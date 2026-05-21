import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';
import { Exhaust } from '../types';
import { useSettings } from '../contexts/SettingsContext';

interface MeasurementHistoryProps {
  exhausts: Exhaust[];
}

export const MeasurementHistory: React.FC<MeasurementHistoryProps> = ({ exhausts }) => {
  const [selectedExhaustId, setSelectedExhaustId] = useState<number>(exhausts[0]?.id || 1);
  const { t, themeColors } = useSettings();
  
  const selectedExhaust = exhausts.find(e => e.id === selectedExhaustId);
  
  // Transform history data for Recharts
  const chartData = selectedExhaust?.history.map(h => ({
    name: h.period,
    date: h.date,
    ...h.data
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 border border-gray-200 dark:border-slate-700 p-4 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm shadow-lg transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${themeColors.primary}20`, color: themeColors.primary }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('nav.history')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('details.tableDesc')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/80 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
          <Filter size={18} className="text-slate-400 mr-2" />
          <select
            value={selectedExhaustId}
            onChange={(e) => setSelectedExhaustId(parseInt(e.target.value))}
            className="bg-transparent text-slate-800 dark:text-white focus:outline-none min-w-[200px] text-sm md:text-base cursor-pointer"
          >
            {exhausts.map(ex => (
              <option 
                key={ex.id} 
                value={ex.id} 
                className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white py-2"
              >
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedExhaust ? (
        <div className="text-center text-slate-500 py-12">{t('details.notFound')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Combustion Gases Chart */}
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300 min-w-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-gray-100 dark:border-slate-700 pb-2">
              {t('details.combustion')}
            </h3>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} />
                  <YAxis tick={{fill: '#64748b'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="CO" name="CO" stroke="#f59e0b" strokeWidth={3} dot={{r: 6}} activeDot={{r: 8}} />
                  <Line type="monotone" dataKey="NOx" name="NOx" stroke="#ef4444" strokeWidth={3} dot={{r: 6}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* O2 Chart */}
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300 min-w-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-gray-100 dark:border-slate-700 pb-2">
              {t('details.oxygen')}
            </h3>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} />
                  <YAxis tick={{fill: '#64748b'}} domain={[0, 25]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="O2" name="O2 (%)" stroke={themeColors.primary} fillOpacity={1} fill="url(#colorO2)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Particles Chart */}
          <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300 min-w-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-gray-100 dark:border-slate-700 pb-2">
              {t('details.particles')}
            </h3>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} />
                  <YAxis tick={{fill: '#64748b'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="step" dataKey="PM" name="PM" stroke="#8b5cf6" strokeWidth={3} dot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

           {/* SO2 Chart */}
           <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-slate-700/50 transition-colors duration-300 min-w-0">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-gray-100 dark:border-slate-700 pb-2">
              {t('details.so2')}
            </h3>
            <div className="h-[300px] w-full" dir="ltr">
              <ResponsiveContainer width="99%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                   <defs>
                    <linearGradient id="colorSO2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{fill: '#64748b'}} />
                  <YAxis tick={{fill: '#64748b'}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="SO2" name="SO2" stroke="#10b981" fill="url(#colorSO2)" strokeWidth={3} dot={{r: 6}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};