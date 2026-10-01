'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export type ConfirmActionOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
};

type ConfirmAction = (options: ConfirmActionOptions) => Promise<boolean>;

const ConfirmActionContext = createContext<ConfirmAction | null>(null);

export function ConfirmActionProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmActionOptions | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const titleId = useId();
  const messageId = useId();

  const confirmAction = useCallback((options: ConfirmActionOptions) => new Promise<boolean>((resolve) => {
    resolveRef.current?.(false);
    resolveRef.current = resolve;
    setRequest(options);
  }), []);

  const finish = (confirmed: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setRequest(null);
    resolve?.(confirmed);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (request && !dialog.open) dialog.showModal();
    if (!request && dialog.open) dialog.close();
  }, [request]);

  return (
    <ConfirmActionContext.Provider value={confirmAction}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={messageId}
        aria-modal="true"
        className="w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60"
        onCancel={(event) => {
          event.preventDefault();
          finish(false);
        }}
      >
        {request && (
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-bold text-slate-900">{request.title}</h2>
                <p id={messageId} className="mt-1 text-sm leading-5 text-slate-600">{request.message}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => finish(false)} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                Cancelar
              </button>
              <button type="button" onClick={() => finish(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {request.confirmLabel || 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmActionContext.Provider>
  );
}

export function useConfirmAction() {
  const confirmAction = useContext(ConfirmActionContext);
  if (!confirmAction) throw new Error('useConfirmAction debe usarse dentro de ConfirmActionProvider.');
  return confirmAction;
}