'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';

type PassengerType = 'REGULAR' | 'STUDENT' | 'SENIOR' | 'PWD';

export default function RideAndPay() {
  const [activeTab, setActiveTab] = useState<'RIDE' | 'TOPUP'>('RIDE');
  const [passengerType, setPassengerType] = useState<PassengerType>('REGULAR');
  const [userName, setUserName] = useState<string>('Commuter');
  const [userId, setUserId] = useState<string>('eG-12345');
  const [isSeniorLock, setIsSeniorLock] = useState(false);
  
  // ID Upload State
  const [uploadState, setUploadState] = useState<'IDLE' | 'SELECTING' | 'VERIFYING' | 'VERIFIED'>('IDLE');
  const [applyingFor, setApplyingFor] = useState<'STUDENT' | 'PWD' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wallet State
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const balance = 450.00;

  useEffect(() => {
    // 1. Fetch user from SSO local storage
    const saved = localStorage.getItem('egov_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setUserName(user.givenName || user.firstName || 'Commuter');
        setUserId(user.id || 'eG-12345');

        // 2. Auto-detect Senior Citizen status
        if (user.birthdate) {
          const birthDate = new Date(user.birthdate);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age >= 60) {
            setPassengerType('SENIOR');
            setIsSeniorLock(true);
          }
        }
      } catch (e) {
        console.error("Error parsing egov user", e);
      }
    }
  }, []);

  const handleUploadClick = (type: 'STUDENT' | 'PWD') => {
    setApplyingFor(type);
    setUploadState('SELECTING');
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // File selected! Start fake eVerify loading
      setUploadState('VERIFYING');
      
      setTimeout(() => {
        setPassengerType(applyingFor!);
        setUploadState('VERIFIED');
      }, 2500); // 2.5 second fake AI verification
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/epay/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to generate payment link');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Real-world Architecture: The QR Code is just a Digital ID.
  // The Turnstile hardware reads this, records entry, and calculates fare upon exit.
  const qrData = JSON.stringify({
    uid: userId,
    type: passengerType,
    ts: Date.now() // Timestamp to prevent replay attacks
  });

  return (
    <div>
      <h2 className="title mb-4">Ride & Pay</h2>
      
      <div className="glass-card text-center mb-6">
        <p className="text-sm text-muted mb-2">Available Balance</p>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success)', margin: '0 0 8px 0' }}>
          ₱{balance.toFixed(2)}
        </h1>
        <p className="text-sm text-muted">Tap QR at LRT/MRT Turnstiles</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('RIDE')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'RIDE' ? 'var(--primary-color)' : 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          📱 Transit Pass
        </button>
        <button 
          onClick={() => setActiveTab('TOPUP')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'TOPUP' ? 'var(--primary-color)' : 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          💳 Top Up
        </button>
      </div>

      {activeTab === 'RIDE' && (
        <div className="glass-card fade-in text-center">
          <h3 className="mb-2">Digital Beep Card</h3>
          <p className="text-sm text-muted mb-6">Scan at entry/exit gates. Fare is calculated automatically.</p>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <QRCode value={qrData} size={180} level="H" />
          </div>

          {/* Passenger Profile Section */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="text-muted text-sm uppercase">Passenger Profile</span>
              {passengerType !== 'REGULAR' && (
                <span style={{ background: 'rgba(52, 211, 153, 0.2)', color: 'var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                  20% DISCOUNT ACTIVE
                </span>
              )}
            </div>

            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              {userName}
            </div>
            <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '16px' }}>
              {passengerType === 'REGULAR' ? 'Regular Passenger' : 
               passengerType === 'SENIOR' ? 'Senior Citizen' : 
               passengerType === 'STUDENT' ? 'Student' : 'PWD'}
            </div>

            {/* Discount Upload Logic */}
            {isSeniorLock ? (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                ✅ Verified Senior Citizen via eGovPH SSO. Discount permanently unlocked.
              </div>
            ) : passengerType === 'REGULAR' ? (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Apply for a 20% discount:</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                
                {uploadState === 'VERIFYING' ? (
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }}>⏳</div>
                    <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--primary-color)' }}>Verifying {applyingFor} ID with eVerify AI...</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleUploadClick('STUDENT')} className="btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>Upload Student ID</button>
                    <button onClick={() => handleUploadClick('PWD')} className="btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>Upload PWD ID</button>
                  </div>
                )}
              </div>
            ) : uploadState === 'VERIFIED' ? (
              <div style={{ fontSize: '12px', color: 'var(--success)' }}>
                ✅ ID Uploaded and Verified by eVerify AI.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {activeTab === 'TOPUP' && (
        <div className="glass-card fade-in">
          <h3 className="mb-4">Add Funds via eGovPay</h3>
          
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Amount (PHP)
            </label>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '24px', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[100, 200, 500, 1000].map(val => (
              <button 
                key={val}
                onClick={() => setAmount(val.toString())}
                style={{ flex: 1, padding: '10px 0', background: amount === val.toString() ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${amount === val.toString() ? 'var(--primary-color)' : 'transparent'}`, color: 'white', borderRadius: '8px', cursor: 'pointer' }}
              >
                ₱{val}
              </button>
            ))}
          </div>

          <button 
            className="btn-primary w-full" 
            style={{ width: '100%' }}
            onClick={handlePayment}
            disabled={loading || !amount || Number(amount) <= 0}
          >
            {loading ? 'Connecting to eGovPay...' : 'Proceed to Payment'}
          </button>
          
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
            Secured by the official Philippine eGovPay Gateway
          </p>
        </div>
      )}
    </div>
  );
}
