'use client';

import React, { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Check if we've already shown the splash screen this session
    const hasSeenSplash = sessionStorage.getItem('eguide_seen_splash');
    
    if (hasSeenSplash) {
      setVisible(false);
      return;
    }

    // Show for 3 seconds, then fade out
    const timer1 = setTimeout(() => {
      setFading(true);
    }, 2500);

    const timer2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem('eguide_seen_splash', 'true');
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-color)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      <video 
        src="/e.G_gif.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        style={{ width: '200px', height: '200px', objectFit: 'contain', borderRadius: '50%' }}
      />
      <img src="/logo.png" alt="eGuide Logo" style={{ marginTop: '24px', height: '40px', objectFit: 'contain' }} />
      <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
        Authenticating via eGovPH...
      </p>
    </div>
  );
}
