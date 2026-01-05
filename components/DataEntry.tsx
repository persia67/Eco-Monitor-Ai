import React, { useState } from 'react';
import { FileText, Save, RefreshCcw } from 'lucide-react';
import { Exhaust, PollutantData } from '../types';
import { STANDARDS } from '../constants';

interface DataEntryProps {
  exhausts: Exhaust[];
  onAddData: (exhaustId: string, data: PollutantData) => void;
}

export const DataEntry: React.FC<DataEntryProps> = ({ exhausts, onAddData }) => {
  const [exhaustId, setExhaustId] = useState('');
  const [formData, setFormData] = useState<Partial<PollutantData>>({});

  const handleSubmit = () => {
    if (!exhaustId) return;
    
    // Default to 0 if empty
    const completeData: PollutantData = {
      CO: Number(formData.CO) || 0,
      CO2: Number(formData.CO2) || 0,
      SO2: Number(formData.SO2) || 0,
      NOx: Number(formData.NOx) || 0,
      PM: Number(formData.PM) || 0,
    };

    onAddData(exhaustId, completeData);
    setExhaustId('');
    setFormData({});
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-slate-700/50 max-w-4xl mx-auto animate-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-700">
        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
          <FileText size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">ثبت داده‌های پایش جدید</h2>
          <p className="text-slate-400 mt-1">لطفاً مقادیر اندازه‌گیری شده را با دقت وارد نمایید</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-semibold text-slate-300">منبع انتشار (اگزوز)</label>
          <select
            value={exhaustId}
            onChange={(e) => setExhaustId(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-slate-900"
          >
            <option value="">انتخاب کنید...</option>
            {exhausts.map(exhaust => (
              <option key={exhaust.id} value={exhaust.id}>{exhaust.name} - {exhaust.location}</option>
            ))}
          </select>
        </div>

        {Object.keys(STANDARDS).map(pollutant => (
          <div key={pollutant} className="group">
            <label className="flex justify-between mb-2 text-sm font-semibold text-slate-300">
              <span>{STANDARDS[pollutant].name}</span>
              <span className="text-slate-500 font-mono text-xs">{STANDARDS[pollutant].unit}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData[pollutant] || ''}
                onChange={(e) => setFormData({...formData, [pollutant]: parseFloat(e.target.value)})}
                placeholder={`حداکثر مجاز: ${STANDARDS[pollutant].limit}`}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-slate-900"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-mono">
                {pollutant}
              </div>
            </div>
            <div className="h-1 bg-slate-700 mt-2 rounded-full overflow-hidden opacity-0 group-focus-within:opacity-100 transition-opacity">
               <div 
                 className={`h-full ${Number(formData[pollutant] || 0) > STANDARDS[pollutant].limit ? 'bg-red-500' : 'bg-green-500'}`} 
                 style={{width: '100%'}}
               />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-8 pt-6 border-t border-slate-700">
        <button
            onClick={() => {setExhaustId(''); setFormData({});}}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <RefreshCcw size={20} />
          پاک کردن فرم
        </button>
        <button
          onClick={handleSubmit}
          className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save size={20} />
          ذخیره و بروزرسانی سیستم
        </button>
      </div>
    </div>
  );
};