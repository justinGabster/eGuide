import Link from 'next/link';

export default function Login() {
  return (
    <main className="mobile-container flex-center">
      <div className="glass-card text-center fade-in">
        <h1 className="title mb-2">🚆 eGuide</h1>
        <p className="subtitle mb-6">Metro Manila Commuter Assistant</p>
        
        <div style={{ textAlign: 'left', marginBottom: '24px' }}>
          <p className="text-sm text-muted mb-2">Powered by:</p>
          <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div className="profile-avatar" style={{ width: '30px', height: '30px', fontSize: '12px' }}>PH</div>
             <div>
               <div style={{ fontWeight: 'bold' }}>eGovPH API</div>
               <div className="text-sm text-muted">Single Sign-On</div>
             </div>
          </div>
        </div>

        <Link href="/ekyc" className="btn-primary mt-6 block">
          Login via eGovPH SSO
        </Link>
      </div>
    </main>
  );
}
