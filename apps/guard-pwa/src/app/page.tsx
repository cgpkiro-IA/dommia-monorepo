'use client';

import { GuardLoginView } from '@/features/guard/components/GuardLoginView';
import { GuardShellHeader } from '@/features/guard/components/GuardShellHeader';
import { GuardWorkspace } from '@/features/guard/components/GuardWorkspace';
import { useGuardSession } from '@/features/guard/hooks/useGuardSession';

export default function GuardPage() {
  const session = useGuardSession();

  if (!session.sessionReady) {
    return <main className="boot-screen" aria-live="polite">Preparando control de acceso...</main>;
  }

  return (
    <main className="app-shell">
      <GuardShellHeader isOnline={session.isOnline} />
      {!session.session ? (
        <GuardLoginView
          tenantSlug={session.tenantSlug}
          onTenantSlugChange={session.setTenantSlug}
          email={session.email}
          onEmailChange={session.setEmail}
          password={session.password}
          onPasswordChange={session.setPassword}
          isOnline={session.isOnline}
          busy={session.loginBusy}
          error={session.loginError}
          onSubmit={session.handleLogin}
        />
      ) : (
        <GuardWorkspace session={session.session} isOnline={session.isOnline} onLogout={session.logout} />
      )}
    </main>
  );
}