'use client';

import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({} as ToastContextType);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration: number = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: useCallback((msg: string, dur?: number) => addToast('success', msg, dur), [addToast]),
    error: useCallback((msg: string, dur?: number) => addToast('error', msg, dur ?? 4500), [addToast]),
    info: useCallback((msg: string, dur?: number) => addToast('info', msg, dur), [addToast]),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl shadow-lg border transition-all duration-200 animate-in fade-in slide-in-from-top-2 text-xs font-semibold ${
              t.type === 'success'
                ? 'bg-white border-emerald-200 text-emerald-950 shadow-emerald-900/5'
                : t.type === 'error'
                ? 'bg-white border-rose-200 text-rose-950 shadow-rose-900/5'
                : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/5'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {t.type === 'success' && (
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
              {t.type === 'error' && (
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              )}
              {t.type === 'info' && (
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="leading-snug pt-0.5">{t.message}</span>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0 transition cursor-pointer"
              title="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

