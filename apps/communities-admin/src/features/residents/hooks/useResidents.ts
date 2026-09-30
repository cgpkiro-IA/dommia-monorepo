'use client';

import { useRef, useState, useMemo } from 'react';
import { Resident, Property } from '@/types';
import { API_BASE } from '@/lib/api-url';

export type InviteContactMethod = 'AUTO' | 'EMAIL' | 'PHONE';
export type InviteDelivery = 'NONE' | 'EMAIL' | 'WHATSAPP';

export function useResidents(authToken?: string) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [invitationResults, setInvitationResults] = useState<any[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);

  // Filters
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [filterResidentRole, setFilterResidentRole] = useState<'ALL' | 'OWNER' | 'TENANT' | 'FAMILY_MEMBER'>('ALL');
  const [residentPropertyFilter, setResidentPropertyFilter] = useState<string | null>(null);

  // Modals
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [isEditResidentModalOpen, setIsEditResidentModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  // Form State
  const [residentForm, setResidentForm] = useState({
    propertyId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'OWNER' as 'OWNER' | 'TENANT' | 'FAMILY_MEMBER',
    isPrimary: true,
    password: 'Dommia2026!',
    isActive: true,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const loadRequestRef = useRef(0);
  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  const loadResidents = async (slug: string) => {
    const requestId = ++loadRequestRef.current;
    setResidents([]);
    setSelectedResidentIds([]);
    setInvitationResults([]);
    setLoadingResidents(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/residents`, { headers: authHeaders });
      const data = await res.json();
      if (data.success && requestId === loadRequestRef.current) {
        setResidents(data.data || []);
        return data.data;
      }
    } catch (err) {
      console.error('Error loading residents:', err);
    } finally {
      setLoadingResidents(false);
    }
  };

  const resetResidents = () => {
    loadRequestRef.current += 1;
    setResidents([]);
    setSelectedResidentIds([]);
    setInvitationResults([]);
    setLoadingResidents(false);
  };

  const openAddModal = (propertyId?: string, properties?: Property[]) => {
    setFormError(null);
    const defaultPropId = propertyId || (properties && properties.length > 0 ? properties[0].id : '');
    setResidentForm({
      propertyId: defaultPropId,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'OWNER',
      isPrimary: true,
      password: 'Dommia2026!',
      isActive: true,
    });
    setIsAddResidentModalOpen(true);
  };

  const openEditModal = (r: Resident) => {
    setEditingResident(r);
    setResidentForm({
      propertyId: r.property_id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone || '',
      role: r.role,
      isPrimary: r.is_primary,
      password: '',
      isActive: r.is_active,
    });
    setFormError(null);
    setIsEditResidentModalOpen(true);
  };

  const handleAddResident = async (slug: string, onSuccess: (msg: string) => void) => {
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/residents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(residentForm),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsAddResidentModalOpen(false);
        onSuccess(`Residente "${result.data.first_name} ${result.data.last_name}" registrado exitosamente en el padrón.`);
        loadResidents(slug);
      } else {
        setFormError(result.message || 'Error al registrar el residente.');
      }
    } catch {
      setFormError('Error de red al intentar registrar al residente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateResident = async (slug: string, onSuccess: (msg: string) => void) => {
    if (!editingResident) return;
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/residents/${editingResident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          propertyId: residentForm.propertyId,
          firstName: residentForm.firstName,
          lastName: residentForm.lastName,
          email: residentForm.email,
          phone: residentForm.phone,
          role: residentForm.role,
          isPrimary: residentForm.isPrimary,
          isActive: residentForm.isActive,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsEditResidentModalOpen(false);
        onSuccess('Datos del residente actualizados correctamente.');
        loadResidents(slug);
      } else {
        setFormError(result.message || 'Error al actualizar residente.');
      }
    } catch {
      setFormError('Error de conexión al actualizar residente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteResident = async (
    slug: string,
    id: string,
    name: string,
    onSuccess: (msg: string) => void,
  ) => {
    if (!window.confirm(`¿Confirmas la baja del residente "${name}" del padrón? Se revocarán sus accesos y credenciales de app.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/residents/${id}`, {
        method: 'DELETE', headers: authHeaders,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        onSuccess(`Residente "${name}" eliminado del padrón.`);
        loadResidents(slug);
      }
    } catch (err) {
      console.error('Error deleting resident:', err);
    }
  };

  const handleInviteResidents = async (slug: string, ids: string[] | 'ALL', onSuccess: (msg: string) => void, contactMethod: InviteContactMethod = 'AUTO', delivery: InviteDelivery = 'NONE') => {
    setActionLoading(true);
    try {
      const selectedIds = ids === 'ALL' ? [] : ids.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
      if (ids !== 'ALL' && selectedIds.length !== ids.length) {
        throw new Error('La selección contiene un residente inválido. Actualiza el padrón e inténtalo de nuevo.');
      }
      const res = await fetch(`${API_BASE}/tenants/${slug}/residents/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(ids === 'ALL' ? { all: true, contactMethod, delivery } : { residentIds: selectedIds, contactMethod, delivery }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'No se pudieron generar las invitaciones.');
      setInvitationResults(result.data || []);
      setSelectedResidentIds([]);
      onSuccess(`${result.data.length} invitación(es) generada(s). Comparte los enlaces antes de 24 horas.`);
      return result.data;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudieron generar las invitaciones.');
      return [];
    } finally { setActionLoading(false); }
  };

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (residentPropertyFilter && r.property_id !== residentPropertyFilter) {
        return false;
      }

      const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(residentSearchQuery.toLowerCase()) ||
        r.email.toLowerCase().includes(residentSearchQuery.toLowerCase()) ||
        (r.phone && r.phone.toLowerCase().includes(residentSearchQuery.toLowerCase())) ||
        r.street.toLowerCase().includes(residentSearchQuery.toLowerCase()) ||
        r.exterior_number.toLowerCase().includes(residentSearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterResidentRole !== 'ALL' && r.role !== filterResidentRole) {
        return false;
      }

      return true;
    });
  }, [residents, residentSearchQuery, filterResidentRole, residentPropertyFilter]);

  return {
    residents,
    selectedResidentIds,
    setSelectedResidentIds,
    invitationResults,
    setInvitationResults,
    setResidents,
    loadingResidents,
    residentSearchQuery,
    setResidentSearchQuery,
    filterResidentRole,
    setFilterResidentRole,
    residentPropertyFilter,
    setResidentPropertyFilter,
    filteredResidents,
    isAddResidentModalOpen,
    setIsAddResidentModalOpen,
    isEditResidentModalOpen,
    setIsEditResidentModalOpen,
    editingResident,
    residentForm,
    setResidentForm,
    actionLoading,
    formError,
    setFormError,
    loadResidents,
    openAddModal,
    openEditModal,
    handleAddResident,
    handleUpdateResident,
    handleDeleteResident,
    handleInviteResidents,
    resetResidents,
  };
}
