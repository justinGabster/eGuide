'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [exchangeCode, setExchangeCode] = useState('');
  const router = useRouter();

  const [apiError, setApiError] = useState<string | null>(null);

  const handleSSOLogin = async () => {
    if (!exchangeCode) {
      setApiError("Please paste the exchange code generated from the eGov sandbox first.");
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      // 1. Fetch access token from real sandbox via our proxy
      const tokenRes = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange_code: exchangeCode
        })
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenRes.ok || !tokenData.access_token) {
        // Handle eGov specific error formats (422 and 403)
        const specificError = tokenData.errors?.exchange_code?.[0] 
                            || tokenData.error_description 
                            || tokenData.message 
                            || tokenData.error 
                            || 'Token exchange failed';
        setApiError(specificError);
        return;
      }

      // 2. Fetch the user profile from real sandbox via our proxy
      const profileRes = await fetch('/api/partner/sso_authentication', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      const profileData = await profileRes.json();
      
      if (profileRes.ok && profileData.status === 200) {
        // Save the real user data
        localStorage.setItem('egov_user', JSON.stringify(profileData.data));
        router.push('/ekyc');
      } else {
        setApiError(profileData.message || 'SSO Auth Failed to fetch profile.');
      }
    } catch (err: any) {
      setApiError(`Failed to authenticate: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mobile-container flex-center">
      <div className="glass-card text-center fade-in" style={{ maxWidth: '380px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <video 
            src="/e.G_gif.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '2px solid var(--border-color)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
            }} 
          />
        </div>
        <h1 className="title mb-2">🚆 eGuide</h1>
        <p className="subtitle mb-6">Metro Manila Commuter Assistant</p>
        
        <div style={{ textAlign: 'left', marginBottom: '24px' }}>
          <p className="text-sm text-muted mb-2">Powered by:</p>
          <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div className="profile-avatar" style={{ width: '30px', height: '30px', fontSize: '12px' }}>PH</div>
             <div>
               <div style={{ fontWeight: 'bold' }}>eGovPH API</div>
               <div className="text-sm text-muted">Single Sign-On Sandbox</div>
             </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
           <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sandbox Exchange Code:</label>
           
           {apiError && (
             <div style={{ 
               padding: '10px', 
               marginTop: '8px',
               marginBottom: '8px', 
               background: 'rgba(255, 0, 0, 0.1)', 
               border: '1px solid rgba(255, 0, 0, 0.3)', 
               borderRadius: '8px',
               color: '#ff4d4f',
               fontSize: '13px'
             }}>
               ⚠️ {apiError}
             </div>
           )}

           <input 
             type="text" 
             value={exchangeCode}
             onChange={(e) => setExchangeCode(e.target.value)}
             placeholder="Paste code from eGov portal..."
             style={{ 
               width: '100%', 
               padding: '12px', 
               marginTop: '4px',
               borderRadius: '8px',
               border: '1px solid var(--border-color)',
               background: 'rgba(0,0,0,0.2)',
               color: 'white'
             }}
           />
        </div>

        <button 
          onClick={handleSSOLogin} 
          disabled={loading || !exchangeCode}
          className="btn-primary"
          style={{ width: '100%', opacity: (loading || !exchangeCode) ? 0.7 : 1, marginBottom: '12px' }}
        >
          {loading ? 'Authenticating...' : 'Login via eGovPH SSO'}
        </button>

        <button 
          onClick={() => router.push('/ekyc')} 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '14px 24px', 
            borderRadius: '12px', 
            background: 'transparent', 
            color: 'var(--text-secondary)', 
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Skip to eVerify (Simulate)
        </button>
      </div>
    </main>
  );
}
