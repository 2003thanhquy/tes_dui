import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Wait for fonts to load before rendering to prevent FOUT (Flash of Unstyled Text)
if ('fonts' in document) {
  Promise.all([
    (document as any).fonts.load('400 1em Montserrat'),
    (document as any).fonts.load('400 1em "Dancing Script"'),
    (document as any).fonts.load('400 1em "Great Vibes"')
  ]).then(() => {
    document.body.classList.add('font-loaded');
    document.body.classList.remove('font-loading');
  }).catch(() => {
    // Fallback if fonts fail to load
    document.body.classList.add('font-loaded');
    document.body.classList.remove('font-loading');
  });
} else {
  // Fallback for browsers without Font Loading API
  document.body.classList.add('font-loaded');
}

// Add font-loading class initially
if (!document.body.classList.contains('font-loaded')) {
  document.body.classList.add('font-loading');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);