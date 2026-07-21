'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';

type PassengerType = 'REGULAR' | 'STUDENT' | 'SENIOR' | 'PWD';

export default function RideAndPay() {
  const [activeTab, setActiveTab] = useState<'RIDE' | 'TOPUP'>('RIDE');
  const [passengerType, setPassengerType] = useState<PassengerType>('REGULAR');
  
  // Wallet State
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock balance for demo
  const balance = 450.00;

  // Calculate fare based on type
  const getFare = () => {
    const baseFare = 15.00;
    if (passengerType === 'REGULAR') return baseFare;
    // 20% discount
    return baseFare * 0.8;
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

  // The data encoded in the QR code that the turnstile gate scans
  const qrData = JSON.stringify({
    userId: "J-12345",
    type: passengerType,
    fare: getFare().toFixed(2),
    timestamp: Date.now()
  });

  return (
    <div>
      <h2 className="title mb-4">Ride & Pay</h2>
      
      {/* Wallet Balance Header */}
      <div className="glass-card text-center mb-6">
        <p className="text-sm text-muted mb-2">Available Balance</p>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success)', margin: '0 0 8px 0' }}>
          ₱{balance.toFixed(2)}
        </h1>
        <p className="text-sm text-muted">Valid for LRT, MRT, and eJeeps</p>
      </div>

      {/* Tabs */}
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

      {/* RIDE TAB */}
      {activeTab === 'RIDE' && (
        <div className="glass-card fade-in text-center">
          <h3 className="mb-2">Scan at the Gate</h3>
          <p className="text-sm text-muted mb-6">Present this QR code to the turnstile scanner.</p>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <QRCode value={qrData} size={180} level="H" />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Passenger Profile (Demo Toggle)</h4>
            <select 
              value={passengerType}
              onChange={(e) => setPassengerType(e.target.value as PassengerType)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--border-color)', marginBottom: '12px' }}
            >
              <option value="REGULAR">Regular Passenger</option>
              <option value="STUDENT">Student (20% Off)</option>
              <option value="SENIOR">Senior Citizen (20% Off)</option>
              <option value="PWD">PWD (20% Off)</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted">Calculated Base Fare:</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>₱{getFare().toFixed(2)}</span>
            </div>
            {passengerType !== 'REGULAR' && (
              <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '4px', textAlign: 'right' }}>
                * 20% discount applied automatically
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOPUP TAB */}
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
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)', 
                background: 'rgba(0,0,0,0.4)', 
                color: 'white', 
                fontSize: '24px',
                textAlign: 'center'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[100, 200, 500, 1000].map(val => (
              <button 
                key={val}
                onClick={() => setAmount(val.toString())}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: amount === val.toString() ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${amount === val.toString() ? 'var(--primary-color)' : 'transparent'}`,
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
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
