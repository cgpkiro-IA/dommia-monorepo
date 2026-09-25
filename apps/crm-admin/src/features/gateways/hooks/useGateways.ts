'use client';

import { useState } from 'react';
import { GatewayFormData } from '../components/GatewayModal';

const INITIAL_GATEWAY_FORM: GatewayFormData = {
  uuid: '',
  name: '',
  tenantId: '',
  firmwareVersion: '1.2.0',
  notes: '',
};

interface UseGatewaysProps {
  onRefresh: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function useGateways({ onRefresh, showFeedback }: UseGatewaysProps) {
  const [gatewayForm, setGatewayForm] = useState<GatewayFormData>(INITIAL_GATEWAY_FORM);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulateHeartbeat = async (uuid: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/crm/gateways/${uuid}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipLocal: '192.168.1.50' }),
      });
      if (res.ok) {
        showFeedback('success', `Heartbeat registrado para Gateway ${uuid}. Estado: ONLINE`);
        onRefresh();
      }
    } catch (err) {
      console.error('Error sending heartbeat:', err);
    }
  };

  const handleCreateGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:4000/api/v1/crm/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: gatewayForm.uuid.trim(),
          name: gatewayForm.name.trim(),
          tenantId: gatewayForm.tenantId || undefined,
          firmwareVersion: gatewayForm.firmwareVersion,
          notes: gatewayForm.notes || 'Registrado desde Dommia CRM',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al registrar gateway');

      showFeedback('success', '¡Gateway IoT registrado en el inventario con éxito!');
      setGatewayForm(INITIAL_GATEWAY_FORM);
      setTimeout(() => {
        setIsGatewayModalOpen(false);
      }, 1500);
      onRefresh();
    } catch (err: any) {
      showFeedback('error', err.message || 'Ocurrió un error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    gatewayForm,
    setGatewayForm,
    isGatewayModalOpen,
    setIsGatewayModalOpen,
    isSubmitting,
    handleCreateGateway,
    handleSimulateHeartbeat,
  };
}
