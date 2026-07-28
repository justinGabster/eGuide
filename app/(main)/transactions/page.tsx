'use client';

import { useEffect, useState } from 'react';

type Transaction = {
  id: string;
  type: string;
  desc: string;
  amount: number;
  date: string;
  isAddition: boolean;
};

const TrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color)' }}>
    <rect x="4" y="3" width="16" height="16" rx="2" ry="2"/>
    <path d="M4 11h16"/>
    <path d="M12 3v8"/>
    <path d="M8 19l-2 3"/>
    <path d="M18 22l-2-3"/>
    <path d="M8 15h.01"/>
    <path d="M16 15h.01"/>
  </svg>
);

const BusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color)' }}>
    <path d="M19 17h2l.64-2.54c.24-.96.36-1.92.36-2.92V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4.54c0 1 .12 1.96.36 2.92L4 17h2"/>
    <path d="M6 17v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2"/>
    <path d="M14 17v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2"/>
    <path d="M4 10h16"/>
    <path d="M7 14h.01"/>
    <path d="M17 14h.01"/>
  </svg>
);

const JeepneyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--warning)' }}>
    <rect x="2" y="7" width="20" height="10" rx="2" ry="2"/>
    <path d="M2 12h20"/>
    <path d="M6 17v2"/>
    <path d="M18 17v2"/>
    <path d="M9 12v5"/>
    <path d="M15 12v5"/>
  </svg>
);

const CardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}>
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}>
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
  </svg>
);

const getIconForType = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('bus')) return <BusIcon />;
  if (lower.includes('jeep') || lower.includes('uv')) return <JeepneyIcon />;
  if (lower.includes('mrt') || lower.includes('lrt') || lower.includes('pnr') || lower.includes('train')) return <TrainIcon />;
  if (lower.includes('beep')) return <CardIcon />;
  return <WalletIcon />;
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    localStorage.removeItem('has_new_transaction');
    const savedTxs = localStorage.getItem('mock_transactions');
    if (savedTxs) {
      setTransactions(JSON.parse(savedTxs));
    } else {
      // Mock initial data if none exists
      const mockInitial = [
        {
          id: '1',
          type: 'LRT-2 Fare',
          desc: 'Recto Station to Antipolo Station (Reg ₱16 - 5% App)',
          amount: 15.20,
          date: new Date(Date.now() - 86400000).toISOString(),
          isAddition: false
        },
        {
          id: '1a',
          type: 'Modern Jeepney Fare',
          desc: '10 km (Reg ₱30.80 - 5% App)',
          amount: 29.26,
          date: new Date(Date.now() - 96400000).toISOString(),
          isAddition: false
        },
        {
          id: '2',
          type: 'Beep Card Reload',
          desc: 'via eGovPay',
          amount: 100.00,
          date: new Date(Date.now() - 150000000).toISOString(),
          isAddition: true
        },
        {
          id: '3',
          type: 'eGuide Wallet Top-up',
          desc: 'via eGovPay',
          amount: 500.00,
          date: new Date(Date.now() - 172800000).toISOString(),
          isAddition: true
        }
      ];
      setTransactions(mockInitial);
      localStorage.setItem('mock_transactions', JSON.stringify(mockInitial));
    }
  }, []);

  return (
    <div>
      <h2 className="title mb-4">Transactions</h2>
      <p className="text-sm text-muted mb-4">eGovPay Ledger</p>
      
      {transactions.length === 0 ? (
        <div className="glass-card text-center text-muted">
          No transactions yet.
        </div>
      ) : (
        transactions.map((tx) => {
          const dateObj = new Date(tx.date);
          const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={tx.id} className="glass-card mb-4 fade-in" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{ flexShrink: 0, padding: '8px', background: 'var(--bg-color)', borderRadius: '50%' }}>
                    {getIconForType(tx.type)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.desc}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{dateStr} • {timeStr}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: tx.isAddition ? 'var(--success)' : 'var(--danger)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {tx.isAddition ? '+' : '-'} ₱{tx.amount.toFixed(2)}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  );
}
