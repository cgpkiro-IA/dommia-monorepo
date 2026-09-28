'use client';

import React from 'react';
import { Star, Mail, Phone, Car, Edit2, Trash2 } from 'lucide-react';
import { Resident } from '@/types';

interface ResidentTableRowProps {
  resident: Resident;
  onOpenEdit: (r: Resident) => void;
  onDelete: (id: string, name: string) => void;
  onAddVehicleToResident: (propertyId: string, residentId: string) => void;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}

export function ResidentTableRow({
  resident: r,
  onOpenEdit,
  onDelete,
  onAddVehicleToResident,
  selected,
  onSelect,
}: ResidentTableRowProps) {
  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="py-3.5 px-5"><input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} aria-label={`Seleccionar a ${r.first_name} ${r.last_name}`} /></td>
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
            {r.first_name[0]}{r.last_name[0]}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span>{r.first_name} {r.last_name}</span>
              {r.is_primary && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px]">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>Titular</span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              ID: {r.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-5">
        <div className="font-semibold text-slate-800">
          {r.street} #{r.exterior_number}
          {r.interior_number && ` (Int. ${r.interior_number})`}
        </div>
        <div className="text-[11px] text-slate-400">
          {r.block || r.lot ? `${r.block || ''} • ${r.lot || ''}` : 'Residencia única'}
        </div>
      </td>

      <td className="py-3.5 px-5">
        {r.role === 'OWNER' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
            <span>Propietario Residente</span>
          </span>
        )}
        {r.role === 'TENANT' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
            <span>Arrendatario / Inquilino</span>
          </span>
        )}
        {r.role === 'FAMILY_MEMBER' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
            <span>Familiar / Dependiente</span>
          </span>
        )}
      </td>

      <td className="py-3.5 px-5">
        <div className="space-y-1">
          <a
            href={`mailto:${r.email}`}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono"
          >
            <Mail className="w-3 h-3 text-slate-400" />
            <span>{r.email}</span>
          </a>
          {r.phone && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${r.phone}`}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-mono"
              >
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{r.phone}</span>
              </a>
              <a
                href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold hover:bg-emerald-200 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          )}
        </div>
      </td>

      <td className="py-3.5 px-5">
        {r.is_active ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Activo</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Inactivo</span>
          </span>
        )}
      </td>

      <td className="py-3.5 px-5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onAddVehicleToResident(r.property_id, r.id)}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
            title="Registrar auto a este residente"
          >
            <Car className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenEdit(r)}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Editar datos del habitante"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(r.id, `${r.first_name} ${r.last_name}`)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
            title="Eliminar residente del padrón"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
