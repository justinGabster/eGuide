'use client';

import { useState, useEffect } from 'react';

export default function Notifications() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [notifications, setNotifications] = useState<any[]>([
    { message: 'EDSA Carousel bus is 5 mins away from your pinned stop (Ayala).', timestamp: Date.now() - 5 * 60000 },
    { message: 'MRT-3 operating on limited capacity due to technical issue.', timestamp: Date.now() - 30 * 60000 },
    { message: 'LRT-1 Train arriving at Monumento Station in 2 mins.', timestamp: Date.now() - 60 * 60000 },
    { message: 'Medical emergency reported at Boni Station. Please expect delays.', timestamp: Date.now() - 120 * 60000 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.removeItem('has_new_notification');
    const saved = localStorage.getItem('mock_notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      // Initialize if empty
      localStorage.setItem('mock_notifications', JSON.stringify(notifications));
    }
  }, []);

  const getRelativeTime = (timestamp?: number, fallbackTime?: string) => {
    if (!timestamp) return fallbackTime || '';
    const diffInMinutes = Math.floor((Date.now() - timestamp) / 60000);
    if (diffInMinutes < 1) return 'Just Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Notifications</h2>
      </div>
      
      <div className="glass-card" style={{ padding: '20px', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {notifications.map((notif, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderBottom: idx < notifications.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: idx < notifications.length - 1 ? '20px' : '0' }}>
              <div style={{ background: 'var(--primary-color)', opacity: 0.8, padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', width: '76px', textAlign: 'center', flexShrink: 0 }}>
                {getRelativeTime(notif.timestamp, notif.time)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: '600', flex: 1 }}>
                {notif.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
