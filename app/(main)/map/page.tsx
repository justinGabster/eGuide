export default function Map() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 className="title mb-2">Live Map</h2>
      <p className="text-sm text-muted mb-4">Powered by Project LIGTAS Data</p>
      
      <div className="glass-card" style={{ flex: 1, padding: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Mock Map Background */}
        <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <p className="text-muted">Google Maps Overlay</p>
        </div>
        
        {/* Mock Marker Puno Na Bayan */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px' }}>🚌</div>
          <div style={{ background: 'var(--danger)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>
            🔴 Sardines Mode (9/10)
          </div>
        </div>
      </div>
    </div>
  );
}
