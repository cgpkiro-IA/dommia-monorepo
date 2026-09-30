'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertTriangle, X, RefreshCw, Bot, HelpCircle, ExternalLink } from 'lucide-react';
import { TelegramConfig } from '../hooks/useCrmAlerts';

interface TelegramConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TelegramConfig | null;
  onSave: (config: {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
    botUsername?: string;
  }) => Promise<boolean>;
  onTest: (botToken?: string, chatId?: string) => Promise<{ success: boolean; message: string }>;
}

export function TelegramConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
  onTest,
}: TelegramConfigModalProps) {
  const [enabled, setEnabled] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setBotToken(config.botToken || '');
      setChatId(config.chatId || '');
      setBotUsername(config.botUsername || '');
    }
  }, [config]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);
    try {
      const ok = await onSave({ enabled, botToken, chatId, botUsername });
      if (ok) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(botToken, chatId);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0F172A] border border-slate-700 text-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Configurar Bot de Telegram</h3>
              <p className="text-[11px] text-slate-400">Despacho de alertas críticas en tiempo real para el equipo SaaS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
          {/* Switch Enabled */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <label htmlFor="telegram-enabled" className="text-xs font-bold text-white block">
                Notificaciones por Telegram Activas
              </label>
              <p className="text-[11px] text-slate-400">
                Al activarse, las alertas críticas y de advertencia se enviarán al canal/grupo configurado.
              </p>
            </div>
            <input
              id="telegram-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* Bot Token */}
          <div className="space-y-1">
            <label htmlFor="telegram-bot-token" className="text-xs font-semibold text-slate-300">
              Telegram Bot Token *
            </label>
            <input
              id="telegram-bot-token"
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="Ej. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Chat ID */}
          <div className="space-y-1">
            <label htmlFor="telegram-chat-id" className="text-xs font-semibold text-slate-300">
              Chat ID / ID del Grupo de Telegram *
            </label>
            <input
              id="telegram-chat-id"
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Ej. -1001234567890 (Grupo) o 987654321 (Chat privado)"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Bot Username Opcional */}
          <div className="space-y-1">
            <label htmlFor="telegram-bot-username" className="text-xs font-semibold text-slate-300">
              Username del Bot (Opcional)
            </label>
            <input
              id="telegram-bot-username"
              type="text"
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
              placeholder="Ej. @DommiaAlertsBot"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Guía rápida de configuración */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-300">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>¿Cómo obtener las credenciales de Telegram?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
              <li>Abre Telegram y busca <span className="font-mono text-blue-300">@BotFather</span>.</li>
              <li>Envía <span className="font-mono text-blue-300">/newbot</span> y sigue las instrucciones para obtener tu <strong>API Token</strong>.</li>
              <li>Crea un grupo de Telegram para tu equipo y agrega al bot como miembro.</li>
              <li>Obtén el <strong>Chat ID</strong> agregando el bot <span className="font-mono text-blue-300">@RawDataBot</span> al grupo o reenviándole un mensaje.</li>
            </ol>
          </div>

          {/* Test result feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-700 text-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="flex-1">{testResult.message}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !botToken || !chatId}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${testing ? 'animate-pulse text-blue-400' : ''}`} />
              <span>{testing ? 'Probando...' : 'Probar Envío'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl hover:bg-slate-800 text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Guardar Configuración</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
