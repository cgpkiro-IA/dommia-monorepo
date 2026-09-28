'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ResidentAccessGate } from '../../features/auth/components/ResidentAccessGate';
import { useResidentAuth } from '../../features/auth/hooks/useResidentAuth';

function ActivateResidentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useResidentAuth();
  const tenantSlug = searchParams.get('tenant') || '';
  const handleActivate = async (activationToken: string, password: string) => {
    await auth.activate(activationToken, password);
    router.replace(tenantSlug ? `/?tenant=${encodeURIComponent(tenantSlug)}` : '/');
  };
  return <ResidentAccessGate mode="activate" activationToken={searchParams.get('token') || ''} initialTenant={tenantSlug || 'demo'} lockedTenant={Boolean(tenantSlug)} onLogin={auth.login} onActivate={handleActivate} onChangePassword={auth.changePassword} />;
}

export default function ActivateResidentPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#08111f] text-sm text-slate-400">Cargando activación...</div>}><ActivateResidentContent /></Suspense>;
}