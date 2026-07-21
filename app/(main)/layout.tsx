'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import AiChatWidget from '@/components/AiChatWidget';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiCredits, setAiCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/ai-credits')
      .then(res => res.json())
      .then(data => {
        if (data.credits_remaining !== undefined) {
          setAiCredits(data.credits_remaining);
        }
      })
      .catch(err => console.error("Failed to load credits", err));
  }, []);
  
  const navItems = [
    { name: 'Home', path: '/home', icon: '🏠' },
    { name: 'Payment', path: '/payment', icon: '💳' },
    { name: 'Map', path: '/map', icon: '🗺️' },
    { name: 'Alerts', path: '/notifications', icon: '🔔' },
    { name: 'History', path: '/transactions', icon: '🧾' },
  ];

  const menuItems = [
    { label: 'Personal Information', icon: '⚙️' },
    { label: 'FAQs', icon: '❓' },
    { label: 'About eGovPH', icon: 'ℹ️' },
    { label: 'Privacy Notice', icon: '🛡️' },
    { label: 'Contact Us', icon: '📞' },
    { label: 'Rate our app', icon: '👍' },
    { label: 'Settings', icon: '⚙️', action: () => setIsSettingsOpen(true) },
    { label: 'Log out', icon: '🚪', path: '/' },
  ];

  const settingsSections = [
    {
      title: 'PRIVACY AND SECURITY',
      items: [
        { label: 'Account Settings', icon: '⚙️' },
        { label: 'Notification Settings', icon: '💬' },
        { label: 'Change PIN', icon: '🔓' },
        { label: 'Face ID Authentication', icon: '🪪', value: 'Enabled' },
      ]
    },
    {
      title: 'ABOUT eGovPH',
      items: [
        { label: 'Terms and Conditions', icon: '📄' },
      ]
    }
  ];

  return (
    <main className="mobile-container" style={{ position: 'relative' }}>
      <header className="header fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" style={{ fontSize: '12px', background: 'var(--danger)', color: 'white', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
            ⎋ Sign Out
          </Link>
          {aiCredits !== null && (
            <div style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '6px 8px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#10b981' }}>●</span> AI Tokens: {aiCredits}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            className="header-profile" 
            style={{ textAlign: 'right', flexDirection: 'row-reverse', cursor: 'pointer' }}
            onClick={() => setIsProfileOpen(true)}
          >
            <div className="profile-avatar">J</div>
            <div>
              <div style={{ fontWeight: 'bold' }}>JUSTIN</div>
              <div className="verified-badge" style={{ justifyContent: 'flex-end' }}>
                ✓ eGovPH Verified
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="main-content fade-in">
        {children}
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className={`nav-item ${pathname === item.path ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Global AI Chat Widget */}
      <AiChatWidget />

      {/* Profile Drawer Overlay */}
      {isProfileOpen && (
        <div className="profile-drawer slide-up">
          <div style={{ padding: '24px', position: 'relative' }}>
            <span 
              style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '24px', color: 'black', cursor: 'pointer' }}
              onClick={() => setIsProfileOpen(false)}
            >
              ✕
            </span>
            <h2 style={{ textAlign: 'center', color: 'black', marginBottom: '32px' }}>Account</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px' }}>
                👤
              </div>
              <div style={{ color: 'black' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Hi, JUSTIN</h3>
                <p style={{ color: '#4b5563', fontSize: '14px', marginTop: '4px' }}>+639325298802</p>
                <p style={{ color: '#4b5563', fontSize: '14px' }}>ajosejustingabriel@gmail.com</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {menuItems.map((item, idx) => {
                const ItemWrapper = item.path ? Link : 'div';
                return (
                  <ItemWrapper 
                    key={idx} 
                    href={item.path || '#'}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6', color: 'black', cursor: (item.action || item.path) ? 'pointer' : 'default', textDecoration: 'none' }}
                    onClick={item.action ? item.action : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: '600' }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      {item.label}
                    </div>
                    <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '20px' }}>›</span>
                  </ItemWrapper>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer Overlay */}
      {isSettingsOpen && (
        <div className="profile-drawer slide-up" style={{ zIndex: 101 }}>
          <div style={{ padding: '24px', position: 'relative' }}>
            <span 
              style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '24px', color: 'black', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setIsSettingsOpen(false)}
            >
              ‹
            </span>
            <h2 style={{ textAlign: 'center', color: 'black', marginBottom: '32px', fontSize: '20px' }}>Settings</h2>
            
            {settingsSections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: '32px' }}>
                <h4 style={{ color: '#9ca3af', fontSize: '12px', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {section.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', color: 'black' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: '600' }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        {item.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.value && <span style={{ color: '#6b7280', fontSize: '14px' }}>{item.value}</span>}
                        <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '20px' }}>›</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
