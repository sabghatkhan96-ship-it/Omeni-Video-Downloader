import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent Vite dev WebSocket errors from popping up in preview iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e?.reason?.message || e?.reason || '');
    if (msg.includes('WebSocket') || msg.includes('vite')) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
