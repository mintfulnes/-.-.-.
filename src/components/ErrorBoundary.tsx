import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF9F5] text-[#2B2724] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white border border-[#E5DDD0] rounded-3xl p-8 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1E1A17]">
              Виникла помилка завантаження
            </h2>
            <p className="text-sm text-[#6C6053] leading-relaxed">
              {this.state.error?.message || 'Не вдалося відобразити сторінку застосунку.'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8F4F24] hover:bg-[#783F1A] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Перезавантажити сторінку</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
