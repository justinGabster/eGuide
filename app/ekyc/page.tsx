import Link from 'next/link';

export default function Ekyc() {
  return (
    <main className="mobile-container flex-center">
      <div className="glass-card text-center fade-in">
        <h1 className="title mb-2">Identity Verification</h1>
        <p className="subtitle mb-6">eVerify API Integration</p>
        
        <div className="glass-card mb-6" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '8px' }}>
            <p className="text-muted">Scanning Face / ID...</p>
          </div>
        </div>

        <p className="text-sm text-muted mb-6">
          Mandatory eKYC verification is required before transit features can be unlocked.
        </p>

        <Link href="/home" className="btn-primary block">
          Simulate Verification Success
        </Link>
      </div>
    </main>
  );
}
