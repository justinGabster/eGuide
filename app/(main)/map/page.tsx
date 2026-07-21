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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 className="title mb-4">Live Map</h2>
      
      <div className="glass-card" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden' }}>
        <MapComponent />
      </div>
    </div>
  );
}
