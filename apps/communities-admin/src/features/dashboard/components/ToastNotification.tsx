'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { NotificationToast } from '@/types';

interface ToastNotificationProps {
  notification: NotificationToast | null;
}

export function ToastNotification({ notification }: ToastNotificationProps) {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
        notification.type === 'success'
          ? 'bg-slate-900 text-emerald-300 border-emerald-500/50'
          : 'bg-red-950 text-red-200 border-red-500/50'
      }`}
    >
      {notification.type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400" />
      )}
      <span>{notification.message}</span>
    </div>
  );
}
