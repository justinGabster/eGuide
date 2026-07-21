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
    <div className="flex flex-col w-full px-3 pt-2 pb-24 space-y-2">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-white tracking-tight shrink-0">
        Live Map
      </h1>

      {/* Explicit Height Wrapper for Leaflet */}
      <div 
        className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
        style={{ height: 'calc(100vh - 170px)', minHeight: '420px', maxHeight: '520px' }}
      >
        <MapComponent />
      </div>
    </div>
  );
}
