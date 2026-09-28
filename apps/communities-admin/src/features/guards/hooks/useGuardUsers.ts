'use client';

import { useCallback, useEffect, useState } from 'react';

const API = 'http://localhost:4000/api/v1';

export interface GuardUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
}

export interface GuardUserForm {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

const EMPTY_FORM: GuardUserForm = { email: '', firstName: '', lastName: '', password: '' };

export function useGuardUsers(tenantSlug: string, token: string) {
  const [guards, setGuards] = useState<GuardUser[]>([]);
  const [form, setForm] = useState<GuardUserForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGuards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guards`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudieron cargar las cuentas de guardia.');
      setGuards(body.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las cuentas de guardia.');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, token]);

  useEffect(() => {
    void loadGuards();
  }, [loadGuards]);

  const updateForm = (field: keyof GuardUserForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createGuard = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudo crear la cuenta de guardia.');
      setForm(EMPTY_FORM);
      setSuccess(`Cuenta creada para ${body.data.email}. Comparte la contraseña de forma segura.`);
      await loadGuards();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la cuenta de guardia.');
    } finally {
      setSaving(false);
    }
  };

  return { guards, form, updateForm, createGuard, loadGuards, loading, saving, error, success };
}