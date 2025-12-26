import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-[300] bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#2d1b4e] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="font-vibes text-3xl text-white mb-4">
              Có lỗi xảy ra
            </h2>
            <p className="text-white/80 mb-6">
              Scene 3D không thể tải được. Vui lòng tải lại trang.
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-vibes text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
            >
              Tải lại trang
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-white/60 cursor-pointer text-sm">
                  Chi tiết lỗi (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-300 bg-black/30 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

