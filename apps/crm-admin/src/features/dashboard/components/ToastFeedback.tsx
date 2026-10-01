'use client';

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { FeedbackNotification } from '../../../types';

interface ToastFeedbackProps {
  feedback: FeedbackNotification | null;
}

export function ToastFeedback({ feedback }: ToastFeedbackProps) {
  if (!feedback) return null;

  return (
    <div
      role={feedback.type === 'error' ? 'alert' : 'status'}
      className={`p-4 rounded-xl flex items-center gap-3 text-sm border animate-in fade-in duration-200 ${
        feedback.type === 'success'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-800 border-red-200'
      }`}
    >
      {feedback.type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
      )}
      <span className="font-medium">{feedback.message}</span>
    </div>
  );
}
