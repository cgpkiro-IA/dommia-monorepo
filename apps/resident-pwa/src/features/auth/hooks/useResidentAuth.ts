'use client';

import { useCallback, useEffect, useState } from 'react';
import { ResidentProfile } from '../../../types';

const API = 'http://localhost:4000/api/v1';

export function useResidentAuth(expectedTenantSlug?: string) {
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const loadProfile = useCallback(async (residentToken: string, tenantSlug: string) => {
    const [tenantResponse, residentResponse] = await Promise.all([
      fetch(`${API}/tenants/${tenantSlug}`),
      fetch(`${API}/auth/resident/me`, { headers: { Authorization: `Bearer ${residentToken}` } }),
    ]);
    const tenantJson = await tenantResponse.json();
    const residentJson = await residentResponse.json();
    if (!tenantResponse.ok || !tenantJson.success || !residentResponse.ok || !residentJson.success) {
      throw new Error(residentJson.message || tenantJson.message || 'No se pudo cargar el perfil Resident.');
    }
    const fullResident = residentJson.data?.resident;
    const profileData: ResidentProfile = {
      id: fullResident.id,
      propertyId: fullResident.property_id,
      name: `${fullResident.first_name} ${fullResident.last_name}`.trim(),
      email: fullResident.email,
      phone: fullResident.phone || '',
      communitySlug: tenantSlug,
      communityName: tenantJson.data?.name || tenantSlug,
      propertyAddress: fullResident.street ? `${fullResident.street} #${fullResident.exterior_number}` : fullResident.property_id,
      role: fullResident.role || 'OWNER',
      isPrimary: Boolean(fullResident.is_primary),
      paymentStatus: 'UP_TO_DATE',
      updatedAt: new Date().toISOString(),
      modules: tenantJson.data?.modules || [],
    };
    return profileData;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const serializedSession = localStorage.getItem('dommia_resident_session');
        if (!serializedSession) return;

        const session = JSON.parse(serializedSession);
        const cachedProfile = session.profile as ResidentProfile | null;
        const residentToken = session.token as string | null;
        if (!residentToken || !cachedProfile?.communitySlug) return;

        if (expectedTenantSlug && cachedProfile.communitySlug.toLowerCase() !== expectedTenantSlug.toLowerCase()) {
          localStorage.removeItem('dommia_resident_session');
          return;
        }

        setProfile(cachedProfile);
        setToken(residentToken);
        setMustChangePassword(Boolean(session.mustChangePassword));

        try {
          const refreshedProfile = await loadProfile(residentToken, cachedProfile.communitySlug);
          if (!isMounted) return;
          localStorage.setItem('dommia_resident_session', JSON.stringify({ ...session, profile: refreshedProfile }));
          setProfile(refreshedProfile);
        } catch {}
      } catch {}
      finally {
        if (isMounted) setIsReady(true);
      }
    };

    void restoreSession();
    return () => { isMounted = false; };
  }, [expectedTenantSlug, loadProfile]);

  const login = useCallback(async (identifier: string, password: string, tenantSlug: string) => {
    const response = await fetch(`${API}/auth/resident/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, tenantSlug }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo iniciar sesión.');
    const profileData = await loadProfile(json.data.token, tenantSlug);
    const session = { token: json.data.token, profile: profileData, mustChangePassword: json.data.mustChangePassword };
    localStorage.setItem('dommia_resident_session', JSON.stringify(session));
    setToken(json.data.token);
    setProfile(profileData);
    setMustChangePassword(Boolean(json.data.mustChangePassword));
  }, [loadProfile]);

  const activate = useCallback(async (activationToken: string, password: string) => {
    const response = await fetch(`${API}/auth/resident/activate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: activationToken, password }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo activar la cuenta.');
  }, []);

  const changePassword = useCallback(async (identifier: string, tenantSlug: string, currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API}/auth/resident/change-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, tenantSlug, currentPassword, newPassword }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo cambiar la contraseña.');
    setMustChangePassword(false);
    try {
      const session = JSON.parse(localStorage.getItem('dommia_resident_session') || '{}');
      localStorage.setItem('dommia_resident_session', JSON.stringify({ ...session, mustChangePassword: false }));
    } catch {}
  }, []);

  const requestPasswordRecovery = useCallback(async (identifier: string, tenantSlug: string) => {
    const response = await fetch(`${API}/auth/resident/password-recovery`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, tenantSlug }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo solicitar la recuperación.');
  }, []);

  const resetPassword = useCallback(async (resetToken: string, newPassword: string) => {
    const response = await fetch(`${API}/auth/resident/password-reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo restablecer la contraseña.');
  }, []);

  const logout = useCallback(() => {
    const sessionToken = localStorage.getItem('dommia_resident_session');
    if (sessionToken) {
      try { void fetch(`${API}/auth/resident/logout`, { method: 'POST', headers: { Authorization: `Bearer ${JSON.parse(sessionToken).token}` } }); } catch {}
    }
    localStorage.removeItem('dommia_resident_session');
    setProfile(null); setToken(null); setMustChangePassword(false);
  }, []);

  return { profile, token, mustChangePassword, isReady, login, activate, changePassword, requestPasswordRecovery, resetPassword, logout };
}
