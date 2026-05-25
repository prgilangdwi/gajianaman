import * as React from 'react';
import { CardBase } from '@/components/ui/CardBase';
import { ButtonBase } from '@/components/ui/ButtonBase';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleRetry);
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-screen)] p-4">
          <CardBase variant="elevated" padding="lg" className="max-w-md">
            <div className="flex flex-col gap-6">
              {/* Error Icon */}
              <div className="flex justify-center">
 <div className="flex items-center justify-center size-16 rounded-full bg-[var(--color-sentiment-negative-bg)]">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[var(--color-sentiment-negative)]"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Message */}
              <div className="flex flex-col gap-2 text-center">
                <h2 className="text-lg font-semibold text-[var(--color-content-primary)]">
                  Oops! Ada yang tidak beres
                </h2>
                <p className="text-sm text-[var(--color-content-secondary)]">
                  Aplikasi mengalami kesalahan yang tidak terduga. Silakan coba lagi.
                </p>
              </div>

              {/* Error Details (development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-[var(--color-sentiment-negative-bg)] rounded p-3">
                  <p className="text-xs font-mono text-[var(--color-sentiment-negative)] break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <ButtonBase
                  variant="primary"
                  size="default"
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  Coba Lagi
                </ButtonBase>
                <ButtonBase
                  variant="secondary"
                  size="default"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Kembali ke Beranda
                </ButtonBase>
              </div>
            </div>
          </CardBase>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.displayName = 'ErrorBoundary';

export { ErrorBoundary };
