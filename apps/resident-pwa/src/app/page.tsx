'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ArrowRight } from 'lucide-react';
import { ResidentProfile } from '../types';
import { db } from '../lib/db';
import { useOnlineStatus } from '../features/offline/hooks/useOnlineStatus';
import { useDynamicQR } from '../features/credential/hooks/useDynamicQR';
import { useInvitations } from '../features/invitations/hooks/useInvitations';
import { useNotices } from '../features/notices/hooks/useNotices';

import { MobileTopBar } from '../features/navigation/components/MobileTopBar';
import { MobileTabBar, TabKey } from '../features/navigation/components/MobileTabBar';
import { OfflineSyncBanner } from '../features/offline/components/OfflineSyncBanner';
import { ResidentCard } from '../features/credential/components/ResidentCard';
import { DynamicQRModal } from '../features/credential/components/DynamicQRModal';
import { ActivePassesList } from '../features/invitations/components/ActivePassesList';
import { QuickInviteModal } from '../features/invitations/components/QuickInviteModal';
import { SharePassModal } from '../features/invitations/components/SharePassModal';
import { NoticesFeed } from '../features/notices/components/NoticesFeed';
import { ResidentFinanceCard } from '../features/finance/components/ResidentFinanceCard';
import { useResidentFinance } from '../features/finance/hooks/useResidentFinance';
import { PaymentAlertModal } from '../features/finance/components/PaymentAlertModal';
import { SpeiDetailsModal } from '../features/finance/components/SpeiDetailsModal';
import { AnnualCampaignCard } from '../features/finance/components/AnnualCampaignCard';
import { useAnnualCampaign } from '../features/finance/hooks/useAnnualCampaign';
import { useResidentAuth } from '../features/auth/hooks/useResidentAuth';
import { ResidentAccessGate } from '../features/auth/components/ResidentAccessGate';

const DEFAULT_RESIDENT_PROFILE: ResidentProfile = {
  id: 'current_resident',
  propertyId: 'a0000000-0000-0000-0000-000000000142',
  name: 'Lic. Carlos Villarreal',
  email: 'carlos.villarreal@dommia.com',
  phone: '+52 81 2345 6789',
  communitySlug: 'valle_real',
  communityName: 'Fracc. Valle Real',
  propertyAddress: 'Cda. Los Cedros #142',
  role: 'OWNER',
  isPrimary: true,
  paymentStatus: 'UP_TO_DATE',
  updatedAt: new Date().toISOString(),
};

