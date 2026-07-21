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

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const savedTxs = localStorage.getItem('mock_transactions');
    if (savedTxs) {
      setTransactions(JSON.parse(savedTxs));
    } else {
      // Mock initial data if none exists
      const mockInitial = [
        {
          id: '1',
          type: 'LRT-2 Fare',
          desc: 'Recto Station to Antipolo Station',
          amount: 30.00,
          date: new Date(Date.now() - 86400000).toISOString(),
          isAddition: false
        },
        {
          id: '2',
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
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.type}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.desc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{dateStr} • {timeStr}</div>
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
