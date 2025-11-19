/**
 * Error Boundary Component (v1.11.0 - Option B2)
 *
 * Catches React component errors and prevents full app crashes.
 * Provides retro-styled error UI with recovery options.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Class Component
 * Uses getDerivedStateFromError and componentDidCatch
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Log error and call onError callback
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external monitoring service (if configured)
    this.logErrorToService(error, errorInfo);
  }

  /**
   * Reset error state
   */
  resetError = (): void => {
    console.log('[ErrorBoundary] Resetting error state');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Log error to external monitoring service
   * Placeholder for integration with services like Sentry, LogRocket, etc.
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // Example: Send to monitoring service
    try {
      // window.errorTracker?.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack
      //     }
      //   }
      // });

      console.log('[ErrorBoundary] Error logged (monitoring service not configured)');
    } catch (loggingError) {
      console.error('[ErrorBoundary] Failed to log error:', loggingError);
    }
  }

  /**
   * Render error UI or children
   */
  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.resetError
        );
      }

      // Default retro error UI
      return (
        <DefaultErrorUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error UI Component
 * Retro DOS-style error screen
 */
interface DefaultErrorUIProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  onReset: () => void;
}

function DefaultErrorUI({
  error,
  errorInfo,
  errorCount,
  onReset
}: DefaultErrorUIProps): JSX.Element {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleReload = (): void => {
    window.location.reload();
  };

  const handleReportIssue = (): void => {
    const issueBody = encodeURIComponent(
      `## Error Report\n\n` +
      `**Error Message:** ${error.message}\n\n` +
      `**Stack Trace:**\n\`\`\`\n${error.stack}\n\`\`\`\n\n` +
      `**Component Stack:**\n\`\`\`\n${errorInfo?.componentStack || 'N/A'}\n\`\`\`\n\n` +
      `**Browser:** ${navigator.userAgent}\n` +
      `**Error Count:** ${errorCount}`
    );

    const issueUrl = `https://github.com/doublegate/DrSbaitso-Recreated/issues/new?title=${encodeURIComponent('Runtime Error: ' + error.message)}&body=${issueBody}`;
    window.open(issueUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-blue-900 text-white p-4 flex items-center justify-center font-mono">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="border-4 border-red-500 bg-red-900 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-pulse">⚠️</div>
            <div>
              <h1 className="text-2xl font-bold">SYSTEM ERROR</h1>
              <p className="text-sm text-red-200">Dr. Sbaitso has encountered a problem</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="border-2 border-gray-400 bg-black bg-opacity-50 p-4 mb-4">
          <h2 className="text-yellow-300 font-bold mb-2">ERROR MESSAGE:</h2>
          <p className="text-white mb-4 break-words">
            {error.message || 'Unknown error occurred'}
          </p>

          {errorCount > 1 && (
            <div className="bg-red-900 border-2 border-red-400 p-2 mb-4">
              <p className="text-sm text-red-200">
                ⚠️ This error has occurred {errorCount} times. Consider reloading the page.
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-2 border-2 border-gray-400 hover:border-yellow-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              aria-expanded={showDetails}
            >
              {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} Technical Details
            </button>
          </div>

          {/* Technical Details */}
          {showDetails && (
            <div className="mt-4 border-t-2 border-gray-600 pt-4">
              <h3 className="text-yellow-300 font-bold mb-2">STACK TRACE:</h3>
              <pre className="text-xs text-gray-300 bg-black p-3 overflow-x-auto max-h-60 overflow-y-auto border border-gray-600 mb-4">
                {error.stack || 'No stack trace available'}
              </pre>

              {errorInfo?.componentStack && (
                <>
                  <h3 className="text-yellow-300 font-bold mb-2">COMPONENT STACK:</h3>
                  <pre className="text-xs text-gray-300 bg-black p-3 overflow-x-auto max-h-40 overflow-y-auto border border-gray-600">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>

        {/* Recovery Options */}
        <div className="border-2 border-gray-400 bg-black bg-opacity-50 p-4 mb-4">
          <h2 className="text-yellow-300 font-bold mb-3">RECOVERY OPTIONS:</h2>

          <div className="space-y-3">
            <button
              onClick={onReset}
              className="w-full px-4 py-3 bg-green-700 border-2 border-green-400 hover:bg-green-600 text-white font-bold text-left flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <span className="text-2xl">🔄</span>
              <div>
                <div className="font-bold">TRY AGAIN</div>
                <div className="text-xs text-green-200">
                  Attempt to recover without reloading (may not work for all errors)
                </div>
              </div>
            </button>

            <button
              onClick={handleReload}
              className="w-full px-4 py-3 bg-blue-700 border-2 border-blue-400 hover:bg-blue-600 text-white font-bold text-left flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <span className="text-2xl">↻</span>
              <div>
                <div className="font-bold">RELOAD PAGE</div>
                <div className="text-xs text-blue-200">
                  Refresh the entire application (recommended)
                </div>
              </div>
            </button>

            <button
              onClick={handleReportIssue}
              className="w-full px-4 py-3 bg-yellow-700 border-2 border-yellow-400 hover:bg-yellow-600 text-white font-bold text-left flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <span className="text-2xl">🐛</span>
              <div>
                <div className="font-bold">REPORT ISSUE</div>
                <div className="text-xs text-yellow-200">
                  Open GitHub issue with error details (opens in new tab)
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400">
          <p>Dr. Sbaitso Recreated v1.11.0</p>
          <p className="text-xs mt-1">
            If this error persists, please report it on{' '}
            <a
              href="https://github.com/doublegate/DrSbaitso-Recreated/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for programmatic error handling in functional components
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error; // This will be caught by ErrorBoundary
    });
  }, []);
}

export default ErrorBoundary;
