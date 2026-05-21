import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, WifiOff } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { sendChatMessage, resetChatSession } from '../services/geminiService';

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
  const { t, themeColors, dir } = useSettings();
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isOnline) return;

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

  return (
    <div className="animate-in slide-in-from-bottom-5 duration-500 h-[65dvh] md:h-[600px] flex flex-col w-full max-w-4xl mx-auto shadow-2xl rounded-2xl border border-gray-200 dark:border-slate-700/50">
      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-md rounded-t-2xl p-3 md:p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
                <Sparkles size={20} className="md:w-6 md:h-6" />
            </div>
            <div>
                <h2 className="text-base md:text-xl font-bold text-slate-800 dark:text-white">{t('nav.chat')}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">Gemini 3 Pro (High Budget Thinking)</p>
                  {!isOnline && (
                    <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <WifiOff size={10} />
                      {t('status.offline')}
                    </span>
                  )}
                </div>
            </div>
        </div>
        <button 
            onClick={handleReset}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
        >
            <RefreshCw size={18} className="md:w-5 md:h-5" />
        </button>
      </div>

      <div className="flex-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-y-auto p-3 md:p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm border ${msg.role === 'user' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-gray-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-purple-100 dark:border-purple-500/20'}`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</div>
                <div className="text-[10px] opacity-50 mt-1 text-right">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center">
                    <Sparkles size={16} className="animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-purple-500 animate-pulse font-bold">{t('chat.thinking')}</span>
                      <div className="flex gap-1">
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

      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-md rounded-b-2xl p-3 md:p-4 border-t border-gray-200 dark:border-slate-700/50">
        <div className="relative flex items-center gap-2">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isOnline ? t('chat.placeholder') : t('chat.offlinePlaceholder')}
                disabled={!isOnline}
                rows={1}
                className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none overflow-hidden max-h-32 disabled:opacity-50"
                style={{ minHeight: '48px' }}
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !isOnline}
                className="absolute left-2 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-all"
                style={dir === 'ltr' ? { right: '0.5rem', left: 'auto' } : {}}
            >
                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />}
            </button>
        </div>
      </div>
    </div>
  );
};