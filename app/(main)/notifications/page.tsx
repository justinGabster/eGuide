'use client';

import Link from 'next/link';

export default function Notifications() {
  return (
    <div>
      <h2 className="title mb-4">Alerts (eMessage)</h2>
      
      <Link href="/map?lineId=mrt-3&stationIdx=10" style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '16px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Approaching Bus</div>
              <div className="text-sm text-muted mt-2">EDSA Carousel bus is 5 mins away from your pinned stop (Ayala).</div>
            </div>
            <span className="text-sm text-muted">Just now</span>
          </div>
        </div>
      </Link>
      
      <Link href="/map?lineId=mrt-3" style={{ display: 'block', textDecoration: 'none', color: 'inherit', opacity: 0.7 }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Service Advisory</div>
              <div className="text-sm text-muted mt-2">MRT-3 operating on limited capacity due to technical issue.</div>
            </div>
            <span className="text-sm text-muted">2h ago</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
