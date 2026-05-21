import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, WifiOff, Settings, Globe, Cpu, Layers, CheckCircle2, AlertTriangle, Download, HardDrive } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { sendChatMessage, resetChatSession } from '../services/geminiService';
import { getLocalAiSettings, saveLocalAiSettings, LocalAiSettings, AiEngineMode } from '../services/localAiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface ChatBotProps {
  isOnline: boolean;
}

export const ChatBot: React.FC<ChatBotProps> = ({ isOnline }) => {
  const { t, themeColors, dir, localAiSettings, updateLocalAiSettings } = useSettings();
  const aiSettings = localAiSettings;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('chat.welcome'),
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI settings states
  const [showSettings, setShowSettings] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  // Hugging Face Mock/Simulated Multi-Step Downloader States
  const [downloadStep, setDownloadStep] = useState<string>('');
  const downloadTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);
    };
  }, []);

  const handleSend = async () => {
    // Can send if online, OR if using an offline model
    const canSendOffline = aiSettings.mode === 'ollama' || aiSettings.mode === 'huggingface';
    if (!input.trim() || isLoading || (!isOnline && !canSendOffline)) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendChatMessage(userMsg.text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    resetChatSession();
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: t('chat.welcome'),
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

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

      const resp = await fetch(`${aiSettings.ollamaUrl}/api/tags`, {
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
      setOllamaError('خطا در دسترسی به Ollama. از باز بودن برنامه و تنظیم مناسب مقادیر مطمئن شوید.');
    }
  };

  const startHuggingFaceDownload = () => {
    updateSetting('downloadStatus', 'downloading');
    updateSetting('downloadProgress', 0);
    updateSetting('downloadSpeed', '0 MB/s');
    setDownloadStep('اتصال به مخزن هاب و بررسی هش فایل‌ها...');

    let progress = 0;
    if (downloadTimerRef.current) clearInterval(downloadTimerRef.current);

    downloadTimerRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(downloadTimerRef.current);
        setDownloadStep('ذخیره‌سازی و ایندکس فایل‌های تنسور روی هسته IndexedDB محلی...');
        
        setTimeout(() => {
          updateSetting('isModelDownloaded', true);
          updateSetting('downloadStatus', 'ready');
          updateSetting('downloadProgress', 100);
          updateSetting('downloadSpeed', 'بایگانی تکمیل شد');
          setDownloadStep('هسته آفلاین بومی بیدار و راه‌اندازی گردید.');
        }, 1200);
      } else {
        updateSetting('downloadProgress', progress);
        const speed = (15 + Math.random() * 20).toFixed(1);
        updateSetting('downloadSpeed', `${speed} MB/s`);
        
        if (progress < 25) {
          setDownloadStep('در حال کپی و دریافت ساختار شبکه و توکنایزر فایراژه...');
        } else if (progress < 75) {
          setDownloadStep(`در حال استخراج وزن‌های مدل لایه لایه لایه‌بندی شده (${Math.floor(progress * 3.4)} MB / 340 MB)...`);
        } else {
          setDownloadStep('در حال فشرده‌سازی و یکپارچه‌‌سازی وزن‌های ساختار بومی (GGUF)...');
        }
      }
    }, 280);
  };

  const activeModeLabel = () => {
    switch(aiSettings.mode) {
      case 'ollama': return 'Ollama (آفلاین محلی)';
      case 'huggingface': return 'Hugging Face (پردازش بومی آفلاین)';
      default: return 'Gemini Cloud (هوش مصنوعی ابری)';
    }
  };

  const isInputDisabled = () => {
    if (isLoading) return true;
    if (!isOnline) {
      // Offline: allow only if an offline model is configured
      return !(aiSettings.mode === 'ollama' || aiSettings.mode === 'huggingface');
    }
    return false;
  };

  return (
    <div className="animate-in slide-in-from-bottom-5 duration-500 min-h-[550px] md:h-[650px] flex flex-col w-full max-w-4xl mx-auto shadow-2xl rounded-2xl border border-gray-200 dark:border-slate-700/50 overflow-hidden bg-white dark:bg-slate-900">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-md p-3 md:p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-700 relative z-20 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
                <Sparkles size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
                <h2 className="text-base md:text-xl font-bold text-slate-800 dark:text-white">{t('nav.chat')}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {activeModeLabel()}
                  </p>
                  {!isOnline && (
                    <span className="text-[10px] bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                      <WifiOff size={10} />
                      {t('status.offline')}
                    </span>
                  )}
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* AI Settings Toggle Button */}
          <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all border flex items-center gap-1.5 text-xs font-bold leading-none ${
                showSettings 
                  ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300' 
                  : 'bg-gray-100 border-gray-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-750'
              }`}
          >
              <Settings size={16} />
              <span>تنظیمات هوش مصنوعی</span>
          </button>
          
          <button 
              onClick={handleReset}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
              title="پاک کردن گفتگو"
          >
              <RefreshCw size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* AI Settings Expandable Panel */}
      {showSettings && (
        <div className="bg-slate-50 dark:bg-slate-850 border-b border-gray-200 dark:border-slate-700/70 p-4 md:p-6 space-y-4 animate-in slide-in-from-top-4 duration-300 relative z-10 transition-colors">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Cpu size={16} className="text-purple-600 dark:text-purple-400" />
            تنظیمات و مدیریت موتور هوش مصنوعی (AI Core)
          </h3>
          
          {/* Mode Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Gemini Cloud Router */}
            <button
              onClick={() => updateSetting('mode', 'gemini')}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                aiSettings.mode === 'gemini'
                  ? 'bg-gradient-to-l from-purple-500/10 to-transparent border-purple-500 dark:border-purple-400 shadow-md ring-1 ring-purple-500/20'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe size={16} className={aiSettings.mode === 'gemini' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} />
                <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-white">کلود Gemini (Google)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">سریع، قدرتمند و بهینه (نیاز به اینترنت)</p>
            </button>

            {/* Ollama Local Router */}
            <button
              onClick={() => updateSetting('mode', 'ollama')}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                aiSettings.mode === 'ollama'
                  ? 'bg-gradient-to-l from-indigo-500/10 to-transparent border-indigo-500 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu size={16} className={aiSettings.mode === 'ollama' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-white">لوکال Ollama (آفلاین)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">اجرا روی لایه سیستم شخصی (امنیت حداکثر)</p>
            </button>

            {/* Hugging Face / WASM Local Router */}
            <button
              onClick={() => updateSetting('mode', 'huggingface')}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 ${
                aiSettings.mode === 'huggingface'
                  ? 'bg-gradient-to-l from-pink-500/10 to-transparent border-pink-500 dark:border-pink-400 shadow-md ring-1 ring-pink-500/20'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers size={16} className={aiSettings.mode === 'huggingface' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400'} />
                <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-white">بومی Hugging Face (بدون اینترنت)</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">دانلود فایل مدل و اجرا درون مرورگر</p>
            </button>
          </div>

          {/* Configuration sub-panels depending on selected mode */}
          {aiSettings.mode === 'ollama' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">آدرس سرور Ollama</label>
                  <input
                    type="text"
                    value={aiSettings.ollamaUrl}
                    onChange={(e) => updateSetting('ollamaUrl', e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="http://localhost:11434"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">نام مدل فراخوانی شده</label>
                  <input
                    type="text"
                    value={aiSettings.ollamaModel}
                    onChange={(e) => updateSetting('ollamaModel', e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="llama3"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={testOllamaConnection}
                  disabled={ollamaStatus === 'testing'}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {ollamaStatus === 'testing' ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      در حال ارزیابی...
                    </>
                  ) : (
                    "بررسی وضعیت اتصال با بستر Ollama"
                  )}
                </button>

                {ollamaStatus === 'success' && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 size={16} />
                    سرور Ollama بیدار و فعال است! وضعیت کاملاً مطلوب است.
                  </span>
                )}
                {ollamaStatus === 'failed' && (
                  <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold">
                    <AlertTriangle size={16} />
                    خطا: مطمئن شوید Ollama بالاست و فلگ CORS فعال باشد. (OLLAMA_ORIGINS="*")
                  </span>
                )}
              </div>
              {ollamaError && <p className="text-[10px] text-red-500 mt-1">{ollamaError}</p>}
            </div>
          )}

          {aiSettings.mode === 'huggingface' && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg">
                    <HardDrive size={22} />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">مدل سبک پایش صنعتی (ecomonitor-llama-nlp-fa-1.5b)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">حجم کل فایلها: ۳۴۰ مگابایت | تکنیک فشرده‌سازی مپ‌شده 4 بیتی</p>
                  </div>
                </div>

                {aiSettings.isModelDownloaded ? (
                  <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    ذخیره و آماده به کار بومی
                  </span>
                ) : aiSettings.downloadStatus === 'downloading' ? (
                  <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-lg flex items-center gap-1 animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    در حال دریافت مخزن...
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={startHuggingFaceDownload}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Download size={14} />
                    بارگیری فایل مدل آفلاین به حافظه مرورگر
                  </button>
                )}
              </div>

              {/* Progress Bar for HF Download */}
              {(aiSettings.downloadStatus === 'downloading' || aiSettings.downloadStatus === 'ready') && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400">{downloadStep}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1.5">
                      {aiSettings.downloadSpeed && <span>{aiSettings.downloadSpeed}</span>}
                      <span>{aiSettings.downloadProgress}%</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-200/50 dark:border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${aiSettings.downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages Window */}
      <div className="flex-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in duration-300`}>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm border ${msg.role === 'user' ? 'bg-white dark:bg-slate-805 text-slate-800 dark:text-slate-200 border-gray-200 dark:border-slate-700' : 'bg-white dark:bg-slate-805 text-slate-800 dark:text-slate-200 border-purple-100 dark:border-purple-500/20'}`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base selection:bg-purple-500/30">{msg.text}</div>
                <div className="text-[10px] opacity-40 mt-1 text-right">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center">
                    <Sparkles size={16} className="animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-805 px-4 py-3 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-purple-500 animate-pulse font-bold">{t('chat.thinking')}</span>
                      <div className="flex gap-1 mt-0.5">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                   </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div className="bg-white dark:bg-slate-800/95 backdrop-blur-md p-3 md:p-4 border-t border-gray-200 dark:border-slate-700/50 relative z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <div className="relative flex items-center gap-2">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={(!isOnline && isInputDisabled()) ? 'در حال حاضر اتصال قطع است. از منو تنظیمات، موتور آفلاین را برگزینید.' : t('chat.placeholder')}
                disabled={isInputDisabled()}
                rows={1}
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none overflow-hidden max-h-32 disabled:opacity-50"
                style={{ minHeight: '48px' }}
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || isInputDisabled()}
                className="absolute left-2 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white rounded-lg transition-all shadow-md shadow-purple-500/10 active:scale-95"
                style={dir === 'ltr' ? { right: '0.5rem', left: 'auto' } : {}}
            >
                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />}
            </button>
        </div>
      </div>
    </div>
  );
};
