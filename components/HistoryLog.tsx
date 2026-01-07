import React from 'react';
import { History, FileText, Zap, PlusCircle, Clock, Activity } from 'lucide-react';
import { HistoryLogEntry } from '../types';

interface HistoryLogProps {
  logs: HistoryLogEntry[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-12 shadow-xl border border-slate-700/50 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <History size={48} className="text-slate-500 opacity-50" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">تاریخچه‌ای موجود نیست</h3>
        <p className="text-slate-400">هنوز فعالیت یا تغییری در سیستم ثبت نشده است.</p>
      </div>
    );
  }

  const getIcon = (action: string) => {
    switch (action) {
      case 'data_entry': return <FileText size={20} className="text-blue-400" />;
      case 'ai_analysis': return <Zap size={20} className="text-yellow-400" />;
      case 'new_exhaust': return <PlusCircle size={20} className="text-emerald-400" />;
      default: return <Activity size={20} className="text-slate-400" />;
    }
  };

  const getColor = (action: string) => {
    switch (action) {
      case 'data_entry': return 'bg-blue-500/10 border-blue-500/20';
      case 'ai_analysis': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'new_exhaust': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-slate-700/30 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-700/50 rounded-xl text-slate-300">
          <History size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">تاریخچه فعالیت‌ها</h2>
          <p className="text-slate-400 mt-1">گزارش عملکرد کاربران و تحلیل‌های سیستمی</p>
        </div>
      </div>

      <div className="relative border-r border-slate-700/50 mr-4 space-y-6 pr-8">
        {logs.map((log) => (
          <div key={log.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -right-[39px] top-4 w-5 h-5 rounded-full bg-slate-800 border-4 border-slate-600 group-hover:border-blue-500 transition-colors z-10"></div>
            
            <div className={`rounded-2xl p-5 border backdrop-blur-sm transition-all hover:scale-[1.01] ${getColor(log.action)}`}>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    {getIcon(log.action)}
                  </div>
                  <h4 className="font-bold text-lg text-slate-200">{log.title}</h4>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-700/30 w-fit">
                  <Clock size={14} />
                  <span dir="ltr">{log.timestamp}</span>
                </div>
              </div>
              
              <div className="text-slate-400 text-sm leading-relaxed pr-[52px]">
                {log.description}
                {log.exhaustName && (
                  <div className="mt-2 inline-block bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 border border-slate-700">
                    منبع: {log.exhaustName}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};