export default function ResidentHomePage() {
  const router = useRouter();
  const [invitedTenant] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('tenant') || '';
  });
  const residentAuth = useResidentAuth(invitedTenant || undefined);
  const [showRecovery, setShowRecovery] = useState(false);
  const [stripeFeedback, setStripeFeedback] = useState<{ type: 'success' | 'pending' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('credential');
  const [profile, setProfile] = useState<ResidentProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dommia_resident_profile');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return DEFAULT_RESIDENT_PROFILE;
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let saved = await db.profile.get('current_resident');
        if (!saved) {
          saved = DEFAULT_RESIDENT_PROFILE;
          await db.profile.put(saved);
        }
        if (isMounted && saved) {
          setProfile(saved);
          try { localStorage.setItem('dommia_resident_profile', JSON.stringify(saved)); } catch {}
        }
      } catch (err) {
        console.warn('Fallback perfil local:', err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!residentAuth.token || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get('stripe');
    const sessionId = params.get('session_id');
    if (checkoutState === 'cancelled') {
      setStripeFeedback({ type: 'error', message: 'El pago fue cancelado. No se realizó ningún cargo.' });
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (checkoutState !== 'success' || !sessionId || !residentAuth.profile?.communitySlug) return;
    fetch(`http://localhost:4000/api/v1/tenants/${residentAuth.profile.communitySlug}/stripe/session/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${residentAuth.token}` } })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo verificar el pago.');
        if (json.data.paymentStatus === 'paid') setStripeFeedback({ type: 'pending', message: 'Pago recibido. La acreditación final se confirmará mediante webhook.' });
        else setStripeFeedback({ type: 'pending', message: 'Checkout completado, pero el pago aún está pendiente de confirmación.' });
      })
      .catch((error) => setStripeFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo verificar el pago.' }))
      .finally(() => window.history.replaceState({}, '', window.location.pathname));
  }, [residentAuth.token, residentAuth.profile?.communitySlug]);

  useEffect(() => {
    if (residentAuth.profile) setProfile(residentAuth.profile);
  }, [residentAuth.profile]);

  // Custom Hooks
  const accessQrEnabled = Array.isArray(residentAuth.profile?.modules)
    ? residentAuth.profile.modules.includes('ACCESS_QR')
    : Boolean(residentAuth.profile?.modules && residentAuth.profile.modules.ACCESS_QR);
  const { isOnline, isSimulatedOffline, pendingSyncCount, lastSyncTime, toggleSimulatedOffline, triggerSync } = useOnlineStatus();
  const { totp, isQRModalOpen, setIsQRModalOpen } = useDynamicQR(profile, residentAuth.token, accessQrEnabled);
  const {
    passes, isInviteModalOpen, setIsInviteModalOpen, sharingPass, isShareModalOpen,
    closeShareModal, shareSuccessMessage, errorMessage, isLoading, createPass, revokePass, sharePass,
  } = useInvitations(residentAuth.token, residentAuth.profile?.communitySlug || null, accessQrEnabled);
  const { notices } = useNotices(profile.communitySlug);
  const [isSpeiModalOpen, setIsSpeiModalOpen] = useState(false);
  const handleStatusChange = React.useCallback((newStatus: 'UP_TO_DATE' | 'OVERDUE') => {
    setProfile((prev) => (prev.paymentStatus === newStatus ? prev : { ...prev, paymentStatus: newStatus }));
  }, []);

  const {
    financialStatus, isLoading: isFinanceLoading, refreshFinancialStatus,
    latestPaymentAlert, dismissPaymentAlert, submitSpeiPayment, stripeEnabled,
  } = useResidentFinance({
    profile,
    onStatusChange: handleStatusChange,
  });
  const annualCampaign = useAnnualCampaign(profile);

  const openStripeCheckout = async () => {
    const charge = financialStatus?.charges.find((item) => Number(item.balance_due) > 0);
    if (!charge || !profile.propertyId || !residentAuth.token) return;
    const response = await fetch(`http://localhost:4000/api/v1/tenants/${profile.communitySlug}/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${residentAuth.token}` },
      body: JSON.stringify({ propertyId: profile.propertyId, chargeId: charge.id, successUrl: `${window.location.origin}/?stripe=success&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: `${window.location.origin}/?stripe=cancelled` }),
    });
    const json = await response.json();
    if (!response.ok || !json.success || !json.data?.checkoutUrl) return;
    window.location.assign(json.data.checkoutUrl);
  };

  if (!residentAuth.isReady) {
    return <div className="flex min-h-screen items-center justify-center bg-[#08111f] text-sm text-slate-400">Cargando acceso seguro...</div>;
  }

  if (!residentAuth.profile) {
    if (showRecovery) return <ResidentAccessGate mode="recovery" initialTenant={invitedTenant || 'demo'} lockedTenant={Boolean(invitedTenant)} onRequestRecovery={residentAuth.requestPasswordRecovery} onLogin={residentAuth.login} onActivate={residentAuth.activate} onChangePassword={residentAuth.changePassword} />;
    return <ResidentAccessGate initialTenant={invitedTenant || 'demo'} lockedTenant={Boolean(invitedTenant)} onOpenRecovery={() => setShowRecovery(true)} onLogin={residentAuth.login} onActivate={residentAuth.activate} onChangePassword={residentAuth.changePassword} />;
  }

  if (residentAuth.mustChangePassword) {
    return <ResidentAccessGate forceChange={{ identifier: residentAuth.profile.email || residentAuth.profile.phone, tenantSlug: residentAuth.profile.communitySlug }} initialTenant={residentAuth.profile.communitySlug} lockedTenant onPasswordChanged={() => router.replace(`/?tenant=${encodeURIComponent(residentAuth.profile?.communitySlug || '')}`)} onLogin={residentAuth.login} onActivate={residentAuth.activate} onChangePassword={residentAuth.changePassword} />;
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col pb-24 max-w-md mx-auto relative shadow-2xl">
      {stripeFeedback && <div className={`mx-4 mt-4 rounded-2xl border px-4 py-3 text-xs font-semibold ${stripeFeedback.type === 'success' ? 'border-emerald-700 bg-emerald-950 text-emerald-200' : stripeFeedback.type === 'pending' ? 'border-amber-700 bg-amber-950 text-amber-200' : 'border-rose-700 bg-rose-950 text-rose-200'}`}>{stripeFeedback.message}</div>}
      {/* Mobile Sticky Top Header */}
      <MobileTopBar
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulate={toggleSimulatedOffline}
      />

      <main className="flex-1 pt-4">
        {/* Offline Banner & Sync queue status */}
        <OfflineSyncBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          lastSyncTime={lastSyncTime}
          onSyncNow={triggerSync}
        />

        {/* Tab 1: Credencial Digital y Apertura */}
        {activeTab === 'credential' && (
          <div>
            <ResidentCard
              profile={profile}
              totpCode={totp.code}
              accessQrEnabled={accessQrEnabled}
              onOpenQR={() => setIsQRModalOpen(true)}
              onOpenFinance={() => setActiveTab('finance')}
            />

            {/* Acceso Directo Estado de Cuenta / Finanzas */}
            <div
              onClick={() => setActiveTab('finance')}
              className="mx-4 mb-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all shadow-md group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  profile.paymentStatus === 'UP_TO_DATE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    Mis Cuotas & Estado de Cuenta
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {profile.paymentStatus === 'UP_TO_DATE'
                      ? '✓ Al corriente • Ver recibos y SPEI'
                      : '⚠ Cuota pendiente de pago • Pagar aquí'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </div>

            {accessQrEnabled && <ActivePassesList
              passes={passes.slice(0, 2)}
              onOpenNewInvite={() => setIsInviteModalOpen(true)}
              onSharePass={sharePass}
              onRevokePass={revokePass}
              shareMessage={shareSuccessMessage}
              errorMessage={errorMessage}
              isLoading={isLoading}
            />}
          </div>
        )}

        {/* Tab 2: Pases de Visitas Completos */}
        {activeTab === 'passes' && accessQrEnabled && (
          <ActivePassesList
            passes={passes}
            onOpenNewInvite={() => setIsInviteModalOpen(true)}
            onSharePass={sharePass}
            onRevokePass={revokePass}
            shareMessage={shareSuccessMessage}
            errorMessage={errorMessage}
            isLoading={isLoading}
          />
        )}

        {/* Tab 3: Avisos y Circulares */}
        {activeTab === 'notices' && <NoticesFeed notices={notices} />}

        {/* Tab 4: Mis Cuotas y Recibos */}
        {activeTab === 'finance' && (
          <>
            <AnnualCampaignCard {...annualCampaign} onLoadQuote={annualCampaign.loadQuote} onSubmit={annualCampaign.submit} />
            <ResidentFinanceCard profile={profile} financialStatus={financialStatus} isLoading={isFinanceLoading} stripeEnabled={stripeEnabled} onOpenStripe={openStripeCheckout} onOpenSpeiModal={() => setIsSpeiModalOpen(true)} onRefresh={refreshFinancialStatus} />
          </>
        )}
      </main>

      {/* Payment Received Alert Modal (Fired when admin records payment in ventanilla) */}
      <PaymentAlertModal
        payment={latestPaymentAlert}
        onClose={dismissPaymentAlert}
      />

      {/* SPEI Banking Details Modal */}
      <SpeiDetailsModal
        isOpen={isSpeiModalOpen}
        profile={profile}
        amountDue={financialStatus ? financialStatus.totalBalanceDue : 0}
        onSubmit={submitSpeiPayment}
        onClose={() => setIsSpeiModalOpen(false)}
      />

      {accessQrEnabled && <DynamicQRModal
        isOpen={isQRModalOpen}
        residentName={profile.name}
        propertyAddress={profile.propertyAddress}
        totp={totp}
        isOnline={isOnline}
        onClose={() => setIsQRModalOpen(false)}
      />}

      {/* Quick Invite Modal */}
      <QuickInviteModal
        isOpen={isInviteModalOpen}
        errorMessage={errorMessage}
        onClose={() => setIsInviteModalOpen(false)}
        onCreatePass={createPass}
      />

      {/* Share Graphic Pass Modal */}
      <SharePassModal
        isOpen={isShareModalOpen}
        pass={sharingPass}
        profile={profile}
        onClose={closeShareModal}
      />

      {/* Mobile Sticky Bottom Tab Bar */}
      <MobileTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        noticesCount={notices.length}
      />
    </div>
  );
}
