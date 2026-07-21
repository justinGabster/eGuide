'use client';

import { useState } from 'react';

export default function Home() {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div>
      <h2 className="title mb-4">Good Morning, Denisse!</h2>
      
      {/* National ID Card */}
      <h3 className="mb-2 text-sm text-muted uppercase tracking-wider">Philippine ID</h3>
      <div 
        className="mb-6 cursor-pointer"
        style={{ 
          border: '3px solid black', 
          borderRadius: '16px', 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: 'white',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          transition: 'transform 0.2s ease',
          position: 'relative'
        }}
        onClick={() => setIsZoomed(true)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Republika ng Pilipinas</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '16px' }}>Philippine Identification Card</div>
            
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Last Name</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Karim</div>
            
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Given Names</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Denisse Jane</div>
            
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Date of Birth</div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>2006/01/07</div>
          </div>
          <div style={{ width: '80px', height: '80px', background: '#d1d5db', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px' }}>
            👤
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '24px', opacity: 0.5 }}>🔎</div>
      </div>

      {/* Modal for Zoomed ID */}
      {isZoomed && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
          onClick={() => setIsZoomed(false)}
        >
          <div style={{ 
            border: '4px solid black', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: 'white',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            transform: 'scale(1.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Republika ng Pilipinas</div>
                <div style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '24px' }}>Philippine Identification Card</div>
                
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Last Name</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '12px' }}>Karim</div>
                
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Given Names</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '12px' }}>Denisse Jane</div>
                
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Date of Birth</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '12px' }}>2006/01/07</div>

                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Blood Type</div>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>O+</div>
              </div>
              <div style={{ width: '100px', height: '100px', background: '#d1d5db', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '48px' }}>
                👤
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#64748b' }}>
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      <div className="glass-card mb-4">
        <h3 className="mb-2">eGovAI Transit Assistant</h3>
        <p className="text-sm text-muted mb-4">Ask me anything about your commute.</p>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontStyle: 'italic' }}>
          "Where is the nearest P2P bus stop to BGC?"
        </div>
      </div>
      
      <h3 className="mb-4 mt-6">Quick Status (Project LIGTAS Data)</h3>
      <div className="glass-card">
        <div className="mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>MRT-3</div>
            <div className="text-sm text-muted">Normal Operations</div>
          </div>
          <div className="status-indicator status-green"></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>EDSA Carousel</div>
            <div className="text-sm text-muted">Heavy Traffic at Cubao</div>
          </div>
          <div className="status-indicator status-yellow"></div>
        </div>
      </div>
    </div>
  );
}
