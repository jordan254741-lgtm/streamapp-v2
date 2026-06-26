import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { validateEnv } from './utils/env';
import './index.css';
import App from './App.tsx';

try {
  validateEnv();
} catch (e) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090b;color:#fff;font-family:sans-serif;padding:20px;">
        <div style="text-align:center;max-width:480px;">
          <p style="color:#ef4444;font-size:18px;font-weight:600;margin-bottom:8px;">Configuration Error</p>
          <p style="color:#9ca3af;font-size:14px;line-height:1.5;">${(e as Error).message}</p>
        </div>
      </div>
    `;
  }
  throw e;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
