'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { mrt3Stations, mrt3Matrix, lrta2Stations, lrta2Matrix } from '@/lib/fareMatrix';

type PassengerType = 'REGULAR' | 'STUDENT' | 'SENIOR' | 'PWD';

export default function RideAndPay() {
  const [activeTab, setActiveTab] = useState<'TICKET' | 'TOPUP'>('TICKET');
  
  // TICKET State
  const [passengerType, setPassengerType] = useState<PassengerType>('REGULAR');
  const [userName, setUserName] = useState<string>('Commuter');
  const [userId, setUserId] = useState<string>('eG-12345');
  const phone = '09567669852'; // Static number for all eMessage calls
  
  const [line, setLine] = useState<'MRT-3' | 'LRT-2'>('MRT-3');
  const [originIndex, setOriginIndex] = useState<number>(0);
  const [destIndex, setDestIndex] = useState<number>(8); 
  
  const [simulatingScan, setSimulatingScan] = useState(false);

  // TOPUP State
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const balance = 450.00;

  useEffect(() => {
    const saved = localStorage.getItem('egov_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setUserName(user.givenName || user.firstName || 'Commuter');
        setUserId(user.id || 'eG-12345');
      } catch (e) {
        console.error("Error parsing egov user", e);
      }
    }
  }, []);

  const getCalculatedFare = () => {
    const matrix = line === 'MRT-3' ? mrt3Matrix : lrta2Matrix;
    const baseFare = matrix[originIndex][destIndex];
    if (passengerType === 'REGULAR') return baseFare;
    return baseFare * 0.5;
  };

  const handleTopup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/epay/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to generate link');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const simulateTurnstileScan = async () => {
    if (originIndex === destIndex) return;
    setSimulatingScan(true);
    setError(null);

    const stations = line === 'MRT-3' ? mrt3Stations : lrta2Stations;
    const origin = stations[originIndex];
    const dest = stations[destIndex];
    const fare = getCalculatedFare().toFixed(2);

    const ticketMessage = `eGuide e-Ticket: \nName: ${userName}\nLine: ${line}\nFrom: ${origin}\nTo: ${dest}\nFare: P${fare} (${passengerType})\nThank you for using eGovPay!`;

    try {
      // 1. Send the SMS via eMessage API in the background to both numbers
      const phones = [phone, '09325298802'];
      await Promise.all(phones.map(p => fetch('/api/emessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: p, message: ticketMessage })
      })));

      // 2. Trigger the eGovPay receipt gateway with the exact fare
      const res = await fetch('/api/epay/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(fare) })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to generate payment link');
      
      // Redirect to eGovPay
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setSimulatingScan(false);
    }
  };

  const stations = line === 'MRT-3' ? mrt3Stations : lrta2Stations;
  
  const qrData = JSON.stringify({
    uid: userId,
    type: passengerType,
    line: line,
    origin: stations[originIndex],
    dest: stations[destIndex],
    fare: getCalculatedFare().toFixed(2),
    ts: Date.now()
  });

  return (
    <div>
      <h2 className="title mb-4">Ride & Pay</h2>
      
      <div className="glass-card text-center mb-6">
        <p className="text-sm text-muted mb-2">Available Balance</p>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success)', margin: '0 0 8px 0' }}>
          ₱{balance.toFixed(2)}
        </h1>
        <p className="text-sm text-muted">Use eGovPay for seamless rides.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('TICKET')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'TICKET' ? 'var(--primary-color)' : 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          🎫 Single Journey Ticket
        </button>
        <button 
          onClick={() => setActiveTab('TOPUP')}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'TOPUP' ? 'var(--primary-color)' : 'transparent', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          💳 Wallet Top Up
        </button>
      </div>

      {activeTab === 'TICKET' && (
        <div className="glass-card fade-in">
          
          {/* Conjoined QR Code Display */}
          <div style={{ background: '#0f172a', padding: '24px', borderRadius: '12px', textAlign: 'center', marginBottom: '24px', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
              Dynamic Ticket ({stations[originIndex]} → {stations[destIndex]})
            </div>
            
            {/* Clickable QR Code to simulate scan */}
            <div 
              onClick={simulateTurnstileScan}
              style={{ 
                background: 'white', 
                padding: '16px', 
                borderRadius: '12px', 
                display: 'inline-block', 
                marginBottom: '16px',
                cursor: originIndex === destIndex ? 'not-allowed' : 'pointer',
                opacity: simulatingScan ? 0.5 : 1,
                transform: simulatingScan ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
            >
              <QRCode value={qrData} size={150} level="H" />
            </div>

            {simulatingScan ? (
              <div style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                Scanning at Turnstile...
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
                👆 Tap QR Code to simulate gate scan
              </div>
            )}

            <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
              ₱{getCalculatedFare().toFixed(2)}
            </div>
            {passengerType !== 'REGULAR' && (
              <div style={{ color: 'var(--success)', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
                50% Discount Applied
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Ticket Calculator</h3>
            <select 
              value={line}
              onChange={(e) => {
                setLine(e.target.value as any);
                setOriginIndex(0);
                setDestIndex(1);
              }}
              style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
            >
              <option value="MRT-3">MRT-3</option>
              <option value="LRT-2">LRTA-2</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
             <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Passenger Profile</h4>
             <select 
                value={passengerType}
                onChange={(e) => setPassengerType(e.target.value as PassengerType)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--border-color)' }}
              >
                <option value="REGULAR">Regular Passenger</option>
                <option value="STUDENT">Student (50% Off)</option>
                <option value="SENIOR">Senior Citizen (50% Off)</option>
                <option value="PWD">PWD (50% Off)</option>
              </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Leaving From</p>
            <div style={{ display: 'flex', overflowX: 'auto', padding: '16px 0', gap: '24px', borderBottom: '1px solid var(--border-color)' }} className="hide-scrollbar">
              {stations.map((st, i) => (
                <div key={i} onClick={() => setOriginIndex(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '60px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `3px solid ${originIndex === i ? 'var(--primary-color)' : 'var(--border-color)'}`, background: originIndex === i ? 'var(--primary-color)' : 'transparent', marginBottom: '8px' }} />
                  <span style={{ fontSize: '11px', textAlign: 'center', color: originIndex === i ? 'white' : 'var(--text-secondary)', fontWeight: originIndex === i ? 'bold' : 'normal' }}>{st}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Going To</p>
            <div style={{ display: 'flex', overflowX: 'auto', padding: '16px 0', gap: '24px', borderBottom: '1px solid var(--border-color)' }} className="hide-scrollbar">
              {stations.map((st, i) => (
                <div key={i} onClick={() => setDestIndex(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', minWidth: '60px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `3px solid ${destIndex === i ? '#ef4444' : 'var(--border-color)'}`, background: destIndex === i ? '#ef4444' : 'transparent', marginBottom: '8px' }} />
                  <span style={{ fontSize: '11px', textAlign: 'center', color: destIndex === i ? 'white' : 'var(--text-secondary)', fontWeight: destIndex === i ? 'bold' : 'normal' }}>{st}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>⚠️ {error}</div>}
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
            onClick={handleTopup}
            disabled={loading || !amount || Number(amount) <= 0}
          >
            {loading ? 'Connecting to eGovPay...' : 'Proceed to Payment'}
          </button>
        </div>
      )}
    </div>
  );
}
