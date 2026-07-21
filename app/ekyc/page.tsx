'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

// Declare the global eKYC object provided by the eGov SDK script
declare global {
  interface Window {
    eKYC: () => {
      start: (config: { pubKey: string }) => Promise<any>;
    };
  }
}

export default function Ekyc() {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const router = useRouter();

  const handleVerification = async () => {
    if (!window.eKYC) {
      alert("eVerify SDK is still loading, please wait a second.");
      return;
    }

    setLoading(true);
    setStatusText('Requesting Camera Access...');

    try {
      const pubKey = process.env.NEXT_PUBLIC_EGOV_EVERIFY_PUB_KEY || 'MOCK_PUB_KEY';
      
      setStatusText('Scanning Face Liveness...');
      const response = await window.eKYC().start({ pubKey });
      
      if (response.status !== 'COMPLETED' || !response.result?.session_id) {
        throw new Error('Verification was not completed properly.');
      }

      setStatusText('Validating against PhilSys Registry...');
      const sessionId = response.result.session_id;

      // Grab user demographic data saved from SSO step
      const savedUser = localStorage.getItem('egov_user');
      const user = savedUser ? JSON.parse(savedUser) : {};

      // Send to our backend proxy to securely exchange for verification status
      const verifyRes = await fetch('/api/everify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: user.first_name || '',
          middle_name: user.middle_name || '',
          last_name: user.last_name || '',
          suffix: user.suffix || '',
          birth_date: user.birth_date || '',
          face_liveness_session_id: sessionId
        })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.details || verifyData.error || 'Identity verification failed');
      }

      setStatusText('Identity Verified Successfully! Redirecting...');
      setTimeout(() => {
        router.push('/home');
      }, 1500);

    } catch (err: any) {
      console.error("eVerify Error:", err);
      alert(`Verification Failed: ${err.message}`);
      setStatusText('');
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://hackathon-everify-face-liveness.e.gov.ph/js/everify-liveness-sdk.min.js" strategy="lazyOnload" />
      <main className="mobile-container flex-center">
        <div className="glass-card text-center fade-in">
          <h1 className="title mb-2">Identity Verification</h1>
          <p className="subtitle mb-6">eVerify Face Liveness</p>
          
          <div className="glass-card mb-6" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px' }}>
              <p className="text-muted" style={{ fontWeight: 'bold' }}>
                {statusText || 'Ready for Camera Scan'}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted mb-6">
            Real-time biometric face liveness check against the PhilSys National ID registry is required.
          </p>

          <button 
            onClick={handleVerification} 
            disabled={loading}
            className="btn-primary block"
            style={{ width: '100%', opacity: loading ? 0.7 : 1, marginBottom: '12px' }}
          >
            {loading ? 'Processing...' : 'Start Camera Scan'}
          </button>
          
          <button 
            onClick={() => router.push('/home')} 
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
            Skip to Home (Simulate)
          </button>
        </div>
      </main>
    </>
  );
}
