'use client';

import { useState } from 'react';
import { UserSession, TenantMetadata } from '@/types';
import { API_BASE } from '@/lib/api-url';
import { parseClientError } from '@dommia/ui';

export function useAuth() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [activeTenant, setActiveTenant] = useState<TenantMetadata | null>(null);

  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({
    email: 'admin@laspalmas.dommia.com.mx',
    password: 'LasPalmas2026!',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const acceptSession = (session: UserSession) => {
    setLoginSuccess(false);
    setUserSession(session);
    setMfaChallengeToken(null);
    if (session.activeTenant) {
      setActiveTenant(session.activeTenant);
      setShowWorkspacePicker(false);
    } else if (session.tenants.length === 1) {
      setActiveTenant(session.tenants[0]);
      setShowWorkspacePicker(false);
    } else if (session.tenants.length > 1) {
      setActiveTenant(null);
      setShowWorkspacePicker(true);
    } else {
      setLoginError('No tienes fraccionamientos asignados. Contacta a soporte.');
    }
  };

  const completeLogin = (session: UserSession) => {
    if (!session.activeTenant && session.tenants.length === 0) {
      acceptSession(session);
      return;
    }

    setMfaChallengeToken(null);
    setLoginSuccess(true);
    window.setTimeout(() => acceptSession(session), 1300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (result.data?.mfaRequired) {
          setMfaChallengeToken(result.data.challengeToken);
        } else {
          completeLogin(result.data as UserSession);
        }
      } else {
        setLoginError(parseClientError(result, 'Error de autenticación. Verifica tu correo y contraseña.').description);
      }
    } catch (err) {
      setLoginError(parseClientError(err, 'No se pudo conectar con el servidor de autenticación de Dommia.').description);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMfaVerify = async (code: string) => {
    if (!mfaChallengeToken) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken: mfaChallengeToken, code: code.replace(/\s/g, '') }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'No se pudo verificar el código.');
      completeLogin(result.data as UserSession);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo verificar el código.');
    } finally {
      setLoginLoading(false);
    }
  };

  const cancelMfa = () => {
    setMfaChallengeToken(null);
    setLoginError(null);
  };

  const handleSelectTenant = async (t: TenantMetadata) => {
    if (!userSession?.token) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/select-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userSession.token}` },
        body: JSON.stringify({ tenantSlug: t.slug }),
      });
      const result = await res.json();
      if (!res.ok || !result.success || !result.data?.token) {
        throw new Error(result.message || 'No se pudo abrir el fraccionamiento seleccionado.');
      }
      acceptSession(result.data as UserSession);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo abrir el fraccionamiento seleccionado.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    setActiveTenant(null);
    setShowWorkspacePicker(false);
    setMfaChallengeToken(null);
    setLoginSuccess(false);
  };

  return {
    userSession,
    activeTenant,
    setActiveTenant,
    showWorkspacePicker,
    mfaChallengeToken,
    setShowWorkspacePicker,
    loginForm,
    setLoginForm,
    loginLoading,
    loginError,
    loginSuccess,
    handleLogin,
    handleMfaVerify,
    cancelMfa,
    handleSelectTenant,
    handleLogout,
  };
}
