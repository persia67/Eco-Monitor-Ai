import React from 'react';
import { TrendingUp, Activity, Clock } from 'lucide-react';
import { AIAnalysisResult, Exhaust } from '../types';

interface AnalysisResultProps {
  analysis: AIAnalysisResult | null;
  exhausts: Exhaust[];
  onBack: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, exhausts, onBack }) => {
  if (!analysis) {
    return (
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-12 shadow-xl border border-slate-700/50 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity size={48} className="text-slate-500 opacity-50" />
        </div>
        <h3 className="text-xl font-bold text-slate-300 mb-2">هنوز تحلیلی انجام نشده است</h3>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          برای دریافت گزارش فنی و تحلیل هوشمند، لطفاً به داشبورد مراجعه کرده و روی دکمه "تحلیل پیشرفته با AI" کلیک کنید.
        </p>
        <button 
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          بازگشت به داشبورد
        </button>
      </div>
    );
  }

  const relatedExhaust = exhausts.find(e => e.id === analysis.exhaustId);

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-purple-400" size={28} />
            گزارش تحلیل هوشمند
          </h2>
          <p className="text-purple-200 mt-1">تولید شده توسط مدل زبانی Gemini 3</p>
        </div>
        <div className="flex items-center gap-4 text-sm bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {relatedExhaust?.name}
            </div>
            <div className="w-px h-4 bg-slate-700"></div>
            <div className="flex items-center gap-2 text-slate-400">
                <Clock size={14} />
                {analysis.timestamp}
            </div>
        </div>
      </div>
      
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700/50">
        <article className="prose prose-invert prose-lg max-w-none prose-headings:text-blue-400 prose-strong:text-slate-200 prose-li:text-slate-300">
          <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-300">
            {analysis.analysis.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};