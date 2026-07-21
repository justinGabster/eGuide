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
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>📍</span>
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
          <span style={{ position: 'absolute', right: '16px', top: '10px', fontSize: '18px', color: 'var(--text-secondary)' }}>
            🔍
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🕒</span> Araneta Center - Cubao
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🕒</span> SM North EDSA | The Annex
          </div>
        </div>
      </div>

      {/* Quick Access Buttons */}
      <Link href="/map" style={{ display: 'block', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
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
          {[1, 2, 3].map((_, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                11:26 PM
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Lorem ipsum dolor sit amet consectetur adipiscing.
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
