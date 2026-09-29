'use client';

import { useState } from 'react';
import { UserSession, TenantMetadata } from '@/types';
import { parseClientError } from '@dommia/ui';

export function useAuth() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [activeTenant, setActiveTenant] = useState<TenantMetadata | null>(null);

  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({
    email: 'admin@laspalmas.dommia.com',
    password: 'LasPalmas2026!',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const acceptSession = (session: UserSession) => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/login', {
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
          acceptSession(result.data as UserSession);
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
      const res = await fetch('http://localhost:4000/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken: mfaChallengeToken, code: code.replace(/\s/g, '') }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'No se pudo verificar el código.');
      acceptSession(result.data as UserSession);
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
      const res = await fetch('http://localhost:4000/api/v1/auth/select-tenant', {
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
    handleLogin,
    handleMfaVerify,
    cancelMfa,
    handleSelectTenant,
    handleLogout,
  };
}
