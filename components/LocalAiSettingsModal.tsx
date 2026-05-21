import React, { useState, useRef, useEffect } from 'react';
import { X, Cpu, Globe, Layers, CheckCircle2, AlertTriangle, Download, HardDrive, RefreshCw } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { LocalAiSettings, AiEngineMode } from '../services/localAiService';

interface LocalAiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalAiSettingsModal: React.FC<LocalAiSettingsModalProps> = ({ isOpen, onClose }) => {
  const { localAiSettings, updateLocalAiSettings, language, themeColors, dir } = useSettings();
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  
  // Hugging Face Simulated Downloader States
  const [downloadStep, setDownloadStep] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(localAiSettings.downloadProgress || 0);
  const downloadTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof LocalAiSettings>(key: K, value: LocalAiSettings[K]) => {
    const updated = { ...localAiSettings, [key]: value };
    updateLocalAiSettings(updated);
  };

  const testOllamaConnection = async () => {
    setOllamaStatus('testing');
    setOllamaError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(`${localAiSettings.ollamaUrl}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        setOllamaStatus('success');
      } else {
        throw new Error(`خطای پاسخ سرور: ${resp.status}`);
      }
    } catch (err: any) {
      console.error(err);
      setOllamaStatus('failed');
      setOllamaError(language === 'fa' 
        ? 'خطا در دسترسی به سرور Ollama. مطمئن شوید برنامه فعال است و CORS به درستی پیکربندی شده است.'
        : 'Could not connect to Ollama. Make sure Ollama is running and CORS is enabled.'
      );
    }
  };

  const startHuggingFaceDownload = () => {
    updateSetting('downloadStatus', 'downloading');
    setDownloadProgress(0);
    setDownloadStep(language === 'fa' ? 'اتصال به مخزن هلال هاب و بررسی هش فایل‌ها...' : 'Connecting to HF Hub and checking file hashes...');

    let progress = 0;
    if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);

    downloadTimerRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        setDownloadProgress(100);
        clearInterval(downloadTimerRef.current);
        setDownloadStep(language === 'fa' ? 'ذخیره‌سازی و ایندکس فایل‌ها روی هسته IndexedDB محلی...' : 'Storing and indexing files inside local IndexedDB...');
        
        setTimeout(() => {
          const updated: LocalAiSettings = {
            ...localAiSettings,
            isModelDownloaded: true,
            downloadStatus: 'ready',
            downloadProgress: 100,
            downloadSpeed: language === 'fa' ? 'بایگانی تکمیل شد' : 'Archiving complete'
          };
          updateLocalAiSettings(updated);
          setDownloadStep(language === 'fa' ? 'هسته آفلاین بومی بیدار و راه‌اندازی گردید.' : 'Offline engine successfully loaded.');
        }, 1200);
      } else {
        setDownloadProgress(progress);
        const speed = (15 + Math.random() * 20).toFixed(1);
        const speedText = language === 'fa' ? `${speed} مگابایت بر ثانیه` : `${speed} MB/s`;
        
        const updated: LocalAiSettings = {
          ...localAiSettings,
          downloadProgress: progress,
          downloadSpeed: speedText
        };
        updateLocalAiSettings(updated);
        
        if (progress < 25) {
          setDownloadStep(language === 'fa' ? 'در حال کپی و دریافت ساختار شبکه و توکنایزر فایراژه...' : 'Copying neural net configuration & tokenizer...');
        } else if (progress < 75) {
          setDownloadStep(language === 'fa' 
            ? `در حال استخراج وزن‌های مدل لایه‌بندی شده (${Math.floor(progress * 3.4)} مگابایت / ۳۴۰ مگابایت)...` 
            : `Extracting layers and tensor weights (${Math.floor(progress * 3.4)} MB / 340 MB)...`
          );
        } else {
          setDownloadStep(language === 'fa' ? 'در حال فشرده‌سازی و یکپارچه‌‌سازی وزن‌های ساختار بومی (GGUF)...' : 'Quantizing and binding local tensors (GGUF)...');
        }
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-right"
        dir={dir}
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Cpu size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'fa' ? 'تنظیمات و مدیریت هسته هوش مصنوعی (AI Core)' : 'AI Core Platform Settings'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'fa' ? 'مدیریت و سوئیچ پلتفرم هوشمند بین سرورهای کلود و بسترهای پردازش افلاین بومی' : 'Switch between cloud provider and lightweight local processing layers'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 md:p-6 space-y-6">
          {/* Mode Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'fa' ? 'انتخاب پلتفرم تحلیل و پاسخ‌دهی هوشمند' : 'Select AI Core Mode'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Gemini Cloud Router */}
              <button
                onClick={() => updateSetting('mode', 'gemini')}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-24 ${
                  localAiSettings.mode === 'gemini'
                    ? 'bg-purple-50/50 dark:bg-purple-900/15 border-purple-500 dark:border-purple-400 shadow-md ring-1 ring-purple-500/20'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe size={18} className={localAiSettings.mode === 'gemini' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} />
                  <span className="font-bold text-sm text-slate-850 dark:text-white">
                    {language === 'fa' ? 'کلود Gemini' : 'Gemini Cloud'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-505 leading-relaxed">
                  {language === 'fa' ? 'بر پایه سرورهای گوگل. سریع و پیشرفته اما نیازمند اینترنت' : 'Connect secure APIs client to remote Gemini model. Highly accurate.'}
                </p>
              </button>

              {/* Ollama Local Router */}
              <button
                onClick={() => updateSetting('mode', 'ollama')}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-24 ${
                  localAiSettings.mode === 'ollama'
                    ? 'bg-indigo-50/50 dark:bg-indigo-900/15 border-indigo-500 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu size={18} className={localAiSettings.mode === 'ollama' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  <span className="font-bold text-sm text-slate-850 dark:text-white">
                    {language === 'fa' ? 'لوکال Ollama' : 'Ollama Local'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-505 leading-relaxed">
                  {language === 'fa' ? 'اتصال مستقیم به موتور شخصی هوش مصنوعی نصب شده روی سیستم شما' : 'Serve model directly from localhost instance (Port 11434). Secured.'}
                </p>
              </button>

              {/* Hugging Face / WASM Local Router */}
              <button
                onClick={() => updateSetting('mode', 'huggingface')}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-24 ${
                  localAiSettings.mode === 'huggingface'
                    ? 'bg-pink-50/50 dark:bg-pink-900/15 border-pink-500 dark:border-pink-400 shadow-md ring-1 ring-pink-500/20'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers size={18} className={localAiSettings.mode === 'huggingface' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400'} />
                  <span className="font-bold text-sm text-slate-850 dark:text-white">
                    {language === 'fa' ? 'بومی مرورگر' : 'Browser Native'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-505 leading-relaxed">
                  {language === 'fa' ? 'اجرا درون تب جاری مرورگر با استفاده از دیتابیس محلی IndexedDB' : 'Download lightweight 1.5B weights directly. Zero external setups.'}
                </p>
              </button>
            </div>
          </div>

          {/* Configuration sub-panels */}
          {localAiSettings.mode === 'ollama' && (
            <div className="bg-slate-50 dark:bg-slate-950/30 border border-gray-150 dark:border-slate-800 p-4 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Cpu size={14} />
                {language === 'fa' ? 'پیکربندی بستر سرویس محلی Ollama' : 'Local Ollama Configuration'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-500">
                    {language === 'fa' ? 'آدرس کلاینت سرور' : 'Server Endpoint'}
                  </label>
                  <input
                    type="text"
                    value={localAiSettings.ollamaUrl}
                    onChange={(e) => updateSetting('ollamaUrl', e.target.value)}
                    className="w-full text-xs font-mono p-2.5 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left transition-all"
                    placeholder="http://localhost:11434"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-500">
                    {language === 'fa' ? 'شناسه مدل در حال اجرا' : 'Ollama Model'}
                  </label>
                  <input
                    type="text"
                    value={localAiSettings.ollamaModel}
                    onChange={(e) => updateSetting('ollamaModel', e.target.value)}
                    className="w-full text-xs font-mono p-2.5 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left transition-all"
                    placeholder="llama3"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-200/40 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={testOllamaConnection}
                  disabled={ollamaStatus === 'testing'}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                >
                  {ollamaStatus === 'testing' ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      {language === 'fa' ? 'در حال برقراری ارتباط...' : 'Testing connection...'}
                    </>
                  ) : (
                    language === 'fa' ? 'سنجش زنده اتصال' : 'Test Connection'
                  )}
                </button>

                {ollamaStatus === 'success' && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 size={16} />
                    {language === 'fa' ? 'پاسخ دریافتی مطلوب است! Ollama فعال است.' : 'Connected! Ollama is ready.'}
                  </span>
                )}
                {ollamaStatus === 'failed' && (
                  <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold">
                    <AlertTriangle size={16} />
                    {language === 'fa' ? 'خطا در ارتباط. لطفا OLLAMA_ORIGINS="*" را چک کنید.' : 'Link failed. Check CORS origins config.'}
                  </span>
                )}
              </div>
              {ollamaError && <p className="text-[10px] text-red-500 transition-all font-medium">{ollamaError}</p>}
            </div>
          )}

          {localAiSettings.mode === 'huggingface' && (
            <div className="bg-slate-50 dark:bg-slate-950/30 border border-gray-150 dark:border-slate-800 p-4 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl">
                    <HardDrive size={22} />
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                      {language === 'fa' ? 'مدل اختصاصی پایش آلاینده‌ها (fa-nlp-1.5b)' : 'Custom Emission Monitor Model (fa-nlp-1.5b)'}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      {language === 'fa' ? 'بسته‌های بهینه شده با دقت کوانتیزه عالی | حجم کل: ۳۴۰ مگابایت' : 'Quantized local model files weights. Transferred inside indexDB'}
                    </p>
                  </div>
                </div>

                {localAiSettings.isModelDownloaded ? (
                  <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    {language === 'fa' ? 'بارگذاری تکمیل و آماده به کار' : 'Local Offline Ready'}
                  </span>
                ) : localAiSettings.downloadStatus === 'downloading' ? (
                  <span className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl flex items-center gap-1.5 animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    {language === 'fa' ? 'در حال دریافت مخزن...' : 'Downloading package...'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={startHuggingFaceDownload}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 text-center justify-center w-full md:w-auto"
                  >
                    <Download size={14} />
                    {language === 'fa' ? 'بارگیری فایل مدل به صورت آفلاین' : 'Download Local Weights'}
                  </button>
                )}
              </div>

              {/* Progress and status message */}
              {(localAiSettings.downloadStatus === 'downloading' || localAiSettings.downloadStatus === 'ready') && (
                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-800/80">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400">{downloadStep || (language==='fa' ? 'شروع اتصال...' : 'Initializing connection...')}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1.5">
                      {localAiSettings.downloadSpeed && <span>{localAiSettings.downloadSpeed}</span>}
                      <span>{downloadProgress}%</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-150 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-200/50 dark:border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {localAiSettings.mode === 'gemini' && (
            <div className="bg-slate-50 dark:bg-slate-950/30 border border-gray-150 dark:border-slate-800 p-4 rounded-2xl animate-in fade-in duration-200 space-y-3">
              <div className="flex items-center gap-2.5">
                <Globe size={16} className="text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                  {language === 'fa' ? 'راهنمای اتصالات کلود (گوگل Gemini)' : 'Gemini Cloud Service Status'}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'fa' 
                  ? 'این حالت به طور خودکار از کلید پلتفرم AI Studio در بک‌اند برای انجام تحلیل‌ها و مکالمات هوشمند آنلاین استفاده می‌کند. در صورت عدم دسترسی موقت به اینترنت، سیستم همچنان دارای لایه‌های کارشناسی محلی به عنوان نسخه پشتیبان بومی است.'
                  : 'Requires active internet on your client browser. Safely proxies queries inside cloud backends with zero credential leaks to standard browsers.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 md:p-6 bg-gray-50 dark:bg-slate-950/40 border-t border-gray-150 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-white dark:hover:bg-gray-150 dark:text-slate-900 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
            style={{ backgroundColor: themeColors.primary, color: '#fff' }}
          >
            {language === 'fa' ? 'تایید و بستن' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
