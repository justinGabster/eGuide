'use client';

import { useState } from 'react';

export default function Notifications() {
  const [phoneNumber, setPhoneNumber] = useState('+639');
  const [loadingStatic, setLoadingStatic] = useState(false);
  
  // AI Dynamic States
  const [vehicle, setVehicle] = useState('EDSA Carousel Bus');
  const [distance, setDistance] = useState('2km');
  const [speed, setSpeed] = useState('40km/h');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleTestSms = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      alert("Please enter a valid E.164 phone number (e.g. +639...)");
      return;
    }
    setLoadingStatic(true);
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
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to send SMS');
      alert('Static SMS Sent Successfully!\n\nCheck your phone!');
    } catch (err: any) {
      alert(`eMessage Error: ${err.message}`);
    } finally {
      setLoadingStatic(false);
    }
  };

  const handleTestAiSms = async () => {
    if (!phoneNumber || phoneNumber.length < 11) {
      alert("Please enter a valid E.164 phone number (e.g. +639...)");
      return;
    }
    setLoadingAi(true);
    try {
      const res = await fetch('/api/emessage/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          number: phoneNumber, 
          vehicleType: vehicle,
          distanceStr: distance,
          speedStr: speed
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to send AI SMS');
      alert(`AI SMS Sent Successfully!\n\nThe AI wrote and texted you a custom message based on the speed and distance you entered.`);
    } catch (err: any) {
      alert(`AI eMessage Error: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div>
      <h2 className="title mb-4">Alerts (eMessage)</h2>
      
      <div className="glass-card mb-6 fade-in" style={{ background: 'rgba(0,0,0,0.3)', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'white' }}>Test SMS & AI Pipeline</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Test the eGov SMS Sandbox directly, or chain it with the eGov AI Assistant for dynamic messages.
        </p>
        
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
          Your Phone Number (E.164 format):
        </label>
        <input 
          type="text" 
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+639..."
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '14px', marginBottom: '16px' }}
        />
        
        <button 
          onClick={handleTestSms}
          disabled={loadingStatic || loadingAi}
          className="btn-primary block"
          style={{ width: '100%', opacity: loadingStatic ? 0.7 : 1, marginBottom: '16px', background: 'rgba(255,255,255,0.1)' }}
        >
          {loadingStatic ? 'Sending...' : 'Send Standard Static SMS'}
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />

        <h4 style={{ fontSize: '13px', color: 'white', marginBottom: '8px' }}>Test AI-Generated Alert</h4>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input 
            type="text" 
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="Vehicle"
            style={{ flex: 2, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '12px' }}
          />
          <input 
            type="text" 
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="Distance"
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '12px' }}
          />
          <input 
            type="text" 
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            placeholder="Speed"
            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '12px' }}
          />
        </div>
        
        <button 
          onClick={handleTestAiSms}
          disabled={loadingAi || loadingStatic}
          className="btn-primary block"
          style={{ width: '100%', opacity: loadingAi ? 0.7 : 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          {loadingAi ? 'AI is typing and sending...' : 'Generate & Send Dynamic AI SMS'}
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
