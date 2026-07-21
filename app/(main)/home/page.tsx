'use client';

import { useState } from 'react';
import Link from 'next/link';
import AiChatWidget from '@/components/AiChatWidget';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>CITY OF MANDALUYONG</h2>
            <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-secondary)' }}>METRO MANILA</p>
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
            placeholder="Search your drop-off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              paddingRight: '40px',
              borderRadius: '24px', 
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
              outline: 'none',
              fontSize: '14px'
            }}
          />
          <span style={{ position: 'absolute', right: '16px', top: '11px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Araneta Center - Cubao
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--text-secondary)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            SM North EDSA | The Annex
          </div>
        </div>
      </div>

      {/* Quick Access Buttons */}
      <Link href="/map" style={{ display: 'block', marginTop: '24px', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <img 
          src="/icons/quick_access_flat.png" 
          alt="Quick Access: Trains, Buses, PUVs, Report" 
          className="dark-invert"
          style={{ width: '100%', height: 'auto', display: 'block' }} 
        />
      </Link>

      {/* Recent Notification Card */}
      <div className="glass-card mb-6" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Recent Notification
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { title: 'Approaching Bus', message: 'EDSA Carousel bus is 5 mins away from your pinned stop (Ayala).', time: 'Just now' },
            { title: 'Service Advisory', message: 'MRT-3 operating on limited capacity due to technical issue.', time: '2h ago' }
          ].map((notif, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {notif.time}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <strong>{notif.title}</strong>: {notif.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <AiChatWidget />
      </div>
      
    </div>
  );
}
