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
  const [selectedOption, setSelectedOption] = useState<1 | 2 | 3>(1);
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
      
      // The third-party SDK injects an iframe that is not mobile responsive.
      // CSS transform breaks click coordinates inside iframes, so we instead
      // force the iframe to be taller and allow the parent wrapper to scroll.
      const fixIframeInterval = setInterval(() => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          if (iframe.src.includes('everify')) {
            const parent = iframe.parentElement;
            if (parent && parent.style.zIndex === '9999') {
              if (window.innerWidth <= 430) {
                // Enable scrolling on the parent fixed div
                parent.style.overflowY = 'auto';
                parent.style.setProperty('-webkit-overflow-scrolling', 'touch');
                
                // Force iframe to be tall enough to fit the modal content
                iframe.style.height = '850px';
                iframe.style.minHeight = '850px';
                iframe.style.transform = 'none';
              }
              clearInterval(fixIframeInterval);
            }
          }
        });
      }, 200);

      const response = await window.eKYC().start({ pubKey });
      clearInterval(fixIframeInterval);
      
      if (response.status !== 'COMPLETED' || !response.result?.session_id) {
        throw new Error('Verification was not completed properly.');
      }

      setStatusText('Validating against PhilSys Registry...');
      const sessionId = response.result.session_id;

      let verifyRes;

      if (selectedOption === 3) {
        // Option 3: Send QR code and face session to QR Verify endpoint
        verifyRes = await fetch('/api/everify/qr-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: qrValue,
            face_liveness_session_id: sessionId
          })
        });
      } else {
        // Option 1: Grab user demographic data saved from SSO step
        const savedUser = localStorage.getItem('egov_user');
        const user = savedUser ? JSON.parse(savedUser) : {};

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
        let errorMsg = verifyData.details 
                    || verifyData.error_description 
                    || verifyData.message 
                    || verifyData.error 
                    || 'Identity verification failed';
        
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
      const errorText = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.warn("eVerify SDK Event:", errorText);
      alert(`Verification Failed: ${errorText}`);
      setStatusText('');
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://hackathon-everify-face-liveness.e.gov.ph/js/everify-liveness-sdk.min.js" strategy="lazyOnload" />
      <main className="mobile-container flex-center">
        <div className="glass-card fade-in" style={{ padding: '24px', width: '100%', maxWidth: '400px' }}>
          <h1 className="title mb-2 text-center">Identity Verification</h1>
          <p className="subtitle mb-6 text-center">Select Verification Method</p>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button 
              onClick={() => setSelectedOption(1)}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-color)', background: selectedOption === 1 ? 'var(--primary-color)' : 'var(--bg-color)', color: selectedOption === 1 ? 'white' : 'var(--text-primary)' }}
            >
              1. Standard
            </button>
            <button 
              onClick={() => setSelectedOption(2)}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-color)', background: selectedOption === 2 ? 'var(--primary-color)' : 'var(--bg-color)', color: selectedOption === 2 ? 'white' : 'var(--text-primary)' }}
            >
              2. Decode QR
            </button>
            <button 
              onClick={() => setSelectedOption(3)}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-color)', background: selectedOption === 3 ? 'var(--primary-color)' : 'var(--bg-color)', color: selectedOption === 3 ? 'white' : 'var(--text-primary)' }}
            >
              3. Full QR
            </button>
          </div>

          <div className="glass-card mb-6" style={{ background: 'var(--bg-color)', padding: '16px' }}>
            {selectedOption === 1 && (
              <div className="fade-in">
                <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Standard SSO & Face Scan</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Compares the profile data you authorized during SSO login against a real-time live biometric face scan.
                </p>
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px', marginBottom: '16px' }}>
                  <p className="text-muted" style={{ fontWeight: 'bold' }}>{statusText || 'Ready for Camera Scan'}</p>
                </div>
                <button 
                  onClick={handleVerification} 
                  disabled={loading}
                  className="btn-primary block"
                  style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Processing...' : 'Start Camera Scan'}
                </button>
              </div>
            )}

            {selectedOption === 2 && (
              <div className="fade-in">
                <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Decode National ID QR</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Simulate scanning a physical National ID card to decrypt its hidden profile data. Does not require a face scan.
                </p>
                <input 
                  type="text" 
                  value={qrValue}
                  onChange={(e) => setQrValue(e.target.value)}
                  placeholder="Paste RAW_QR_CODE_VALUE here..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '12px', marginBottom: '16px' }}
                />
                <button 
                  onClick={handleQrCheck}
                  disabled={loading || !qrValue}
                  className="btn-primary block"
                  style={{ width: '100%', opacity: loading || !qrValue ? 0.7 : 1 }}
                >
                  {loading ? 'Processing...' : 'Test QR Check (Decode)'}
                </button>
              </div>
            )}

            {selectedOption === 3 && (
              <div className="fade-in">
                <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Full QR & Face Verification</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  The highest tier of verification. Compares a scanned National ID QR code against a live face scan.
                </p>
                <input 
                  type="text" 
                  value={qrValue}
                  onChange={(e) => setQrValue(e.target.value)}
                  placeholder="Paste RAW_QR_CODE_VALUE here..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '12px', marginBottom: '16px' }}
                />
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px', marginBottom: '16px' }}>
                  <p className="text-muted" style={{ fontWeight: 'bold' }}>{statusText || 'Ready for Camera Scan'}</p>
                </div>
                <button 
                  onClick={handleVerification} 
                  disabled={loading || !qrValue}
                  className="btn-primary block"
                  style={{ width: '100%', opacity: loading || !qrValue ? 0.7 : 1 }}
                >
                  {loading ? 'Processing...' : 'Verify with QR + Face'}
                </button>
              </div>
            )}
          </div>
          
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
