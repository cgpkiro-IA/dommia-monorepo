'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { API_BASE as API } from '@/lib/api-url';

interface GuestPassData {
  invitation: {
    visitorName: string;
    validUntil: string;
    status: string;
  };
  communityName: string;
  propertyAddress: string;
  hostName: string;
  qrPayload: string;
  stepExpiresAt: number;
}

export default function GuestPassPage() {
  const [tenant, setTenant] = useState('');
  const [id, setId] = useState('');
  const [pass, setPass] = useState<GuestPassData | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTenant(params.get('tenant') || '');
    setId(params.get('id') || '');
  }, []);

  useEffect(() => {
    if (!tenant || !id) return;
    let cancelled = false;
    let timer: number;

    const refreshPass = async () => {
      try {
        const response = await fetch(`${API}/tenants/${encodeURIComponent(tenant)}/access/invitations/${encodeURIComponent(id)}/pass`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message || 'Este pase no está disponible.');
        const data = json.data as GuestPassData;
        const image = await QRCode.toDataURL(data.qrPayload, { width: 280, margin: 2, errorCorrectionLevel: 'H' });
        if (cancelled) return;
        setPass(data);
        setQrImage(image);
        setError('');
        timer = window.setTimeout(refreshPass, Math.max(250, data.stepExpiresAt - Date.now() + 100));
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el pase.');
      }
    };

    void refreshPass();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tenant, id]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1120] px-4 py-8 text-slate-100">
      <section className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0F172A] p-6 text-center shadow-xl">
        <p className="text-xs font-bold uppercase text-sky-300">DOMMIA ACCESS</p>
        {error ? (
          <p role="alert" className="mt-6 rounded-lg border border-rose-700 bg-rose-950 p-3 text-sm text-rose-200">{error}</p>
        ) : !pass || !qrImage ? (
          <p className="mt-6 text-sm text-slate-400">Cargando pase...</p>
        ) : (
          <>
            <h1 className="mt-3 text-xl font-bold">Pase de visita</h1>
            <p className="mt-1 text-sm text-slate-300">{pass.communityName}</p>
            <img src={qrImage} alt="Código QR temporal del pase de visita" className="mx-auto my-5 h-64 w-64 rounded-lg bg-white p-2" />
            <p className="text-lg font-semibold">{pass.invitation.visitorName}</p>
            <p className="mt-1 text-sm text-slate-300">Anfitrión: {pass.hostName}</p>
            <p className="text-sm text-slate-400">Destino: {pass.propertyAddress}</p>
            <p className="mt-3 text-xs text-amber-300">El QR cambia cada 15 segundos. Mantén esta página abierta al llegar.</p>
            <p className="mt-1 text-xs text-slate-500">Vigente hasta {new Date(pass.invitation.validUntil).toLocaleString('es-MX')}</p>
          </>
        )}
      </section>
    </main>
  );
}