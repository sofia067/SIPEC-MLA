import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/notifications');
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const togglePanel = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) loadNotifications();
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await apiRequest(`/notifications/${notification.id}/read`, { method: 'PATCH' });
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, isRead: true } : item
        )));
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (requestError) {
        setError(requestError.message);
        return;
      }
    }
    setOpen(false);
    navigate(notification.href);
  };

  const markAllRead = async () => {
    setSaving(true);
    setError('');
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label={unreadCount ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-controls="notification-panel"
        title="Notificaciones"
        onClick={togglePanel}
        className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          id="notification-panel"
          aria-label="Notificaciones recientes"
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Avisos recientes</h2>
              <p className="text-xs text-slate-500">Novedades dirigidas a tu usuario</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={saving || unreadCount === 0}
              className="text-xs font-semibold text-blue-800 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
            >
              {saving ? 'Guardando…' : 'Marcar todo leído'}
            </button>
          </div>

          {error && (
            <div role="alert" className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              <span>{error}</span>
              <button type="button" onClick={loadNotifications} className="shrink-0 font-semibold underline">Reintentar</button>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Cargando avisos…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No tienes novedades recientes.</p>
            ) : notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => openNotification(notification)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-blue-50 ${
                  notification.isRead ? 'bg-white' : 'bg-blue-50/60'
                }`}
              >
                <span className="flex items-start gap-2">
                  {!notification.isRead && <span aria-label="Sin leer" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-700" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800">{notification.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-600">{notification.message}</span>
                    <span className="mt-2 block text-[11px] text-slate-400">{formatDate(notification.createdAt)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
