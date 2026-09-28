'use client';

import { useEffect, useState } from 'react';
import { API_BASE, SESSION_KEY } from '../api';

interface CrmSession {
  user: { id: string; email: string; firstName: string; lastName: string; role: string };
  token: string;
}

export function useCrmAuth() {
  const [session, setSession] = useState<CrmSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      setSession(JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as CrmSession | null);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setIsHydrated(true);
    const clearSession = () => {
      setSession(null);
      setChallengeToken(null);
    };
    window.addEventListener('dommia-crm-unauthorized', clearSession);
    return () => window.removeEventListener('dommia-crm-unauthorized', clearSession);
  }, []);

  const finishLogin = (nextSession: CrmSession) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setChallengeToken(null);
    setError(null);
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo iniciar sesión.');
      if (result.data?.mfaRequired) {
        setChallengeToken(result.data.challengeToken);
        return;
      }
      if (!['SUPER_ADMIN', 'COMMERCIAL_EXEC', 'SUPPORT'].includes(result.data?.user?.role)) {
        throw new Error('Esta cuenta no tiene acceso al CRM.');
      }
      finishLogin(result.data as CrmSession);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo conectar con Dommia.');
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (code: string) => {
    if (!challengeToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken, code }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Código de autenticación inválido.');
      if (!['SUPER_ADMIN', 'COMMERCIAL_EXEC', 'SUPPORT'].includes(result.data?.user?.role)) {
        throw new Error('Esta cuenta no tiene acceso al CRM.');
      }
      finishLogin(result.data as CrmSession);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'No se pudo validar el código.');
    } finally {
      setLoading(false);
    }
  };

  const cancelMfa = () => {
    setChallengeToken(null);
    setError(null);
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setChallengeToken(null);
  };

  return { session, isHydrated, challengeToken, error, loading, handleLogin, verifyMfa, cancelMfa, logout };
}