import React from 'react';

export default function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notificaciones"
      title="Notificaciones"
      className="text-gray-500 text-base hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900"
    >
      🔔
    </button>
  );
}
