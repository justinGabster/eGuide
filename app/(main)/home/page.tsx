export default function Home() {
  return (
    <div>
      <h2 className="title mb-4">Good Morning, Juan!</h2>
      
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
