'use client';

import React, { useState, useEffect } from 'react';
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
import { AccessGateButton } from '../features/credential/components/AccessGateButton';
import { DynamicQRModal } from '../features/credential/components/DynamicQRModal';
import { ActivePassesList } from '../features/invitations/components/ActivePassesList';
import { QuickInviteModal } from '../features/invitations/components/QuickInviteModal';
import { SharePassModal } from '../features/invitations/components/SharePassModal';
import { NoticesFeed } from '../features/notices/components/NoticesFeed';
import { ResidentFinanceCard } from '../features/finance/components/ResidentFinanceCard';
import { useResidentFinance } from '../features/finance/hooks/useResidentFinance';
import { PaymentAlertModal } from '../features/finance/components/PaymentAlertModal';
import { SpeiDetailsModal } from '../features/finance/components/SpeiDetailsModal';

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
  totpSecret: 'DOMMIA_SEC_VR_142_SECRET_KEY_2026',
  updatedAt: new Date().toISOString(),
};

export default function ResidentHomePage() {
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

  // Custom Hooks
  const { isOnline, isSimulatedOffline, pendingSyncCount, lastSyncTime, toggleSimulatedOffline, triggerSync } = useOnlineStatus();
  const { totp, isQRModalOpen, setIsQRModalOpen, isOpeningGate, gateSuccess, handleOpenGate } = useDynamicQR(profile);
  const {
    passes, isInviteModalOpen, setIsInviteModalOpen, sharingPass, isShareModalOpen,
    closeShareModal, shareSuccessMessage, createPass, revokePass, sharePass,
  } = useInvitations();
  const { notices } = useNotices(profile.communitySlug);
  const [isSpeiModalOpen, setIsSpeiModalOpen] = useState(false);
  const handleStatusChange = React.useCallback((newStatus: 'UP_TO_DATE' | 'OVERDUE') => {
    setProfile((prev) => (prev.paymentStatus === newStatus ? prev : { ...prev, paymentStatus: newStatus }));
  }, []);

  const {
    financialStatus, isLoading: isFinanceLoading, refreshFinancialStatus,
    latestPaymentAlert, dismissPaymentAlert,
  } = useResidentFinance({
    profile,
    onStatusChange: handleStatusChange,
  });

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col pb-24 max-w-md mx-auto relative shadow-2xl">
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
              onOpenQR={() => setIsQRModalOpen(true)}
              onOpenFinance={() => setActiveTab('finance')}
            />
            <AccessGateButton
              isOpening={isOpeningGate}
              success={gateSuccess}
              onOpenGate={handleOpenGate}
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

            <ActivePassesList
              passes={passes.slice(0, 2)}
              onOpenNewInvite={() => setIsInviteModalOpen(true)}
              onSharePass={sharePass}
              onRevokePass={revokePass}
              shareMessage={shareSuccessMessage}
            />
          </div>
        )}

        {/* Tab 2: Pases de Visitas Completos */}
        {activeTab === 'passes' && (
          <ActivePassesList
            passes={passes}
            onOpenNewInvite={() => setIsInviteModalOpen(true)}
            onSharePass={sharePass}
            onRevokePass={revokePass}
            shareMessage={shareSuccessMessage}
          />
        )}

        {/* Tab 3: Avisos y Circulares */}
        {activeTab === 'notices' && <NoticesFeed notices={notices} />}

        {/* Tab 4: Mis Cuotas y Recibos */}
        {activeTab === 'finance' && (
          <ResidentFinanceCard
            profile={profile}
            financialStatus={financialStatus}
            isLoading={isFinanceLoading}
            onOpenSpeiModal={() => setIsSpeiModalOpen(true)}
            onRefresh={refreshFinancialStatus}
          />
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
        onClose={() => setIsSpeiModalOpen(false)}
      />

      {/* Dynamic QR Modal */}
      <DynamicQRModal
        isOpen={isQRModalOpen}
        residentName={profile.name}
        propertyAddress={profile.propertyAddress}
        totp={totp}
        isOnline={isOnline}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Quick Invite Modal */}
      <QuickInviteModal
        isOpen={isInviteModalOpen}
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
