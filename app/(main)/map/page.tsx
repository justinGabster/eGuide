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
    <div style={{ 
      position: 'absolute', 
      top: '73px', 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 0 
    }}>
      <MapComponent />
    </div>
  );
}
