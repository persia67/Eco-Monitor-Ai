import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-800 border border-red-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-4 text-red-500 mb-6">
              <AlertTriangle size={48} />
              <h1 className="text-2xl font-bold">متاسفانه خطایی رخ داده است</h1>
            </div>
            
            <p className="text-slate-300 mb-4">
              نرم‌افزار با یک خطای غیرمنتظره مواجه شد. لطفاً صفحه را بازنشانی کنید یا با پشتیبانی تماس بگیرید.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 overflow-auto max-h-48 mb-6" dir="ltr">
              <code className="text-red-400 text-xs font-mono">
                {this.state.error && this.state.error.toString()}
              </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCcw size={20} />
              بازنشانی نرم‌افزار
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}