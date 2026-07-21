'use client';

import { useState } from 'react';

export default function Notifications() {
  const [phoneNumber, setPhoneNumber] = useState('+639');
  const [loading, setLoading] = useState(false);

  const handleTestSms = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      alert("Please enter a valid E.164 phone number (e.g. +639...)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/emessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: phoneNumber, 
          message: "eGuide Test Alert: The EDSA Carousel bus is arriving in 5 minutes! 🚌" 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to send SMS');
      }
      alert('SMS Sent Successfully!\n\nCheck your phone!');
    } catch (err: any) {
      alert(`eMessage Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="title mb-4">Alerts (eMessage)</h2>
      
      <div className="glass-card mb-6 fade-in" style={{ background: 'rgba(0,0,0,0.3)', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'white' }}>Test SMS API</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Send a real mock transit alert to your phone number using the eGov eMessage Sandbox.
        </p>
        
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
          Phone Number (E.164 format):
        </label>
        <input 
          type="text" 
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+639..."
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '14px', marginBottom: '12px' }}
        />
        
        <button 
          onClick={handleTestSms}
          disabled={loading}
          className="btn-primary block"
          style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Sending...' : 'Send Test SMS Alert'}
        </button>
      </div>

      <div className="glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Approaching Bus</div>
            <div className="text-sm text-muted mt-2">EDSA Carousel bus is 5 mins away from your pinned stop (Ayala).</div>
          </div>
          <span className="text-sm text-muted">Just now</span>
        </div>
      </div>
      
      <div className="glass-card" style={{ opacity: 0.7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Service Advisory</div>
            <div className="text-sm text-muted mt-2">MRT-3 operating on limited capacity due to technical issue.</div>
          </div>
          <span className="text-sm text-muted">2h ago</span>
        </div>
      </div>
    </div>
  );
}
