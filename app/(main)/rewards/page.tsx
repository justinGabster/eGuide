'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Reward = {
  id: string;
  sponsor: string;
  title: string;
  cost: number;
  image: string;
  desc: string;
};

const REWARDS: Reward[] = [
  {
    id: '1',
    sponsor: "Dunkin'",
    title: 'Morning Rush: Free Classic Donut',
    cost: 50,
    image: '/icons/dunkin.webp',
    desc: 'Get a free Classic Donut with any coffee purchase. Valid from 6 AM - 8 AM.'
  },
  {
    id: '2',
    sponsor: 'Potato Corner',
    title: 'Free Giga Fries Upgrade',
    cost: 30,
    image: '/icons/potato corner.jpg',
    desc: 'Upgrade your Mega Fries to Giga Fries for free. Valid at any SM or Ayala Mall branch.'
  },
  {
    id: '3',
    sponsor: 'Master Siomai',
    title: 'Frequent Rider 3-pc Snack Pack',
    cost: 100,
    image: '/icons/master siomai.jpg',
    desc: 'A delicious 3-piece Siomai snack pack just for you.'
  }
];

export default function Rewards() {
  const [egPoints, setEgPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);

  useEffect(() => {
    const savedPoints = localStorage.getItem('mock_eg_points');
    if (savedPoints) {
      setEgPoints(Number(savedPoints));
    } else {
      setEgPoints(120);
      localStorage.setItem('mock_eg_points', '120');
    }
  }, []);

  const handleRedeem = (reward: Reward) => {
    if (egPoints < reward.cost) {
      alert("Not enough EG Points!");
      return;
    }
    setSelectedReward(reward);
    setRedeeming(true);
    
    // Simulate API call and QR generation
    setTimeout(() => {
      const newPoints = egPoints - reward.cost;
      setEgPoints(newPoints);
      localStorage.setItem('mock_eg_points', newPoints.toString());
      setRedeeming(false);
      setShowVoucher(true);
    }, 1500);
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/home" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <h2 className="title" style={{ margin: 0, fontSize: '18px' }}>EG Points Marketplace</h2>
      </div>

      {/* Point Balance Sticky Card */}
      <div className="glass-card fade-in" style={{ padding: '20px', background: 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)', color: 'white', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Available Balance</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🪙 {egPoints}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Next Tier</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Train Master</div>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{Math.max(0, 500 - egPoints)} pts away</div>
          </div>
        </div>
      </div>

      {/* Hero Carousel (Mock) */}
      <div className="glass-card fade-in" style={{ height: '140px', background: 'var(--primary-color)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', borderRadius: '16px', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '120px', opacity: 0.2 }}>🍩</div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', background: 'rgba(0,0,0,0.2)', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>FLASH SALE</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>50% Off Dunkin'</h3>
          <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>Redeem the Morning Rush bundle now!</p>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px 16px 20px' }}>
        {['All', 'Food', 'Beverage', 'Vouchers', 'Apparel'].map((cat, idx) => (
          <button key={cat} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '20px', border: idx === 0 ? 'none' : '1px solid var(--border-color)', background: idx === 0 ? 'var(--primary-color)' : 'var(--bg-color)', color: idx === 0 ? 'white' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px' }}>
            {cat}
          </button>
        ))}
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>Featured Rewards</h3>

      {/* Reward Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {REWARDS.map(reward => (
          <div key={reward.id} className="glass-card fade-in" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '120px', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {reward.image.startsWith('/') ? (
                <img src={reward.image} alt={reward.sponsor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '48px' }}>{reward.image}</span>
              )}
            </div>
            <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{reward.sponsor}</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: '1.2' }}>{reward.title}</div>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ED8F03', marginBottom: '8px' }}>🪙 {reward.cost}</div>
                <button 
                  onClick={() => setSelectedReward(reward)}
                  className="btn-primary w-full" 
                  style={{ padding: '6px', fontSize: '12px' }}
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sheet Modal for Redemption */}
      {selectedReward && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div className="slide-up" style={{ background: 'var(--card-bg)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', paddingBottom: '40px' }}>
            
            {!showVoucher ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Confirm Redemption</h3>
                  <button onClick={() => setSelectedReward(null)} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-secondary)', cursor: 'pointer' }}>×</button>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '64px', height: '64px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'white' }}>
                    {selectedReward.image.startsWith('/') ? (
                      <img src={selectedReward.image} alt={selectedReward.sponsor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '40px' }}>{selectedReward.image}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{selectedReward.sponsor}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{selectedReward.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedReward.desc}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Cost:</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ED8F03' }}>🪙 {selectedReward.cost} Points</span>
                </div>

                <button 
                  onClick={() => handleRedeem(selectedReward)}
                  disabled={redeeming}
                  className="btn-primary w-full" 
                  style={{ padding: '16px', fontSize: '16px', fontWeight: 'bold' }}
                >
                  {redeeming ? 'Generating Voucher...' : 'Swipe to Redeem ➔'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Voucher Ready!</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Show this dynamic QR code to the cashier at {selectedReward.sponsor}.</p>
                
                <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px' }}>
                  {/* Fake QR */}
                  <div style={{ width: '150px', height: '150px', background: 'url("https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg") center/contain' }}></div>
                </div>
                
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '24px' }}>
                  Valid for: 14:59
                </div>

                <button 
                  onClick={() => {
                    setShowVoucher(false);
                    setSelectedReward(null);
                  }}
                  className="btn-secondary w-full" 
                >
                  Close & Back to Marketplace
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
