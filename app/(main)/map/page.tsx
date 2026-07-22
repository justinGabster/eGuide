'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="text-muted">Loading map...</p>
    </div>
  )
});

export default function Map() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 200px)' }}>
      <h2 className="title mb-2">Live Map</h2>
      <p className="text-sm text-muted mb-4">Powered by Project LIGTAS Data</p>
      
      <div className="glass-card" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden', minHeight: '400px' }}>
        <MapComponent />
      </div>
    </div>
  );
}
