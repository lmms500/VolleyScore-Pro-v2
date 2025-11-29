import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-slate-100 p-6 text-center">
          <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 mb-4 border border-rose-500/20 shadow-xl shadow-rose-500/10">
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Something went wrong</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs text-sm leading-relaxed">
            The application encountered an unexpected error. We apologize for the inconvenience.
          </p>
          <div className="flex gap-4">
             <Button onClick={this.handleReload} size="lg" className="bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20">
                <RefreshCcw size={18} /> Reload App
             </Button>
          </div>
          <p className="mt-8 text-[10px] font-mono text-slate-400 dark:text-slate-600 opacity-50">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}