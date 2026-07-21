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
          <Link key={item.path} href={item.path} className={`nav-item ${pathname === item.path ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
