'use client';

import { useState } from 'react';

export default function Payment() {
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Redirect to the eGovPay Gateway URL
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="title mb-4">eGovPay Wallet</h2>
      
      <div className="glass-card text-center mb-6">
        <p className="text-sm text-muted mb-2">Available Balance</p>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--success)', margin: '0 0 16px 0' }}>
          ₱450.00
        </h1>
        <p className="text-sm text-muted">Use your wallet to tap and ride on all supported transit lines.</p>
      </div>

      <div className="glass-card">
        <h3 className="mb-4">Top Up Wallet</h3>
        
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
    </div>
  );
}
