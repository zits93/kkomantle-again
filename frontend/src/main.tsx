import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </React.StrictMode>,
);
