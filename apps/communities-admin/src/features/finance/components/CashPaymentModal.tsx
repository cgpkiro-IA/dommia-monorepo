'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { X, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Property, PaymentFormData, PaymentMethod, FinancialCharge } from '@/types';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: PaymentFormData;
  onChange: (field: keyof PaymentFormData, value: any) => void;
  onSubmit: () => void;
  properties: Property[];
  charges: FinancialCharge[];
  loading: boolean;
  error: string | null;
  stripeEnabled?: boolean;
}

export function CashPaymentModal({
  isOpen, onClose, form, onChange, onSubmit, properties, charges, loading, error, stripeEnabled = false,
}: CashPaymentModalProps) {
  if (!isOpen) return null;

  const propertyPendingCharges = charges.filter(
    (c) => c.property_id === form.propertyId && (c.status === 'PENDING' || c.status === 'PARTIAL'),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-100 p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-600 uppercase">
                Dommia Finance • Ventanilla
              </span>
              <h2 className="text-lg font-black text-slate-900 font-heading">
                Registrar Pago en Ventanilla
              </h2>
              <p className="text-xs text-slate-500">
                Recepción de efectivo o SPEI con acreditación de saldo inmediata.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          {/* Property selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vivienda / Propiedad *
            </label>
            <select
              value={form.propertyId}
              onChange={(e) => {
                const propId = e.target.value;
                onChange('propertyId', propId);
                const prop = properties.find((p) => p.id === propId);
                if (prop?.primary_resident_name) {
                  onChange('payerName', prop.primary_resident_name);
                }
              }}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">-- Selecciona la vivienda que realiza el pago --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.street} #{p.exterior_number} {p.interior_number ? `Int. ${p.interior_number}` : ''} 
                  {p.primary_resident_name ? ` (${p.primary_resident_name})` : ''} 
                  {p.is_delinquent ? ' - [Moroso]' : ' - [Al Corriente]'}
                </option>
              ))}
            </select>
          </div>

          {/* Pending charges helper */}
          {form.propertyId && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Adeudos Pendientes de la Vivienda
              </span>
              {propertyPendingCharges.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium">
                  ✓ Esta propiedad no tiene adeudos pendientes. El pago se registrará como abono a favor.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {propertyPendingCharges.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onChange('chargeId', c.id);
                        onChange('amount', Number(c.balance_due || c.amount));
                      }}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between border cursor-pointer transition-all ${
                        form.chargeId === c.id
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold ring-1 ring-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <span>{c.concept}</span>
                        <span className="text-[10px] text-slate-400 block">
                          Vence: {new Date(c.due_date).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">
                          ${Number(c.balance_due || c.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-blue-600 block underline">Liquidar</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Method & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Método de Pago *</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => onChange('paymentMethod', e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="CASH">💵 Efectivo en Ventanilla</option>
                <option value="SPEI_TRANSFER">🏦 Transferencia SPEI</option>
                <option value="BANK_DEPOSIT">🧾 Depósito Bancario</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monto Recibido ($ MXN) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount || ''}
                  onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Folio / Referencia</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => onChange('reference', e.target.value)}
                placeholder="Automático (REC-...)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Residente</label>
              <input
                type="text"
                value={form.payerName}
                onChange={(e) => onChange('payerName', e.target.value)}
                placeholder="Ej. Lic. Carlos Villarreal"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recibido en Administración por:</label>
              <input
                type="text"
                value={form.receivedByName}
                onChange={(e) => onChange('receivedByName', e.target.value)}
                placeholder="Nombre del Administrador / Tesorero"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notas u Observaciones</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => onChange('notes', e.target.value)}
                placeholder="Folio talonario físico..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              {loading ? 'Procesando...' : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Acreditar Pago en Ventanilla
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
