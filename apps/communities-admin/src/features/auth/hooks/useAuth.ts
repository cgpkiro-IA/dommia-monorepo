'use client';

import { useState } from 'react';
import { UserSession, TenantMetadata } from '@/types';

export function useAuth() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [activeTenant, setActiveTenant] = useState<TenantMetadata | null>(null);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: 'admin@laspalmas.dommia.com',
    password: 'LasPalmas2026!',
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
        const session: UserSession = result.data;
        setUserSession(session);

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
      } else {
        setLoginError(result.message || 'Error de autenticación. Verifica tu correo y contraseña.');
      }
    } catch {
      setLoginError('No se pudo conectar con el servidor de autenticación de Dommia.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSelectTenant = async (t: TenantMetadata) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password, tenantSlug: t.slug }),
      });
      const result = await res.json();
      if (!res.ok || !result.success || !result.data?.token) {
        throw new Error(result.message || 'No se pudo abrir el fraccionamiento seleccionado.');
      }
      setUserSession(result.data as UserSession);
      setActiveTenant(result.data.activeTenant || t);
      setShowWorkspacePicker(false);
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
  };

  return {
    userSession,
    activeTenant,
    setActiveTenant,
    showWorkspacePicker,
    setShowWorkspacePicker,
    loginForm,
    setLoginForm,
    loginLoading,
    loginError,
    handleLogin,
    handleSelectTenant,
    handleLogout,
  };
}
