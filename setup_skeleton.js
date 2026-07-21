const fs = require('fs');
const path = require('path');

const write = (p, content) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.trim() + '\n');
};

const globalsCss = `:root {
  --bg-color: #0f172a;
  --card-bg: rgba(30, 41, 59, 0.7);
  --primary-color: #3b82f6;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: rgba(255, 255, 255, 0.1);
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
}

body {
  background-color: var(--bg-color);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, sans-serif;
  margin: 0;
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

.mobile-container {
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background-color: var(--bg-color);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

.flex-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  flex: 1;
}

.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  display: block;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
}

.text-center { text-align: center; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.mt-6 { margin-top: 24px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.text-sm { font-size: 14px; }
.text-muted { color: var(--text-secondary); }
.block { display: block; }
.title { font-size: 24px; font-weight: bold; }
.subtitle { font-size: 16px; color: var(--text-secondary); }

.fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}
.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.verified-badge {
  color: var(--success);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  padding-bottom: 80px;
}

.bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 12px 0 24px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  z-index: 10;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  text-decoration: none;
  transition: color 0.2s;
}
.nav-item:hover, .nav-item.active {
  color: var(--primary-color);
}
.nav-icon {
  font-size: 24px;
}

.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.status-green { background-color: var(--success); }
.status-yellow { background-color: var(--warning); }
.status-red { background-color: var(--danger); }

/* Remove default link styling */
a {
  text-decoration: none;
  color: inherit;
}
`;

write('app/globals.css', globalsCss);

const layoutTsx = `
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'eGuide',
  description: 'Metro Manila Commuter Assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
`;
write('app/layout.tsx', layoutTsx);

const pageTsx = `
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
`;
write('app/page.tsx', pageTsx);

const ekycTsx = `
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
`;
write('app/ekyc/page.tsx', ekycTsx);


const mainLayoutTsx = `
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Home', path: '/home', icon: '🏠' },
    { name: 'Payment', path: '/payment', icon: '💳' },
    { name: 'Map', path: '/map', icon: '🗺️' },
    { name: 'Alerts', path: '/notifications', icon: '🔔' },
    { name: 'History', path: '/transactions', icon: '🧾' },
  ];

  return (
    <main className="mobile-container">
      <header className="header fade-in">
        <div className="header-profile">
          <div className="profile-avatar">JC</div>
          <div>
            <div style={{ fontWeight: 'bold' }}>Juan Dela Cruz</div>
            <div className="verified-badge">
              ✓ eGovPH Verified
            </div>
          </div>
        </div>
        <div>
          <span style={{ fontSize: '24px' }}>⚙️</span>
        </div>
      </header>
      
      <div className="main-content fade-in">
        {children}
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className={\`nav-item \${pathname === item.path ? 'active' : ''}\`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
`;
write('app/(main)/layout.tsx', mainLayoutTsx);

const homeTsx = `
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
`;
write('app/(main)/home/page.tsx', homeTsx);

const paymentTsx = `
export default function Payment() {
  return (
    <div>
      <h2 className="title mb-4">eGovPay Transit</h2>
      
      <div className="glass-card text-center mb-6">
        <p className="text-sm text-muted mb-4">Scan-to-Pay QR</p>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', display: 'inline-block' }}>
          {/* Mock QR Code */}
          <div style={{ width: '150px', height: '150px', background: 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)' }}></div>
        </div>
        <p className="text-sm mt-4 font-bold text-success">Balance: ₱450.00</p>
      </div>

      <div className="glass-card">
        <h3 className="mb-2">Beep Card Reload</h3>
        <p className="text-sm text-muted mb-4">Tap card to phone via NFC to top-up via eGovPay.</p>
        <button className="btn-primary w-full" style={{ width: '100%' }}>Reload Card</button>
      </div>
    </div>
  );
}
`;
write('app/(main)/payment/page.tsx', paymentTsx);

const mapTsx = `
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
`;
write('app/(main)/map/page.tsx', mapTsx);

const notificationsTsx = `
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
`;
write('app/(main)/notifications/page.tsx', notificationsTsx);

const transactionsTsx = `
export default function Transactions() {
  return (
    <div>
      <h2 className="title mb-4">Transactions</h2>
      <p className="text-sm text-muted mb-4">eGovPay Ledger</p>
      
      <div className="glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>LRT-2 Fare</div>
            <div className="text-sm text-muted">Recto Station</div>
          </div>
          <div style={{ fontWeight: 'bold', color: 'var(--danger)' }}>- ₱20.00</div>
        </div>
      </div>
      
      <div className="glass-card mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Beep Card Top-up</div>
            <div className="text-sm text-muted">via eGovPay</div>
          </div>
          <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>+ ₱100.00</div>
        </div>
      </div>
    </div>
  );
}
`;
write('app/(main)/transactions/page.tsx', transactionsTsx);

console.log("Scaffolding complete.");
