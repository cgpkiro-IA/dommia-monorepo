'use client';

import { Button, Badge } from '@dommia/ui';
import { Building2, Crown, Globe, Edit3, ExternalLink } from 'lucide-react';
import { TenantItem } from '../../../types';
import { COMMUNITIES_URL } from '@/lib/app-urls';

interface TenantsTableProps {
  tenants: TenantItem[];
  onEditTenant: (tenant: TenantItem) => void;
}

export function TenantsTable({ tenants, onEditTenant }: TenantsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Fraccionamiento</th>
              <th className="px-6 py-3.5">Dominio & URL de Acceso</th>
              <th className="px-6 py-3.5">Tier Contratado</th>
              <th className="px-6 py-3.5">Límite Casas</th>
              <th className="px-6 py-3.5">PostgreSQL Schema</th>
              <th className="px-6 py-3.5">Estado</th>
              <th className="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{t.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {t.has_custom_domain ? (
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                        <Crown className="w-3 h-3 text-emerald-600" />
                        {t.custom_domain || t.subdomain}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-medium">Subdominio Propio ⭐</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200">
                        <Globe className="w-3 h-3 text-blue-500" />
                        {t.access_url || `standar.dommia.com/${t.slug}`}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium">Dominio Estándar Compartido</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {t.tier}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  {t.max_properties} viviendas
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600">
                  tenant_{t.slug}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={t.is_active ? 'success' : 'error'} size="sm">
                    {t.is_active ? 'Activo' : 'Suspendido'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditTenant(t)}
                      className="text-xs py-1 text-slate-700 hover:text-blue-600 hover:border-blue-400"
                      title="Editar configuración del fraccionamiento"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(COMMUNITIES_URL, '_blank')}
                      className="text-xs py-1"
                      title={`Abrir portal administrativo para ${t.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Portal
                    </Button>
                  </div>
                </td>
              </tr>
            ))}


            {tenants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No hay fraccionamientos registrados. Crea uno con el botón &quot;Alta de Fraccionamiento&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
