'use client';
import { useEffect, useState } from 'react';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <HiCheckCircle size={20} className="text-green-400" />;
      case 'error':
        return <HiExclamationCircle size={20} className="text-red-400" />;
      case 'warning':
        return <HiExclamationCircle size={20} className="text-amber-400" />;
      case 'info':
      default:
        return <HiInformationCircle size={20} className="text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-900/90 border-green-700/50 text-green-100';
      case 'error':
        return 'bg-red-900/90 border-red-700/50 text-red-100';
      case 'warning':
        return 'bg-amber-900/90 border-amber-700/50 text-amber-100';
      case 'info':
      default:
        return 'bg-blue-900/90 border-blue-700/50 text-blue-100';
    }
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border-2 backdrop-blur-sm shadow-2xl
        ${getStyles()}
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
        transition-all duration-300
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <HiX size={16} />
      </button>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info', duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}