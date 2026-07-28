'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const predefinedReports = [
  { id: 'medical', title: 'Medical Emergency', icon: '🚑', desc: 'Require immediate medical assistance.' },
  { id: 'security', title: 'Security / Theft', icon: '🚓', desc: 'Report a crime, theft, or security threat.' },
  { id: 'breakdown', title: 'Vehicle Breakdown', icon: '🚌', desc: 'Transit vehicle is broken down or stalled.' },
  { id: 'hazard', title: 'General Hazard', icon: '⚠️', desc: 'Fire, flood, or environmental danger.' }
];

const SlideToConfirm = ({ onConfirm, isSending, label }: { onConfirm: () => void, isSending: boolean, label: string }) => {
  const [sliderValue, setSliderValue] = useState(0);

  const handleDragEnd = () => {
    if (sliderValue >= 85) {
      setSliderValue(100);
      onConfirm();
    } else {
      setSliderValue(0);
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '48px',
      background: 'rgba(239, 68, 68, 0.1)',
      borderRadius: '24px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    }}>
      <div style={{ position: 'absolute', zIndex: 1, color: 'var(--danger)', fontWeight: 'bold', fontSize: '13px', pointerEvents: 'none', paddingLeft: '24px' }}>
        {isSending ? 'Transmitting Alert...' : `Slide to ${label}`}
      </div>
      
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${sliderValue}%`,
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        transition: sliderValue === 0 || sliderValue === 100 ? 'width 0.3s ease' : 'none',
      }} />

      <input 
        type="range" 
        min="0" 
        max="100" 
        value={sliderValue} 
        onChange={(e) => setSliderValue(Number(e.target.value))}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
        disabled={isSending}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: isSending ? 'default' : 'grab',
          zIndex: 3
        }}
      />
      
      <div style={{
        position: 'absolute',
        left: `calc(${sliderValue}% - ${(sliderValue / 100) * 44}px + 2px)`,
        top: '2px',
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        pointerEvents: 'none',
        transition: sliderValue === 0 || sliderValue === 100 ? 'left 0.3s ease' : 'none',
        zIndex: 2
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>
    </div>
  );
};

export default function ReportPage() {
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('profileData');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.emergencyContact) {
          setEmergencyContact(parsed.emergencyContact);
        }
        if (parsed.name) setUserName(parsed.name);
        if (parsed.phone) setUserPhone(parsed.phone);
      } catch(e) {}
    }
  }, []);

  const handleSendAlert = async () => {
    if (!selectedReport) return;
    
    if (!emergencyContact) {
      setStatusMsg({ type: 'error', text: 'No emergency contact set! Please update your Personal Information.' });
      return;
    }

    const reportData = predefinedReports.find(r => r.id === selectedReport);
    setIsSending(true);
    setStatusMsg(null);

    const message = `🚨 EMERGENCY ALERT: ${reportData?.title} reported via eGuide app by ${userName || 'User'} (${userPhone || 'No number provided'}). Immediate assistance requested!`;

    try {
      const res = await fetch('/api/emessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: emergencyContact, message })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to send alert');
      }

      // Also send a confirmation text to the user's own phone if available
      if (userPhone) {
        try {
          await fetch('/api/emessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              number: userPhone, 
              message: `eGuide System: Your SOS alert for ${reportData?.title} was successfully dispatched to your emergency contact.` 
            })
          });
        } catch (e) {
          console.error('Failed to send confirmation to user', e);
        }
      }

      const newNotif = { message: `SOS Alert Dispatched: ${reportData?.title}`, timestamp: Date.now() };
      const savedNotifs = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
      localStorage.setItem('mock_notifications', JSON.stringify([newNotif, ...savedNotifs]));
      localStorage.setItem('has_new_notification', 'true');

      setStatusMsg({ type: 'success', text: `Alert sent to ${emergencyContact} successfully! You will also receive a confirmation text.` });
      setSelectedReport(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error communicating with eMessage API.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Link href="/home" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginRight: '16px', fontSize: '24px', fontWeight: 'bold' }}>
          ‹
        </Link>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Incident Report</h2>
      </div>

      <div className="glass-card mb-6" style={{ padding: '16px 12px', backgroundColor: 'var(--card-bg)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-primary)' }}>Emergency Dispatch</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
          Tap a category below to instantly send an SMS alert to your configured Emergency Contact.
        </p>

        {statusMsg && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px', 
            fontSize: '13px', 
            fontWeight: 'bold',
            backgroundColor: statusMsg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            color: statusMsg.type === 'success' ? 'var(--status-success-text)' : 'var(--status-danger-text)'
          }}>
            {statusMsg.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {predefinedReports.map(report => (
            <div 
              key={report.id}
              onClick={() => {
                if (isSending) return;
                setSelectedReport(selectedReport === report.id ? null : report.id);
              }}
              style={{
                border: `2px solid ${selectedReport === report.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all var(--standard-ease)',
                backgroundColor: selectedReport === report.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{report.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '14px', marginBottom: '2px' }}>
                    {report.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {report.desc}
                  </div>
                </div>
              </div>

              {selectedReport === report.id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <SlideToConfirm 
                      onConfirm={handleSendAlert} 
                      isSending={isSending} 
                      label={`Send SOS to ${emergencyContact || 'Contact'}`} 
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
