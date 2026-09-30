import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('UI crashed:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4 text-right">
          <h1 className="text-xl font-black text-slate-900">حدث خطأ غير متوقع</h1>
          <p className="text-slate-600">تعذّر عرض الصفحة. أعد تحميل التطبيق وحاول مرة أخرى.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
          >
            إعادة التحميل
          </button>
        </div>
      </div>
    );
  }
}
