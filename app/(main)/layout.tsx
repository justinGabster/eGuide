'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';

import SplashScreen from '@/components/SplashScreen';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) setProfileImage(savedImage);

    fetch('/api/ai-credits')
      .then(res => res.json())
      .then(data => {
        if (data.credits_remaining !== undefined) {
          setAiCredits(data.credits_remaining);
        }
      })
      .catch(err => console.error("Failed to load credits", err));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem('profileImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const navItems = [
    { name: 'Home', path: '/home', iconSrc: '/icons/eGuide UI-UX_g61-6.png' },
    { name: 'Ride & Pay', path: '/payment', iconSrc: '/icons/nav_wallet.png' },
    { name: 'Map', path: '/map', iconSrc: '/icons/nav_map.png' },
    { name: 'Alerts', path: '/notifications', iconSrc: '/icons/nav_bell.png' },
    { name: 'Transactions', path: '/transactions', iconSrc: '/icons/nav_doc.png' },
  ];

  const menuItems = [
    { label: 'Personal Information', icon: '⚙️' },
    { label: 'FAQs', icon: '❓' },
    { label: 'About eGovPH', icon: 'ℹ️' },
    { label: 'Privacy Notice', icon: '🛡️' },
    { label: 'Contact Us', icon: '📞' },
    { label: 'Rate our app', icon: '👍' },
    { label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`, icon: theme === 'light' ? '🌙' : '☀️', action: toggleTheme },
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
    <div className={`layout-container theme-${theme}`}>
      <SplashScreen />
      <header className="header fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="eGuide Logo" style={{ height: '24px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--card-bg)',
              boxShadow: 'var(--shadow-sm)',
              color: 'var(--text-primary)'
            }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <div 
            className="header-profile" 
            style={{ cursor: 'pointer' }}
            onClick={() => setIsProfileOpen(true)}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="profile-avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="profile-avatar">D</div>
            )}
          </div>
        </div>
      </header>
      
      <main className="main-content fade-in">
        {children}
      </main>

      <nav className="bottom-nav fade-in">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path} 
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            style={item.name === 'Map' ? { position: 'relative' } : {}}
          >
            <span className="nav-icon">
              <img 
                src={item.iconSrc} 
                alt={item.name} 
                style={item.name === 'Map' ? { 
                  width: '56px', 
                  height: '56px', 
                  objectFit: 'contain', 
                  position: 'absolute', 
                  top: '-24px', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  borderRadius: '50%', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  backgroundColor: 'var(--card-bg)',
                  padding: '4px'
                } : { 
                  width: '30px', 
                  height: '30px', 
                  objectFit: 'contain' 
                }} 
              />
            </span>
            <span style={item.name === 'Map' ? { marginTop: '24px' } : {}}>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Global AI Chat Widget */}

      {/* Profile Drawer Overlay */}
      {isProfileOpen && (
        <div className="profile-drawer slide-up">
          <div style={{ padding: '24px', position: 'relative' }}>
            <span 
              style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '24px', color: 'var(--text-primary)', cursor: 'pointer' }}
              onClick={() => setIsProfileOpen(false)}
            >
              ✕
            </span>
            <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '32px' }}>Account</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
              <div 
                style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#d1d5db', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>👤</span>
                )}
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}>
                  ✏️
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />
              <div style={{ color: 'var(--text-primary)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Hi, DENISSE</h3>
                <p style={{ color: '#4b5563', fontSize: '14px', marginTop: '4px' }}>+639201057839</p>
                <p style={{ color: '#4b5563', fontSize: '14px' }}>dendenissejane@gmail.com</p>
                <p style={{ color: '#4b5563', fontSize: '14px', marginTop: '2px' }}>🎂 January 7, 2006</p>
                {aiCredits !== null && (
                  <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                    <span style={{ color: '#10b981', fontSize: '10px' }}>●</span> {aiCredits} AI Tokens Remaining
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {menuItems.map((item, idx) => {
                const ItemWrapper = item.path ? Link : 'div';
                return (
                  <ItemWrapper 
                    key={idx} 
                    href={item.path || '#'}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6', color: 'var(--text-primary)', cursor: (item.action || item.path) ? 'pointer' : 'default', textDecoration: 'none' }}
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
              style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '24px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setIsSettingsOpen(false)}
            >
              ‹
            </span>
            <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '32px', fontSize: '20px' }}>Settings</h2>
            
            {settingsSections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: '32px' }}>
                <h4 style={{ color: '#9ca3af', fontSize: '12px', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {section.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', color: 'var(--text-primary)' }}>
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
    </div>
  );
}
