'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ToastData {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}

let addToastFn: ((toast: Omit<ToastData, 'id'>) => void) | null = null;

export function showToast(type: ToastData['type'], title: string, message: string) {
  if (addToastFn) addToastFn({ type, title, message });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = ({ type, title, message }) => {
      const id = `toast-${Date.now()}`;
      setToasts(prev => [...prev, { id, type, title, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000);
    };
    return () => { addToastFn = null; };
  }, []);

  if (!toasts.length) return null;

  const colors: Record<string, string> = {
    error: 'var(--color-neon-red)', warning: 'var(--color-neon-amber)',
    success: 'var(--color-neon-green)', info: 'var(--color-neon-cyan)',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[400px]">
      {toasts.map(t => (
        <div key={t.id} className="font-mono text-[11px] bg-[var(--color-bg-panel)] border px-4 py-3 animate-toast-in flex gap-3 items-start" style={{ borderColor: colors[t.type] }}>
          <span style={{ color: colors[t.type] }} className="mt-0.5 flex-shrink-0">
            {t.type === 'error' || t.type === 'warning' ? <AlertTriangle size={12} /> : <RefreshCw size={12} />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="uppercase tracking-wider font-bold mb-0.5" style={{ color: colors[t.type] }}>{t.title}</div>
            <div className="text-[var(--color-text-dim)] leading-relaxed">{t.message}</div>
          </div>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-[var(--color-text-dark)] hover:text-[var(--color-text-main)] flex-shrink-0">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
