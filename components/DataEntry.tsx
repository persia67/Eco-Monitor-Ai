import React, { useState, useRef } from 'react';
import { FileText, Save, RefreshCcw, PlusCircle, Settings, Factory, Calendar, Download, Upload, Database } from 'lucide-react';
import { Exhaust, PollutantData } from '../types';
import { STANDARDS } from '../constants';

interface DataEntryProps {
  exhausts: Exhaust[];
  onAddData: (exhaustId: string, data: PollutantData, period: string) => void;
  onAddExhaust: (name: string, location: string) => void;
  onImportData: (data: Exhaust[]) => void;
}

export const DataEntry: React.FC<DataEntryProps> = ({ exhausts, onAddData, onAddExhaust, onImportData }) => {
  const [mode, setMode] = useState<'entry' | 'create' | 'backup'>('entry');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for Data Entry
  const [exhaustId, setExhaustId] = useState('');
  const [period, setPeriod] = useState('زمستان ۱۴۰۴');
  const [formData, setFormData] = useState<Partial<PollutantData>>({});

  // State for New Exhaust
  const [newExhaust, setNewExhaust] = useState({ name: '', location: '' });

  const periods = [
    'زمستان ۱۴۰۴',
    'پاییز ۱۴۰۴',
    'تابستان ۱۴۰۴',
    'بهار ۱۴۰۴'
  ];

  const handleSubmitData = () => {
    if (!exhaustId) return;
    
    const completeData: PollutantData = {
      CO: Number(formData.CO) || 0,
      CO2: Number(formData.CO2) || 0,
      SO2: Number(formData.SO2) || 0,
      NOx: Number(formData.NOx) || 0,
      PM: Number(formData.PM) || 0,
      O2: Number(formData.O2) || 0,
    };

    onAddData(exhaustId, completeData, period);
    setExhaustId('');
    setFormData({});
  };

  const handleCreateExhaust = () => {
    if (newExhaust.name && newExhaust.location) {
      onAddExhaust(newExhaust.name, newExhaust.location);
      setNewExhaust({ name: '', location: '' });
      setMode('entry');
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exhausts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ecomonitor_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            if (Array.isArray(json)) {
                onImportData(json);
                alert('اطلاعات با موفقیت بازیابی شد.');
            } else {
                alert('فرمت فایل نامعتبر است.');
            }
        } catch (error) {
            console.error(error);
            alert('خطا در خواندن فایل.');
        }
    };
    reader.readAsText(fileObj);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-slate-700/50 max-w-4xl mx-auto animate-in slide-in-from-bottom-5 duration-500 transition-colors duration-300">
      
      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-slate-900/50 p-1 rounded-xl mb-8 border border-gray-200 dark:border-slate-700">
        <button 
          onClick={() => setMode('entry')}
          className={`flex-1 py-3 px-2 rounded-lg font-bold text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 transition-all ${
            mode === 'entry' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
          }`}
        >
          <FileText size={16} />
          ثبت داده‌ها
        </button>
        <button 
          onClick={() => setMode('create')}
          className={`flex-1 py-3 px-2 rounded-lg font-bold text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 transition-all ${
            mode === 'create' 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
          }`}
        >
          <PlusCircle size={16} />
          اگزوز جدید
        </button>
        <button 
          onClick={() => setMode('backup')}
          className={`flex-1 py-3 px-2 rounded-lg font-bold text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 transition-all ${
            mode === 'backup' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
          }`}
        >
          <Database size={16} />
          پشتیبان‌گیری
        </button>
      </div>

      {mode === 'entry' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
              <Settings size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">ورود مقادیر آلاینده‌ها</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">انتخاب اگزوز، فصل پایش و ثبت مقادیر اندازه‌گیری شده</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">منبع انتشار (اگزوز)</label>
              <select
                value={exhaustId}
                onChange={(e) => setExhaustId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-900"
              >
                <option value="">انتخاب کنید...</option>
                {exhausts.map(exhaust => (
                  <option key={exhaust.id} value={exhaust.id}>{exhaust.name} - {exhaust.location}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar size={16} />
                دوره پایش (فصل)
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-900"
              >
                {periods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {Object.keys(STANDARDS).map(pollutant => (
              <div key={pollutant} className="group">
                <label className="flex justify-between mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span>{STANDARDS[pollutant].name}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">{STANDARDS[pollutant].unit}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData[pollutant] || ''}
                    onChange={(e) => setFormData({...formData, [pollutant]: parseFloat(e.target.value)})}
                    placeholder={`حداکثر: ${STANDARDS[pollutant].limit}`}
                    className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-900"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-xs font-mono">
                    {pollutant}
                  </div>
                </div>
                <div className="h-1 bg-slate-200 dark:bg-slate-700 mt-2 rounded-full overflow-hidden opacity-0 group-focus-within:opacity-100 transition-opacity">
                   <div 
                     className={`h-full ${Number(formData[pollutant] || 0) > STANDARDS[pollutant].limit ? 'bg-red-500' : 'bg-green-500'}`} 
                     style={{width: '100%'}}
                   />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
                onClick={() => {setExhaustId(''); setFormData({});}}
                className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              پاک کردن
            </button>
            <button
              onClick={handleSubmitData}
              className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={20} />
              ذخیره اطلاعات
            </button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Factory size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">افزودن اگزوز جدید</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">تعریف یک نقطه پایش جدید در سامانه</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">نام اگزوز یا تجهیز</label>
              <input
                type="text"
                value={newExhaust.name}
                onChange={(e) => setNewExhaust({...newExhaust, name: e.target.value})}
                placeholder="مثال: بویلر شماره ۳"
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-900"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">موقعیت مکانی</label>
              <input
                type="text"
                value={newExhaust.location}
                onChange={(e) => setNewExhaust({...newExhaust, location: e.target.value})}
                placeholder="مثال: سالن تولید C - ضلع شمالی"
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setNewExhaust({ name: '', location: '' })}
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              انصراف
            </button>
            <button
              onClick={handleCreateExhaust}
              disabled={!newExhaust.name || !newExhaust.location}
              className="flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              ایجاد اگزوز جدید
            </button>
          </div>
        </div>
      )}

      {mode === 'backup' && (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
              <Database size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">پشتیبان‌گیری و بازیابی</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">مدیریت فایل‌های داده و انتقال اطلاعات</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col items-center text-center">
                 <div className="bg-blue-100 dark:bg-blue-500/10 p-4 rounded-full mb-4">
                    <Download size={32} className="text-blue-600 dark:text-blue-400" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">دریافت فایل پشتیبان</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    تمامی اطلاعات ثبت شده شامل اگزوزها و تاریخچه اندازه‌گیری‌ها در قالب یک فایل JSON ذخیره می‌شود.
                 </p>
                 <button 
                    onClick={handleExport}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                 >
                    دانلود فایل پشتیبان
                 </button>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col items-center text-center">
                 <div className="bg-emerald-100 dark:bg-emerald-500/10 p-4 rounded-full mb-4">
                    <Upload size={32} className="text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">بازیابی اطلاعات</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    بازگردانی اطلاعات از فایل پشتیبان. توجه کنید که اطلاعات فعلی با اطلاعات فایل جایگزین خواهد شد.
                 </p>
                 <input 
                    type="file" 
                    accept=".json" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                 />
                 <button 
                    onClick={handleImportClick}
                    className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-3 rounded-xl font-bold transition-all"
                 >
                    انتخاب فایل و بازیابی
                 </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};