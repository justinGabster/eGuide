'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AiChatWidget from '@/components/AiChatWidget';
import { BeepCard } from '@/lib/fareTypes';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [beepCard, setBeepCard] = useState<BeepCard | null>(null);
  const [egPoints, setEgPoints] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [recentNotifs, setRecentNotifs] = useState<any[]>([
    { message: 'EDSA Carousel bus is 5 mins away from your pinned stop (Ayala).', timestamp: Date.now() - 5 * 60000 },
    { message: 'MRT-3 operating on limited capacity due to technical issue.', timestamp: Date.now() - 30 * 60000 }
  ]);
  const { theme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedBeep = localStorage.getItem('linked_beep_card');
    if (savedBeep) {
      try {
        setBeepCard(JSON.parse(savedBeep));
      } catch (e) { }
    }

    const savedPoints = localStorage.getItem('mock_eg_points');
    if (savedPoints) {
      setEgPoints(Number(savedPoints));
    } else {
      setEgPoints(120); // initial demo value
      localStorage.setItem('mock_eg_points', '120');
    }

    const savedNotifs = localStorage.getItem('mock_notifications');
    if (savedNotifs) {
      setRecentNotifs(JSON.parse(savedNotifs).slice(0, 2));
    }
  }, []);

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <img src={`/uiux/${theme === 'light' ? 'Light Mode/eGovibes Icon_Location-Light.svg' : 'Dark Mode/eGovibes Icon_Location-Dark.svg'}`} alt="Location" style={{ width: '24px', height: '24px' }} />
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>CITY OF CALOOCAN</h2>
            <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)' }}>Metro Manila</p>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Search Card */}
      <div className="glass-card mb-6" style={{ padding: '24px 20px', backgroundColor: 'var(--card-bg)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Where are you headed?
        </h3>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search your drop-off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push('/map'); }}
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingRight: '40px',
              borderRadius: '24px',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
              fontSize: '14px'
            }}
          />
          <span 
            onClick={() => router.push('/map')}
            style={{ position: 'absolute', right: '16px', top: '11px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <div onClick={() => router.push('/map')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Araneta Center - Cubao
          </div>
          <div onClick={() => router.push('/map')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            SM North EDSA | The Annex
          </div>
        </div>
      </div>

      {/* Quick Access Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
        {[
          { name: 'Trains', icon: 'Trains', href: '/map' },
          { name: 'Buses', icon: 'Buses', href: '/map' },
          { name: 'PUVs', icon: 'PUVs', href: '/map' },
          { name: 'Report', icon: 'Report', href: '/report' }
        ].map((item, idx) => (
          <Link key={idx} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <button className="icon-btn" style={{ 
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              transition: 'transform var(--standard-ease)'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src={`/uiux/${theme === 'light' ? 'Light Mode' : 'Dark Mode'}/eGovibes Icon_${item.icon}-${theme === 'light' ? 'Light' : 'Dark'}.svg`} alt={item.name} style={{ width: '64px', height: '64px' }} />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.name}</span>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* EG Points Tile */}
        <Link href="/rewards" style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
          <div className="glass-card fade-in" style={{ padding: '16px', background: 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)', color: 'white', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                <svg width="48" height="48" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * (Math.min(egPoints, 500) / 500))} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' }}>
                  🪙
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '10px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '2px' }}>
                {egPoints < 100 ? 'Commuter' : egPoints < 500 ? 'Transit Ranger' : 'Train Master'}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: '1' }}>{egPoints}</div>
              <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>EG Points</div>
            </div>
          </div>
        </Link>

        {/* Linked Beep Card Tile */}
        {beepCard ? (
          <div className="glass-card fade-in" style={{ padding: '16px', background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)', color: 'white', borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px', fontStyle: 'italic', letterSpacing: '-0.5px' }}>beep</div>
              <Link href="/payment" style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '8px', color: 'white', textDecoration: 'none', fontSize: '10px', fontWeight: 'bold' }}>
                Reload
              </Link>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '4px' }}>Linked Card</div>
              <div style={{ fontSize: '13px', letterSpacing: '1px', fontFamily: 'monospace' }}>
                **** {beepCard.cardNumber.slice(-4)}
              </div>
            </div>
          </div>
        ) : (
          <Link href="/payment" style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
            <div className="glass-card fade-in" style={{ padding: '16px', background: 'var(--card-bg)', border: '2px dashed var(--border-color)', borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
               <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
               <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Link Beep Card</div>
            </div>
          </Link>
        )}
      </div>

      {/* Recent Notification Card */}
      <div className="glass-card mb-6" style={{ padding: '20px', position: 'relative', overflow: 'visible' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Recent Notifications
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '40px' }}>
          {recentNotifs.map((notif, idx) => {
            let relativeTime = notif.time;
            if (notif.timestamp) {
              const diff = Math.floor((Date.now() - notif.timestamp) / 60000);
              if (diff < 1) relativeTime = 'Just Now';
              else if (diff < 60) relativeTime = `${diff}m ago`;
              else {
                const diffHr = Math.floor(diff / 60);
                if (diffHr < 24) relativeTime = `${diffHr}h ago`;
                else relativeTime = `${Math.floor(diffHr / 24)}d ago`;
              }
            }
            return (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--primary-color)', opacity: 0.8, padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', width: '64px', textAlign: 'center', flexShrink: 0 }}>
                {relativeTime}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4', fontWeight: '600', flex: 1 }}>
                {notif.message}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Widget moved to layout.tsx as a global FAB */}

    </div>
  );
}
