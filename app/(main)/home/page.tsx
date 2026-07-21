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
          border: '4px solid black', 
          borderRadius: '16px', 
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          transition: 'transform 0.2s ease',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000'
        }}
        onClick={() => setIsZoomed(true)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img src="/nationalID.png" alt="National ID" style={{ width: '100%', height: 'auto', display: 'block' }} />
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '24px', opacity: 0.8, background: 'rgba(255,255,255,0.7)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>🔎</div>
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
            overflow: 'hidden',
            width: '100%',
            maxWidth: '90vw',
            maxHeight: '90vh',
            transform: 'scale(1.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <img src="/nationalID.png" alt="National ID Zoomed" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', maxHeight: '80vh' }} />
            <div style={{ textAlign: 'center', padding: '12px', fontSize: '14px', color: '#fff', background: 'rgba(0,0,0,0.8)' }}>
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      <div className="glass-card mb-4">
        <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/e.G.png" alt="e.G Mascot" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> 
          e.G
        </h3>
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
