'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { User, HelpCircle, Info, Shield, Phone, ThumbsUp, Settings, LogOut, MessageSquare, Unlock, ScanFace, FileText, Edit2, Cake } from 'lucide-react';

import SplashScreen from '@/components/SplashScreen';
import AiChatWidget from '@/components/AiChatWidget';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Commuter',
    phone: '',
    email: '',
    dob: '',
    emergencyContact: ''
  });
  const [editForm, setEditForm] = useState(profileData);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [beepCard, setBeepCard] = useState<{cardNumber: string} | null>(null);
  const [hasNewTransaction, setHasNewTransaction] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const lastNotifFlag = useRef(false);
  const [bannerNotif, setBannerNotif] = useState<{message: string} | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) setProfileImage(savedImage);

    const savedProfile = localStorage.getItem('profileData');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfileData(parsed);
        setEditForm(parsed);
      } catch(e) {}
    }

    const savedBeep = localStorage.getItem('linked_beep_card');
    if (savedBeep) {
      try {
        setBeepCard(JSON.parse(savedBeep));
      } catch(e) {}
    }

    fetch('/api/ai-credits')
      .then(res => res.json())
      .then(data => {
        if (data.credits_remaining !== undefined) {
          setAiCredits(data.credits_remaining);
        }
      })
      .catch(err => console.error("Failed to load credits", err));

    const checkNewData = () => {
      setHasNewTransaction(localStorage.getItem('has_new_transaction') === 'true');
      
      const newNotifFlag = localStorage.getItem('has_new_notification') === 'true';
      if (newNotifFlag !== lastNotifFlag.current) {
        setHasNewNotification(newNotifFlag);
        if (newNotifFlag) {
          const notifs = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
          if (notifs.length > 0) {
            setBannerNotif(notifs[0]);
            setTimeout(() => setBannerNotif(null), 4000); // auto-hide
          }
        }
        lastNotifFlag.current = newNotifFlag;
      }
    };
    checkNewData();
    const interval = setInterval(checkNewData, 1000);
    return () => clearInterval(interval);
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

  const handleSaveProfile = () => {
    const phoneRegex = /^\+63\d{10}$/;
    
    if (editForm.phone && !phoneRegex.test(editForm.phone)) {
      setProfileError('Phone Number must be in +63XXXXXXXXXX format (e.g., +639123456789)');
      return;
    }
    
    if (editForm.emergencyContact && !phoneRegex.test(editForm.emergencyContact)) {
      setProfileError('Emergency Contact must be in +63XXXXXXXXXX format (e.g., +639123456789)');
      return;
    }
    
    setProfileError(null);
    setProfileData(editForm);
    localStorage.setItem('profileData', JSON.stringify(editForm));
    setIsEditingProfile(false);
  };
  
  const navItems = [
    { name: 'Home', path: '/home' },
    { name: 'Ride & Pay', path: '/payment' },
    { name: 'Maps', path: '/map' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Transactions', path: '/transactions' },
  ];

  const getIconSrc = (name: string, isActive: boolean, theme: string) => {
    const t = theme === 'light' ? 'Light' : 'Dark';
    const state = isActive ? '-Selected' : '';
    let iconName = name;
    if (name === 'Ride & Pay') iconName = 'RidePay';
    if (name === 'Notifications') iconName = 'Notif';
    if (name === 'Transactions') iconName = (theme === 'dark' && !isActive) ? 'Transaction' : 'Transactions';
    return `/uiux/${t} Mode/eGovibes Icon_${iconName}-${t}${state}.svg`;
  };

  const menuItems = [
    { label: 'Personal Information', icon: <User size={20} />, action: () => { setEditForm(profileData); setIsEditingProfile(true); } },
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
      <header className="header fade-in" style={{ padding: '20px 24px', paddingTop: 'max(44px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={`/uiux/${theme === 'light' ? 'Light Mode' : 'Dark Mode'}/eGovibes Icon_eGuide Logo-${theme === 'light' ? 'Light' : 'Dark'}.svg`}
            alt="eGuide Logo" 
            style={{ height: '28px', objectFit: 'contain' }} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'none', 
              border: '1px solid var(--border-color)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
            }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            <img 
              src={`/uiux/${theme === 'light' ? 'Light Mode/eGovibes Icon_Dark Mode.svg' : 'Dark Mode/eGovibes Icon_Light Mode.svg'}`}
              alt="Toggle Theme"
              style={{ width: '20px', height: '20px' }}
            />
          </button>
          
          <div 
            className="header-profile" 
            style={{ cursor: 'pointer' }}
            onClick={() => setIsProfileOpen(true)}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="profile-avatar" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="profile-avatar" style={{ backgroundColor: '#2dd4bf', color: 'transparent' }}>D</div>
            )}
          </div>
        </div>
      </header>
      
      <main className="main-content fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      <nav className="bottom-nav fade-in">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className={item.name === 'Maps' ? 'nav-icon-map' : 'nav-icon'}>
                <img src={getIconSrc(item.name, isActive, theme)} alt={item.name} />
                {item.name === 'Notifications' && hasNewNotification && !isActive && (
                  <div className="notification-dot" style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '1px solid var(--card-bg)' }} />
                )}
                {item.name === 'Transactions' && hasNewTransaction && !isActive && (
                  <div className="notification-dot" style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '1px solid var(--card-bg)' }} />
                )}
              </div>
              <span style={item.name === 'Maps' ? { marginTop: '28px' } : {}}>{item.name}</span>
              {item.name !== 'Maps' && <div className="nav-indicator" />}
            </Link>
          );
        })}
      </nav>

      {/* Global AI Chat Widget */}
      <AiChatWidget />

      {/* iOS-Style Banner Notification */}
      {bannerNotif && (
        <div 
          className="slide-down"
          style={{
            position: 'absolute',
            top: '24px',
            left: '50%',
            width: '90%',
            maxWidth: '340px',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999,
            border: '1px solid var(--border-color)',
            cursor: 'pointer'
          }}
          onClick={() => {
            setBannerNotif(null);
            router.push('/notifications');
          }}
        >
          <img src={`/uiux/${theme === 'light' ? 'Light Mode' : 'Dark Mode'}/eGovibes Icon_eGuide Logo-${theme === 'light' ? 'Light' : 'Dark'}.svg`} alt="eGuide" style={{ width: '28px', height: '28px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>eGuide Notification</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{bannerNotif.message}</div>
          </div>
        </div>
      )}

      {/* Profile Drawer Overlay */}
      {isProfileOpen && (
        <div className="profile-drawer slide-up">
          <div style={{ padding: '24px', position: 'relative' }}>
            <span 
              style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '24px', color: 'var(--text-primary)', cursor: 'pointer', zIndex: 10 }}
              onClick={() => isEditingProfile ? setIsEditingProfile(false) : setIsProfileOpen(false)}
            >
              {isEditingProfile ? '‹' : '✕'}
            </span>
            <h2 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '32px' }}>{isEditingProfile ? 'Edit Profile' : 'Account'}</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
              <div 
                style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={40} color="var(--text-secondary)" />
                )}
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                  <Edit2 size={12} />
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />
              <div style={{ color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Hi, {profileData.name}</h3>
                {aiCredits !== null && (
                  <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--status-success-bg)', color: 'var(--status-success-text)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', width: 'fit-content' }}>
                    <span style={{ color: 'var(--success)', fontSize: '10px' }}>●</span> {aiCredits} AI Tokens Remaining
                  </div>
                )}
                {beepCard && (
                  <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--success)', fontWeight: 'bold' }}>
                    💳 Beep: {beepCard.cardNumber.slice(0, 4)} **** **** {beepCard.cardNumber.slice(-4)}
                  </div>
                )}
              </div>
            </div>

            {isEditingProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>FULL NAME</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', height: '48px', padding: '0 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>PHONE NUMBER</label>
                  <input type="text" maxLength={13} value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} placeholder="+639XXXXXXXXX" style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', height: '48px', padding: '0 14px', borderRadius: '12px', border: `1px solid ${profileError && profileError.includes('Phone Number') ? 'var(--danger)' : 'var(--border-color)'}`, background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>EMAIL ADDRESS</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', height: '48px', padding: '0 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>DATE OF BIRTH</label>
                  <input type="date" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', height: '48px', padding: '0 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none', colorScheme: 'var(--theme-mode)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>EMERGENCY CONTACT</label>
                  <input type="text" maxLength={13} value={editForm.emergencyContact || ''} onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})} placeholder="+639XXXXXXXXX" style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', height: '48px', padding: '0 14px', borderRadius: '12px', border: `1px solid ${profileError && profileError.includes('Emergency Contact') ? 'var(--danger)' : 'var(--border-color)'}`, background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                
                {profileError && (
                  <div style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 'bold', marginTop: '-8px' }}>
                    {profileError}
                  </div>
                )}
                
                <button onClick={handleSaveProfile} style={{ width: '100%', padding: '16px', borderRadius: '24px', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold', border: 'none', marginTop: '16px', cursor: 'pointer', fontSize: '16px' }}>
                  Save Changes
                </button>
              </div>
            ) : (
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
            )}
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
