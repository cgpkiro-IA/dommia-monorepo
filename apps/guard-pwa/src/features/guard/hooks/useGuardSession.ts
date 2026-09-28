'use client';

import { useCallback, useEffect, useState } from 'react';
import { GUARD_SESSION_KEY, loginGuard } from '../guard-api';
import type { GuardSession } from '../types';

export function useGuardSession() {
  const [session, setSession] = useState<GuardSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tenantSlug, setTenantSlug] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('tenant') || '';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const syncOnline = () => setIsOnline(navigator.onLine);
    syncOnline();
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    try {
      const saved = sessionStorage.getItem(GUARD_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GuardSession;
        if (parsed.token && parsed.tenantSlug && parsed.tenantName) setSession(parsed);
        else sessionStorage.removeItem(GUARD_SESSION_KEY);
      }
    } catch {
      sessionStorage.removeItem(GUARD_SESSION_KEY);
    }
    setSessionReady(true);
    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  const handleLogin = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    if (!navigator.onLine) {
      setLoginError('Se requiere conexión para iniciar sesión.');
      return;
    }
    setLoginBusy(true);
    try {
      const nextSession = await loginGuard(email.trim(), password, tenantSlug.trim());
      sessionStorage.setItem(GUARD_SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setPassword('');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoginBusy(false);
    }
  }, [email, password, tenantSlug]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(GUARD_SESSION_KEY);
    setSession(null);
  }, []);

  const copyTenantId = useCallback(async () => {
    if (!session) return false;
    try {
      await navigator.clipboard.writeText(session.tenantSlug);
      return true;
    } catch {
      return false;
    }
  }, [session]);

  return {
    session,
    sessionReady,
    isOnline,
    loginBusy,
    loginError,
    tenantSlug,
    setTenantSlug,
    email,
    setEmail,
    password,
    setPassword,
    setSession,
    handleLogin,
    logout,
    copyTenantId,
  };
}