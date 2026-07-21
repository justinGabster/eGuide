export default function Notifications() {
  return (
    <div>
      <h2 className="title mb-4">Alerts (eMessage)</h2>
      
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
