
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UpdatePrompt from './components/UpdatePrompt';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// Opt-in profiler: dev builds, or `?profile=1` in production (adds an
// on-screen Core Web Vitals overlay). Loaded lazily, so it costs nothing otherwise.
if (import.meta.env.DEV || new URLSearchParams(window.location.search).get('profile') === '1') {
  void import('./utils/performanceProfiler').then(({ initDevProfiler }) => initDevProfiler());
}

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
      <UpdatePrompt />
    </ErrorBoundary>
  </React.StrictMode>
);
