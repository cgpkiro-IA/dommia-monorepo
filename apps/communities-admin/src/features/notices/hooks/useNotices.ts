'use client';

import { useState, useMemo } from 'react';
import { CommunityNotice, NoticeFormData, NoticeCategory } from '@/types';

const INITIAL_FORM: NoticeFormData = {
  title: '',
  content: '',
  category: 'GENERAL',
  priority: 'MEDIUM',
  author_name: 'Administración',
  is_pinned: false,
  is_published: true,
};

export function useNotices() {
  const [notices, setNotices] = useState<CommunityNotice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Filters
  const [noticeSearchQuery, setNoticeSearchQuery] = useState('');
  const [filterNoticeCategory, setFilterNoticeCategory] = useState<'ALL' | NoticeCategory>('ALL');

  // Modals & Form
  const [isAddNoticeModalOpen, setIsAddNoticeModalOpen] = useState(false);
  const [isEditNoticeModalOpen, setIsEditNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<CommunityNotice | null>(null);
  const [noticeForm, setNoticeForm] = useState<NoticeFormData>(INITIAL_FORM);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadNotices = async (slug: string) => {
    setLoadingNotices(true);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/notices`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.data || []);
      }
    } catch (err) {
      console.error('Error loading notices:', err);
    } finally {
      setLoadingNotices(false);
    }
  };

  const openAddNoticeModal = () => {
    setNoticeForm(INITIAL_FORM);
    setFormError(null);
    setIsAddNoticeModalOpen(true);
  };

  const openEditNoticeModal = (notice: CommunityNotice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      author_name: notice.author_name,
      is_pinned: notice.is_pinned,
      is_published: notice.is_published,
    });
    setFormError(null);
    setIsEditNoticeModalOpen(true);
  };

  const handleCreateNotice = async (slug: string, onSuccess: (msg: string) => void) => {
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setFormError('El título y contenido del comunicado son requeridos.');
      return;
    }

    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddNoticeModalOpen(false);
        setNoticeForm(INITIAL_FORM);
        await loadNotices(slug);
        onSuccess(data.message || 'Comunicado publicado exitosamente.');
      } else {
        const errorMsg = Array.isArray(data.message) ? data.message.join('. ') : (data.message || 'Error al publicar el comunicado.');
        setFormError(errorMsg);
      }
    } catch {
      setFormError('Error de red al conectar con el servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateNotice = async (slug: string, onSuccess: (msg: string) => void) => {
    if (!editingNotice) return;
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setFormError('El título y contenido del comunicado son requeridos.');
      return;
    }

    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/notices/${editingNotice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditNoticeModalOpen(false);
        setEditingNotice(null);
        await loadNotices(slug);
        onSuccess(data.message || 'Comunicado actualizado exitosamente.');
      } else {
        const errorMsg = Array.isArray(data.message) ? data.message.join('. ') : (data.message || 'Error al actualizar el comunicado.');
        setFormError(errorMsg);
      }
    } catch {
      setFormError('Error de red al conectar con el servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotice = async (slug: string, id: string, title: string, onSuccess: (msg: string) => void) => {
    if (!confirm(`¿Estás seguro de eliminar el comunicado "${title}"?`)) return;

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/notices/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await loadNotices(slug);
        onSuccess(data.message || 'Comunicado eliminado correctamente.');
      }
    } catch {
      console.error('Error deleting notice');
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(noticeSearchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(noticeSearchQuery.toLowerCase()) ||
        n.author_name.toLowerCase().includes(noticeSearchQuery.toLowerCase());

      const matchesCategory =
        filterNoticeCategory === 'ALL' || n.category === filterNoticeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [notices, noticeSearchQuery, filterNoticeCategory]);

  return {
    notices,
    filteredNotices,
    loadingNotices,
    noticeSearchQuery,
    setNoticeSearchQuery,
    filterNoticeCategory,
    setFilterNoticeCategory,
    isAddNoticeModalOpen,
    setIsAddNoticeModalOpen,
    isEditNoticeModalOpen,
    setIsEditNoticeModalOpen,
    editingNotice,
    noticeForm,
    setNoticeForm,
    actionLoading,
    formError,
    loadNotices,
    openAddNoticeModal,
    openEditNoticeModal,
    handleCreateNotice,
    handleUpdateNotice,
    handleDeleteNotice,
  };
}
