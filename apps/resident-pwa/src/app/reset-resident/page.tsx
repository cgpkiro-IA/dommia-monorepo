'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResidentAccessGate } from '../../features/auth/components/ResidentAccessGate';
import { useResidentAuth } from '../../features/auth/hooks/useResidentAuth';

function ResetResidentContent() {
  const params = useSearchParams();
  const router = useRouter();
  const auth = useResidentAuth();
  const tenant = params.get('tenant') || 'demo';
  return <ResidentAccessGate mode="reset" resetToken={params.get('token') || ''} initialTenant={tenant} lockedTenant onResetPassword={auth.resetPassword} onLogin={auth.login} onActivate={auth.activate} onChangePassword={auth.changePassword} onPasswordChanged={() => router.replace(`/?tenant=${encodeURIComponent(tenant)}`)} />;
}

export default function ResetResidentPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#08111f] text-sm text-slate-400">Cargando recuperación...</div>}><ResetResidentContent /></Suspense>;
}