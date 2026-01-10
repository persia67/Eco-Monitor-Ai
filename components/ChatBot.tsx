import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, MessageSquare, Sparkles, WifiOff } from 'lucide-react';
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
    <div className="animate-in slide-in-from-bottom-5 duration-500 h-[calc(100vh-250px)] min-h-[500px] flex flex-col">
      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-t-2xl p-4 shadow-sm border-x border-t border-gray-200 dark:border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
                <Sparkles size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('nav.chat')}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gemini 3 Pro Preview</p>
                  {!isOnline && (
                    <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <WifiOff size={10} />
                      {t('status.offline')}
                    </span>
                  )}
                </div>
            </div>
        </div>
        <button 
            onClick={handleReset}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all tooltip"
            title={t('chat.clear')}
        >
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-x border-gray-200 dark:border-slate-700/50 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                    : 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'
                }`}
            >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-br-none border border-gray-200 dark:border-slate-700' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-purple-100 dark:border-purple-500/20'
            }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</div>
                <div className="text-[10px] opacity-50 mt-2 text-right dir-ltr">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none border border-purple-100 dark:border-purple-500/20">
                   <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                   </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-b-2xl p-4 border-x border-b border-gray-200 dark:border-slate-700/50">
        <div className="relative flex items-center gap-2">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isOnline ? t('chat.placeholder') : t('chat.offlinePlaceholder')}
                disabled={!isOnline}
                rows={1}
                className="w-full bg-gray-100 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none overflow-hidden max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '50px' }}
            />
            <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading || !isOnline}
                className="absolute left-2 p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20"
                style={dir === 'ltr' ? { right: '0.5rem', left: 'auto' } : {}}
            >
                {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />}
            </button>
        </div>
      </div>
    </div>
  );
};