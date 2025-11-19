
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console for development
        console.error('[App Error]', error, errorInfo);

        // Could send to external monitoring service here
        // Example: Sentry.captureException(error);
      }}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
