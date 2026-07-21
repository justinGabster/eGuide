'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [exchangeCode, setExchangeCode] = useState('');
  const router = useRouter();

  const handleSSOLogin = async () => {
    if (!exchangeCode) {
      alert("Please paste the exchange code generated from the eGov sandbox first.");
      return;
    }

    setLoading(true);
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
        throw new Error(tokenData.error || 'Token exchange failed');
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
        throw new Error(profileData.message || 'SSO Auth Failed');
      }
    } catch (err: any) {
      alert(`Failed to authenticate: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mobile-container flex-center">
      <div className="glass-card text-center fade-in">
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
          style={{ width: '100%', opacity: (loading || !exchangeCode) ? 0.7 : 1 }}
        >
          {loading ? 'Authenticating...' : 'Login via eGovPH SSO'}
        </button>
      </div>
    </main>
  );
}
