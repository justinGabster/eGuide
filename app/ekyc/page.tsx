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
  const [useQr, setUseQr] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const router = useRouter();

  const handleQrCheck = async () => {
    if (!qrValue) {
      alert("Please enter a QR string first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/everify/qr-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: qrValue })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.message || data.error || 'QR Check Failed');
      }
      alert(`QR Decoded Successfully!\n\n${JSON.stringify(data.data, null, 2)}`);
    } catch (err: any) {
      alert(`QR Check Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

      let verifyRes;

      if (useQr) {
        // Send QR code and face session to QR Verify endpoint
        verifyRes = await fetch('/api/everify/qr-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: qrValue,
            face_liveness_session_id: sessionId
          })
        });
      } else {
        // Grab user demographic data saved from SSO step
        const savedUser = localStorage.getItem('egov_user');
        const user = savedUser ? JSON.parse(savedUser) : {};

        // Send to our backend proxy to securely exchange for verification status
        verifyRes = await fetch('/api/everify', {
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
      }

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        // Parse the various error structures that eGov APIs use
        let errorMsg = verifyData.details 
                    || verifyData.error_description 
                    || verifyData.message 
                    || verifyData.error 
                    || 'Identity verification failed';
        
        // If there are validation errors (like 422 Unprocessable Entity)
        if (verifyData.errors) {
          const firstKey = Object.keys(verifyData.errors)[0];
          if (firstKey) {
             errorMsg = verifyData.errors[firstKey][0] || errorMsg;
          }
        }
        
        throw new Error(errorMsg);
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

          <div style={{ marginBottom: '16px', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={useQr} onChange={(e) => setUseQr(e.target.checked)} />
              Verify using National ID QR Code instead of SSO profile
            </label>

            {useQr && (
              <div style={{ marginTop: '12px' }} className="fade-in">
                <input 
                  type="text" 
                  value={qrValue}
                  onChange={(e) => setQrValue(e.target.value)}
                  placeholder="Paste RAW_QR_CODE_VALUE here..."
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    fontSize: '12px',
                    marginBottom: '8px'
                  }}
                />
                <button 
                  onClick={handleQrCheck}
                  disabled={loading || !qrValue}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Test QR Check (Decode Only)
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleVerification} 
            disabled={loading || (useQr && !qrValue)}
            className="btn-primary block"
            style={{ width: '100%', opacity: loading || (useQr && !qrValue) ? 0.7 : 1, marginBottom: '12px' }}
          >
            {loading ? 'Processing...' : (useQr ? 'Verify with QR + Face' : 'Start Camera Scan')}
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
