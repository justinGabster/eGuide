'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { User, HelpCircle, Info, Shield, Phone, ThumbsUp, Settings, LogOut, MessageSquare, Unlock, ScanFace, FileText } from 'lucide-react';

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
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const maxDim = 200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setProfileImage(compressedBase64);
            try {
              localStorage.setItem('profileImage', compressedBase64);
            } catch (err) {
              console.error("LocalStorage write failed:", err);
            }
          }
        };
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
    { label: 'Personal Information', icon: <User size={20} /> },
    { label: 'FAQs', icon: <HelpCircle size={20} /> },
    { label: 'About eGovPH', icon: <Info size={20} /> },
    { label: 'Privacy Notice', icon: <Shield size={20} /> },
    { label: 'Contact Us', icon: <Phone size={20} /> },
    { label: 'Rate our app', icon: <ThumbsUp size={20} /> },
    { label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`, icon: theme === 'light' ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', color: 'var(--text-primary)' }}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', color: 'var(--text-primary)' }}>
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    ), action: toggleTheme },
    { label: 'Settings', icon: <Settings size={20} />, action: () => setIsSettingsOpen(true) },
    { label: 'Log out', icon: <LogOut size={20} />, path: '/' },
  ];

  const settingsSections = [
    {
      title: 'PRIVACY AND SECURITY',
      items: [
        { label: 'Account Settings', icon: <Settings size={20} /> },
        { label: 'Notification Settings', icon: <MessageSquare size={20} /> },
        { label: 'Change PIN', icon: <Unlock size={20} /> },
        { label: 'Face ID Authentication', icon: <ScanFace size={20} />, value: 'Enabled' },
      ]
    },
    {
      title: 'ABOUT eGovPH',
      items: [
        { label: 'Terms and Conditions', icon: <FileText size={20} /> },
      ]
    }
  ];

  return (
    <div className={`layout-container theme-${theme}`}>
      <SplashScreen />
      <header className="header fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/logo.png" 
            alt="eGuide Logo" 
            style={{ 
              height: '24px', 
              objectFit: 'contain',
              filter: 'drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white)'
            }} 
          />
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
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
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
      
      <main className="main-content fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
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
                className={item.name !== 'Map' ? 'dark-invert' : ''}
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
                style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
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
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>+639201057839</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>dendenissejane@gmail.com</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>🎂 January 7, 2006</p>
                {aiCredits !== null && (
                  <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--status-success-bg)', color: 'var(--status-success-text)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--success)', fontSize: '10px' }}>●</span> {aiCredits} AI Tokens Remaining
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
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: (item.action || item.path) ? 'pointer' : 'default', textDecoration: 'none' }}
                    onClick={item.action ? item.action : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: '600' }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      {item.label}
                    </div>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '20px' }}>›</span>
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
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '12px', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {section.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontWeight: '600' }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        {item.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.value && <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{item.value}</span>}
                        <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '20px' }}>›</span>
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
