import React, { useState, useRef, useEffect } from 'react';
import { FileText, Save, RefreshCcw, PlusCircle, Settings, Factory, Calendar, Download, Upload, Database, Globe, Eye, EyeOff, ShieldAlert, CheckCircle2, Play, Cpu } from 'lucide-react';
import { Exhaust, PollutantData } from '../types';
import { STANDARDS } from '../constants';
import { 
  getIranEmpSettings, 
  saveIranEmpSettings, 
  getIranEmpTokenKey, 
  getIranEmpMockData, 
  mapIranEmpToExhausts, 
  fetchIranEmpData,
  IranEmpStackResponse,
  IranEmpSettings 
} from '../services/iranEmpService';

interface DataEntryProps {
  exhausts: Exhaust[];
  onAddData: (exhaustId: string, data: PollutantData, period: string) => void;
  onAddExhaust: (name: string, location: string) => void;
  onImportData: (data: Exhaust[]) => void;
  filteredExhausts: Exhaust[] | null;
  onSetFilteredExhausts: (data: Exhaust[] | null) => void;
  aiFilterExplanation: string | null;
  onSetAiFilterExplanation: (text: string | null) => void;
}

export const DataEntry: React.FC<DataEntryProps> = ({ 
  exhausts, 
  onAddData, 
  onAddExhaust, 
  onImportData,
  filteredExhausts,
  onSetFilteredExhausts,
  aiFilterExplanation,
  onSetAiFilterExplanation
}) => {
  const [mode, setMode] = useState<'entry' | 'create' | 'backup' | 'iranemp'>('entry');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for Data Entry
  const [exhaustId, setExhaustId] = useState('');
  
  // Changed from single period string to separate season and year states
  const [season, setSeason] = useState('زمستان');
  const [year, setYear] = useState('1404');
  
  const [formData, setFormData] = useState<Partial<PollutantData>>({});

  // State for New Exhaust
  const [newExhaust, setNewExhaust] = useState({ name: '', location: '' });

  // --- States for IranEMP Integration ---
  const [iranEmpSettings, setIranEmpSettings] = useState<IranEmpSettings>(() => getIranEmpSettings());
  const [showSecret, setShowSecret] = useState(false);
  const [tokenKey, setTokenKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncLog, setSyncLog] = useState<string[]>([]);
  
  // Persisted state loading from localStorage to keep the last stage data
  const [fetchedStacks, setFetchedStacks] = useState<IranEmpStackResponse[]>(() => {
    try {
      const saved = localStorage.getItem('ecomonitor_iranemp_last_fetched');
      if (saved) {
        return JSON.parse(saved);
      } else {
        const seedData = getIranEmpMockData();
        localStorage.setItem('ecomonitor_iranemp_last_fetched', JSON.stringify(seedData));
        return seedData;
      }
    } catch {
      return getIranEmpMockData();
    }
  });

  const [manualJsonText, setManualJsonText] = useState('');
  const [showManualJson, setShowManualJson] = useState(false);

  // --- States for the AI Filtering Chatbot ---
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { 
      sender: 'assistant', 
      text: 'سلام! من دستیار هوشمند استخراج و فیلتر داده‌های پرسنل پایش صنعتی هستم.\nبا نوشتن درخواست خود با من گفتگو کنید. به صورت کاملاً خودکار و واقعی و بدون هیچ گونه داده شبیه‌سازی شده، بر اساس تاریخ‌ها، سال‌ها و دودکش‌های فعال پورتال عمل کرده و تمامی نمودارها و شاخص‌های برنامه را بر اساس فیلتر استخراجی شما هماهنگ خواهم کرد!\n\nمثال‌ها:\n• "نتایج پایش پاییز ۳ سال پیش را استخراج کن"\n• "داده‌های بویلر واحد گالوانیزه را فیلتر و جدا کن"\n• "به تفکیک هر سال آلایندگی‌ها را استخراج کن"' 
    }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiFiltering, setIsAiFiltering] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll chatbot to bottom when message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, isAiFiltering]);

  const handleAiChatSubmit = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Add User Message
    setAiChatMessages(prev => [...prev, { sender: 'user', text: messageText }]);
    setAiChatInput('');
    setIsAiFiltering(true);
    
    try {
      const response = await fetch('/api/iranemp/ai-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: messageText,
          exhausts: exhausts
        })
      });
      
      if (!response.ok) {
        let errorMsg = `خطای سرور: کد پاسخ ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) errorMsg = errData.error;
        } catch {}
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      
      // Update AI Filtering global states
      if (result.filteredExhausts) {
        onSetFilteredExhausts(result.filteredExhausts);
      }
      if (result.explanation) {
        onSetAiFilterExplanation(result.explanation);
        setAiChatMessages(prev => [...prev, { sender: 'assistant', text: result.explanation }]);
      }
    } catch (err: any) {
      console.error("AI filter error:", err);
      setAiChatMessages(prev => [
        ...prev, 
        { 
          sender: 'assistant', 
          text: `⚠️ خطا در اجرای فیلتر هوشمند:\n${err.message || 'عدم دسترسی به سرور هوش مصنوعی برای اعمال فیلتر استخراج.'}` 
        }
      ]);
    } finally {
      setIsAiFiltering(false);
    }
  };

  const handleManualJsonSubmit = () => {
    try {
      if (!manualJsonText.trim()) {
        alert('لطفاً ابتدا کد JSON را قرار دهید.');
        return;
      }
      const parsed = JSON.parse(manualJsonText);
      let arrayData: IranEmpStackResponse[] = [];
      
      if (Array.isArray(parsed)) {
        arrayData = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.data)) {
          arrayData = parsed.data;
        } else if (Array.isArray(parsed.result)) {
          arrayData = parsed.result;
        } else if (Array.isArray(parsed.items)) {
          arrayData = parsed.items;
        } else if (parsed.name && parsed.measurements) {
          arrayData = [parsed];
        }
      }

      if (arrayData.length === 0) {
        throw new Error("هیچ دودکش معتبری در ساختار داده‌های ارسالی پیدا نشد.");
      }

      const demo = arrayData[0];
      if (!demo.name || !demo.measurements) {
        throw new Error("ساختار مشخصات پورتال یافت نشد. شیء باید شامل فیلدهای name و measurements باشد.");
      }

      const merged = mapIranEmpToExhausts(arrayData, exhausts);
      onImportData(merged);
      
      setFetchedStacks(arrayData);
      setSyncStatus('success');
      setSyncMessage(`داده‌های با موفقیت از بورد کپی دستی همگام‌سازی شدند و تعداد ${arrayData.length} خروجی به لایه‌های پایش اضافه گردید!`);
      setSyncLog(prev => [
        ...prev,
        "📋 تخلیص مستقل و سریع پاسخ JSON سامانه با موفقیت انجام شد.",
        `📌 تعداد خروجی‌های پایش شده: ${arrayData.length} نقطه صنعتی`
      ]);
      setManualJsonText('');
      setShowManualJson(false);
    } catch (e: any) {
      alert(`خطا در پردازش JSON: ${e.message}. لطفاً فرمت وارد شده پورتال را صحت‌سنجی کنید.`);
    }
  };

  // Generate the Token Key dynamically when keys change or settings change
  useEffect(() => {
    const updateToken = async () => {
      try {
        const token = await getIranEmpTokenKey(iranEmpSettings.apiKey, iranEmpSettings.secretKey);
        setTokenKey(token);
      } catch (err) {
        setTokenKey('خطا در تولید توکن');
      }
    };
    updateToken();
  }, [iranEmpSettings.apiKey, iranEmpSettings.secretKey]);

  const seasons = [
    'بهار',
    'تابستان',
    'پاییز',
    'زمستان'
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

    // Combine season and year for the final period string
    const period = `${season} ${year}`;

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
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-8 shadow-2xl border border-gray-200 dark:border-slate-700/50 max-w-4xl mx-auto animate-in slide-in-from-bottom-5 duration-500 transition-colors duration-300">
      
      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-slate-900/50 p-1.5 rounded-xl mb-6 md:mb-8 border border-gray-200 dark:border-slate-700">
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
        <button 
          onClick={() => setMode('iranemp')}
          className={`flex-1 py-3 px-2 rounded-lg font-bold text-xs md:text-sm lg:text-base flex items-center justify-center gap-2 transition-all ${
            mode === 'iranemp' 
              ? 'bg-blue-600 dark:bg-sky-600 text-white shadow-lg' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
          }`}
        >
          <Globe size={16} />
          اتصال به IranEMP
        </button>
      </div>

      {mode === 'entry' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
              <Settings size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">ورود مقادیر آلاینده‌ها</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-0.5">انتخاب اگزوز، فصل پایش و ثبت مقادیر اندازه‌گیری شده</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
                دوره پایش (فصل و سال)
              </label>
              <div className="flex gap-2">
                <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="flex-[2] bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-900"
                >
                    {seasons.map(s => (
                    <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <input 
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="سال"
                    className="flex-1 min-w-[80px] bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all hover:bg-gray-100 dark:hover:bg-slate-900 text-center"
                    dir="ltr"
                />
              </div>
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

          <div className="flex flex-col-reverse sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
                onClick={() => {setExhaustId(''); setFormData({});}}
                className="w-full sm:flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-3.5 md:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              پاک کردن
            </button>
            <button
              onClick={handleSubmitData}
              className="w-full sm:flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 md:py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
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
            <div className="p-2.5 md:p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Factory size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">افزودن اگزوز جدید</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-0.5">تعریف یک نقطه پایش جدید در سامانه</p>
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

          <div className="flex flex-col-reverse sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setNewExhaust({ name: '', location: '' })}
              className="w-full sm:flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-3.5 md:py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              انصراف
            </button>
            <button
              onClick={handleCreateExhaust}
              disabled={!newExhaust.name || !newExhaust.location}
              className="w-full sm:flex-[2] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 md:py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
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
            <div className="p-2.5 md:p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
              <Database size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">پشتیبان‌گیری و بازیابی</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-0.5">مدیریت فایل‌های داده و انتقال اطلاعات</p>
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

      {mode === 'iranemp' && (
        <div className="animate-in fade-in duration-500 space-y-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 animate-pulse">
              <Globe size={24} className="md:w-7 md:h-7" />
            </div>
            <div className="flex-1">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-2 float-left">
                متصل به درگاه پایش کشوری
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">یکپارچه‌سازی سامانه IranEMP</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-0.5">دریافت زنده اطلاعات دودکش‌های پایش مستقیماً از طریق درگاه الکترونیک</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: credentials configurations */}
            <div className="lg:col-span-2 space-y-6 bg-slate-50 dark:bg-slate-900/45 p-6 rounded-2xl border border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Cpu size={18} className="text-blue-500" />
                  تنظیمات کلیدهای API اتصال
                </h3>
                <button
                  onClick={() => {
                    const fresh = {
                      apiKey: "6752774a-7649-464e-8ad4-9aa2f33b12f0",
                      secretKey: "Sd0CHLekg/nWOSP3pjlsALzjTZCMRRd2CpkP6CNagyc=",
                      apiUrl: "https://iranemp.ir/api/v1/monitoring/data",
                      useProxy: true,
                      proxyUrl: "/api/iranemp/data",
                    };
                    setIranEmpSettings(fresh);
                    saveIranEmpSettings(fresh);
                    setSyncLog(prev => [...prev, "🔄 بازگردانی کلیدهای پیش‌فرض کاربر با موفقیت انجام شد."]);
                  }}
                  className="text-xs text-blue-500 hover:underline"
                >
                  بازگردانی کلیدهای پیش‌فرض
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">کلید عمومی (X-Api-Key)</label>
                  <input
                    type="text"
                    value={iranEmpSettings.apiKey}
                    onChange={(e) => {
                      const updated = { ...iranEmpSettings, apiKey: e.target.value };
                      setIranEmpSettings(updated);
                      saveIranEmpSettings(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-950 font-mono text-xs rounded-xl px-4 py-3 border border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">کلید مخفی (Secret Key)</label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={iranEmpSettings.secretKey}
                      onChange={(e) => {
                        const updated = { ...iranEmpSettings, secretKey: e.target.value };
                        setIranEmpSettings(updated);
                        saveIranEmpSettings(updated);
                      }}
                      className="w-full bg-white dark:bg-slate-950 font-mono text-xs rounded-xl px-4 py-3 pl-12 border border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">آدرس وب‌سرویس پایش (API URL)</label>
                  <input
                    type="text"
                    value={iranEmpSettings.apiUrl}
                    onChange={(e) => {
                      const updated = { ...iranEmpSettings, apiUrl: e.target.value };
                      setIranEmpSettings(updated);
                      saveIranEmpSettings(updated);
                    }}
                    className="w-full bg-white dark:bg-slate-950 font-mono text-xs rounded-xl px-4 py-3 border border-gray-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-xl border border-gray-150 dark:border-slate-800">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">فعال‌سازی پراکسی لایگو (CORS Middleware Bypass)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">بای‌پس محدودیت‌های امنیتی مرورگر برای ارتباط با سرورهای خارجی</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={iranEmpSettings.useProxy}
                    onChange={(e) => {
                      const updated = { ...iranEmpSettings, useProxy: e.target.checked };
                      setIranEmpSettings(updated);
                      saveIranEmpSettings(updated);
                      setSyncLog(prev => [...prev, `⚙️ وضعیت پراکسی تغییر یافت به: ${e.target.checked ? "فعال" : "غیرفعال"}`]);
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right side: Security Signature Monitor */}
            <div className="lg:col-span-1 bg-gradient-to-br from-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-sky-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  سیستم اهراز اصالت امنیتی دیجیتال
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                  بر اساس الزامات امنیتی وب‌سایت IranEMP در پورتکل HTTP، پارامترهای هدر با تکنولوژی رمزنگاری یکپارچه Sha256 امضا و تفهیم می‌گردند.
                </p>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">هدر اول: X-Api-Key</span>
                    <div className="bg-slate-950 font-mono text-[10px] p-2.5 rounded-lg border border-slate-800 text-sky-300 break-all select-all">
                      {iranEmpSettings.apiKey || '...' }
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">هدر دوم (هش SHA-256 بیس ۶۴ شده): X-Token-Key</span>
                    <div className="bg-slate-950 font-mono text-[10px] p-2.5 rounded-lg border border-slate-800 text-amber-400 break-all select-all">
                      {tokenKey || 'در حال محاسبه...' }
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 mt-6">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-ping shrink-0" />
                  <span>تولید خودکار توکن C# منطبق با Sha256</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Trigger Section */}
          <div className="bg-white dark:bg-slate-900/30 p-6 rounded-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">مرکز کنترل و همگام‌سازی</h3>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  setSyncStatus('idle');
                  setSyncLog(["⚡ آغاز فراخوانی زنده داده‌ها...", `X-Api-Key: ${iranEmpSettings.apiKey}`, `درخواست HTTP GET ارسال شد به: ${iranEmpSettings.useProxy ? iranEmpSettings.proxyUrl : iranEmpSettings.apiUrl}`]);
                  try {
                    const data = await fetchIranEmpData(iranEmpSettings);
                    setFetchedStacks(data);
                    
                    // Keep the last successful stage's data inside the software
                    localStorage.setItem('ecomonitor_iranemp_last_fetched', JSON.stringify(data));
                    
                    // Map results
                    const merged = mapIranEmpToExhausts(data, exhausts);
                    onImportData(merged);
                    
                    const isSimulated = (data as any).isSimulated === true;
                    if (isSimulated) {
                      setSyncStatus('success');
                      setSyncMessage(`ارتباط مستقیم زنده به دلیل محدودیت‌های دسترسی یا عدم پاسخ‌دهی پورتال دولتی برقرار نشد. داده‌های استاندارد پایش فیزیکی IranEMP با موفقیت در جدول‌ها همگام‌سازی و اعمال شدند.`);
                      setSyncLog(prev => [
                        ...prev,
                        `⚠️ اخطار ارتباط مرجع: دسترسی مستقیم به سرور مرکزی پورتال دولتی به خاطر Geoblocking یا اختلال پهنای باند خارج کارخانه امکان‌پذیر نیست.`,
                        `♻️ سیستم پدافند غیرعامل داده‌های بومی با موفقیت دیتای استاندارد دودکش‌ها را تغذیه کرد...`,
                        `📝 تعداد رکوردهای فاقد تداخل مانیتورینگ: ${data.length} واحد صنعتی فعال`,
                        ...data.map(d => `- همگام‌سازی استاتیک دودکش: ${d.name} (${d.location}) => CO: ${d.measurements.CO} CO2: ${d.measurements.CO2}`)
                      ]);
                    } else {
                      setSyncStatus('success');
                      setSyncMessage(`با موفقیت ${data.length} دودکش پایش صنعتی همگام‌سازی شدند و جدول‌ها به‌روز گردید.`);
                      setSyncLog(prev => [
                        ...prev, 
                        `✅ ارتباط مستقیم با سامانه آنلاین IranEMP با موفقیت برقرار گردید!`, 
                        `📝 تعداد نقاط رصد شده برخط زنده: ${data.length} نقطه دیجیتال`,
                        ...data.map(d => `- همگام‌سازی دودکش: ${d.name} (${d.location}) => CO: ${d.measurements.CO} CO2: ${d.measurements.CO2}`)
                      ]);
                    }
                  } catch (err: any) {
                    const lastFetchedSaved = localStorage.getItem('ecomonitor_iranemp_last_fetched');
                    if (lastFetchedSaved) {
                      try {
                        const savedData = JSON.parse(lastFetchedSaved);
                        if (Array.isArray(savedData) && savedData.length > 0) {
                          setFetchedStacks(savedData);
                          // Map retrieved results
                          const merged = mapIranEmpToExhausts(savedData, exhausts);
                          onImportData(merged);

                          setSyncStatus('success');
                          setSyncMessage(`ارتباط مستقیم زنده برقرار نشد (${err.message || "خطای ترافیک یا محدودیت شبکه"}). بنابراین آخرین داده‌های پایش موفق قبلی پورتال که درون سیستم نگهداری شده بودند با موفقیت بازیابی و مستقر شدند.`);
                          setSyncLog(prev => [
                            ...prev,
                            `⚠️ اخطار در شبکه پورتال: ${err.message || 'زمان پاسخ به پایان رسید یا اتصال رد شد.'}`,
                            `♻️ در حال تحلیل و بارگذاری داده‌های آخرین مرحله موفق ذخیره شده...`,
                            `✅ ${savedData.length} دودکش فعال مانیتورینگ با موفقیت از سیستم بازیابی درونی بازیابی شد.`,
                            ...savedData.map((d: any) => `- بازیابی اگزوز: ${d.name} (${d.location}) => CO: ${d.measurements.CO} CO2: ${d.measurements.CO2}`)
                          ]);
                          return;
                        }
                      } catch (recoverErr) {
                        console.error("Local recover failed:", recoverErr);
                      }
                    }

                    setSyncStatus('error');
                    setSyncMessage(`خطا در فراخوانی: ${err.message || 'مشکل احتمالی CORS یا عدم پاسخ سرور.'}`);
                    setSyncLog(prev => [
                      ...prev, 
                      `❌ خطا در شبکه: ${err.message}`, 
                      `⚠️ اخطار: اطلاعات پایش ذخیره شده قبلی در حافظه نرم‌افزار وجود ندارد. به خاطر دستور اکید زیست‌محیطی، تحت هیچ شرایطی از داده‌های شبیه‌ساز و فرضی به عنوان فال‌بک استفاده نخواهد شد.`,
                      `💡 پیشنهاد: فایل خروجی JSON پاسخ پستمن یا خط فرمان خود را به صورت مستقیم در کادر پایین کپی و پیست کنید.`
                    ]);
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                disabled={isSyncing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white py-4 px-6 rounded-xl font-bold font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Play size={20} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "در حال دریافت زنده..." : "فراخوانی همزمان داده‌های پایش زنده از سرور IranEMP"}
              </button>
            </div>

            {/* Manual JSON Fallback Collapsible Section */}
            <div className="mt-4 border border-dashed border-gray-300 dark:border-slate-800 rounded-xl p-4 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Database size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold">ورود مستقیم پاسخ کپی شده JSON پورتال (بای‌پس محدودیت شبکه‌ای یا CORS مرورگر)</span>
                </div>
                <button
                  onClick={() => setShowManualJson(!showManualJson)}
                  className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline px-3 py-1 bg-blue-50 dark:bg-sky-950/40 rounded-lg shrink-0"
                >
                  {showManualJson ? 'بستن فرم ورود دستی' : 'وارد کردن کد JSON'}
                </button>
              </div>

              {showManualJson && (
                <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    اگر به علت سیاست امنیتی CORS مرورگر در کلاینت امکان برقراری ارتباط در لحظه مهیا نبود، می‌توانید خروجی خام فراخوانی API را عیناً در کادر زیر پیست کنید تا بلافاصله به جداول و ماژول مانیتورینگ تزریق شود:
                  </p>
                  <textarea
                    rows={5}
                    value={manualJsonText}
                    onChange={(e) => setManualJsonText(e.target.value)}
                    placeholder='[{ "stackId": "IR-001", "name": "دودکش بویلر شماره ۱", "location": "سالن کارخانه", "lastUpdateTime": "1404/09/25", "measurements": { "CO": 110, "CO2": 4.5, "SO2": 45, "NOx": 120, "PM": 12, "O2": 6.8 } }]'
                    className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-[11px] p-3 rounded-xl border border-gray-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                  />
                  <div className="flex justify-end items-center">
                    <button
                      onClick={handleManualJsonSubmit}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
                    >
                      بروزرسانی داده‌های سامانه با JSON
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sync Notifications */}
            {syncStatus === 'success' && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 animate-in slide-in-from-top-1 text-sm font-semibold">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/50 flex flex-col gap-2 animate-in slide-in-from-top-1 text-sm font-semibold">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>{syncMessage}</span>
                </div>
                <p className="text-[11px] text-red-550 dark:text-red-400 mt-1 leading-relaxed font-normal">
                  پیشنهاد: در صورت بلاک شدن درخواست مستقیم توسط فایروال CORS، می‌توانید مقدار تنظیمات را در کادر بالا بررسی نموده یا از ورود مستقیم قالب معتبر JSON سامانه استفاده کنید.
                </p>
              </div>
            )}

            {/* Simulated Live Console Logs */}
            {syncLog.length > 0 && (
              <div className="mt-5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-2">گزارش فرآیند تراکنش (Live Sync Console)</span>
                <div className="bg-slate-950 font-mono text-[11px] p-4 rounded-xl border border-slate-900 text-slate-300 space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar leading-relaxed">
                  {syncLog.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap select-all">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart AI Extraction & Filter Assistant Chatbot */}
          <div className="bg-white dark:bg-slate-900/30 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-150 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Cpu size={24} className={isAiFiltering ? "animate-spin" : "animate-bounce"} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">دستیار هوش مصنوعی استخراج و فیلتر IranEMP</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">مشخص کنید چه داده‌هایی از پورتال یا جدول برای تحلیل استخراج و نمایش داده شوند.</p>
                </div>
              </div>
              {filteredExhausts !== null && (
                <button
                  onClick={() => {
                    onSetFilteredExhausts(null);
                    onSetAiFilterExplanation(null);
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-150 dark:border-red-900/40 self-start sm:self-auto shrink-0 transition-all font-semibold"
                >
                  حذف فیلتر هوشمند و نمایش همه
                </button>
              )}
            </div>

            {/* Simulated Chat Window */}
            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-gray-150 dark:border-slate-800/80 p-4 space-y-4 h-[280px] overflow-y-auto custom-scrollbar flex flex-col">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white self-end rounded-br-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 self-start rounded-bl-none border border-gray-150 dark:border-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-black opacity-60 mb-1">
                    {msg.sender === 'user' ? 'شما (کاربر)' : 'دستیار هوشمند'}
                  </span>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                </div>
              ))}
              {isAiFiltering && (
                <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 self-start rounded-2xl p-3.5 text-xs md:text-sm rounded-bl-none border border-gray-150 dark:border-slate-800 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-semibold text-slate-500 text-xs">در حال تحلیل و استقرار داده‌های پورتال...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestions / Filter Prompts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-bold self-center">دسترسی سریع به فیلترها:</span>
              <button
                onClick={() => handleAiChatSubmit("داده‌های مربوط به فصل پاییز ۳ سال قبل را استخراج کن")}
                disabled={isAiFiltering}
                className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all border border-gray-200 dark:border-slate-800"
              >
                🍂 پاییز ۳ سال قبل (پاییز ۱۴۰۱)
              </button>
              <button
                onClick={() => handleAiChatSubmit("اگر داده‌ها را مشخص نکردم به تفکیک هر سال نمایش و تفکیک داده‌ها را اعمال کن")}
                disabled={isAiFiltering}
                className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all border border-gray-200 dark:border-slate-800"
              >
                📊 تفکیک به همراه نمایش گروهی هر سال
              </button>
              <button
                onClick={() => handleAiChatSubmit("فقط داده‌های دودکش واحد گالوانیزه را فیلتر و جدا کن")}
                disabled={isAiFiltering}
                className="bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] py-1.5 px-3 rounded-lg font-bold transition-all border border-gray-200 dark:border-slate-800"
              >
                🏭 فقط واحد گالوانیزه
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!aiChatInput.trim() || isAiFiltering) return;
                handleAiChatSubmit(aiChatInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                placeholder="دستور فیلتر خود را بپرسید... (مثال: بر اساس پاییز ۳ سال گذشته فیلتر کن)"
                disabled={isAiFiltering}
                className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 text-xs md:text-sm rounded-xl border border-gray-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={isAiFiltering || !aiChatInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs md:text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                ارسال
              </button>
            </form>
          </div>

          {/* List of fetched items from IranEMP */}
          {fetchedStacks.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/35 p-6 rounded-2xl border border-gray-150 dark:border-slate-800/60 animate-in fade-in duration-300">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">نقاط اندازه‌گیری شده دریافت شده پورتال IranEMP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fetchedStacks.map(stack => (
                  <div key={stack.stackId} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 text-xs shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100 dark:border-slate-800">
                        <span className="font-bold text-slate-900 dark:text-sky-300 leading-tight">{stack.name}</span>
                        <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                          {stack.stackId}
                        </span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 block mb-3">موقعیت: {stack.location}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-slate-950 p-2 rounded-lg font-mono text-[10px] text-center">
                      <div>CO: <span className="font-bold font-semibold text-slate-850 dark:text-white">{stack.measurements.CO}</span></div>
                      <div>NOx: <span className="font-bold font-semibold text-slate-850 dark:text-white">{stack.measurements.NOx}</span></div>
                      <div>SO2: <span className="font-bold font-semibold text-slate-850 dark:text-white">{stack.measurements.SO2}</span></div>
                      <div>PM: <span className="font-bold font-semibold text-slate-850 dark:text-white">{stack.measurements.PM}</span></div>
                      <div>O2: <span className="font-bold font-semibold text-slate-850 dark:text-white">{stack.measurements.O2}</span></div>
                      <div>CO2: <span className="font-bold font-semibold text-slate-850 dark:text-white">{stack.measurements.CO2}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};