'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    // In a real app, the eGov gateway might pass the UUID or TxnID back in the URL search params.
    // We would extract it like this:
    // const params = new URLSearchParams(window.location.search);
    // const uuid = params.get('uuid');

    // For this hackathon demo, we will simulate a successful verification delay.
    const verifyPayment = async () => {
      try {
        await new Promise(r => setTimeout(r, 2000));
        
        // Process the topup locally for demo purposes
        const pendingAmount = localStorage.getItem('pending_topup');
        if (pendingAmount) {
          const currentBalance = Number(localStorage.getItem('mock_balance')) || 500.00;
          const newBalance = currentBalance + Number(pendingAmount);
          localStorage.setItem('mock_balance', newBalance.toFixed(2));
          
          const txsStr = localStorage.getItem('mock_transactions');
          const txs = txsStr ? JSON.parse(txsStr) : [];
          txs.unshift({
            id: Date.now().toString(),
            type: 'eGuide Wallet Top-up',
            desc: 'via eGovPay',
            amount: Number(pendingAmount),
            date: new Date().toISOString(),
            isAddition: true
          });
          localStorage.setItem('mock_transactions', JSON.stringify(txs));
          localStorage.removeItem('pending_topup');

          // Send SMS Receipt for Top-up!
          try {
            const phones = ['09567669852', '09325298802'];
            const message = `eGuide Wallet:\nYou successfully added P${pendingAmount} via eGovPay.\nNew Balance: P${newBalance.toFixed(2)}`;
            
            phones.forEach(p => {
              fetch('/api/emessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: p, message })
              });
            });
          } catch (e) {
            console.error("Failed to send topup sms", e);
          }
        }

        setStatus('success');
      } catch (err) {
        setStatus('failed');
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="flex-center" style={{ textAlign: 'center', paddingTop: '40px' }}>
      {status === 'verifying' && (
        <div className="glass-card fade-in">
          <h2 className="title mb-4">Verifying Payment...</h2>
          <p className="text-muted">Please wait while we confirm your transaction with eGovPay.</p>
          <div style={{ marginTop: '24px', fontSize: '40px' }}>⏳</div>
        </div>
      )}

      {status === 'success' && (
        <div className="glass-card fade-in">
          <div style={{ fontSize: '64px', color: 'var(--success)', marginBottom: '16px' }}>✓</div>
          <h2 className="title mb-2">Payment Successful!</h2>
          <p className="text-muted mb-6">Your eGuide Wallet has been topped up.</p>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-muted">Status</span>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>PAID</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="text-muted">Gateway</span>
              <span style={{ color: 'white' }}>eGovPay</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Time</span>
              <span style={{ color: 'white' }}>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          <button 
            className="btn-primary w-full"
            style={{ width: '100%' }}
            onClick={() => router.push('/payment')}
          >
            Back to Wallet
          </button>
        </div>
      )}

      {status === 'failed' && (
        <div className="glass-card fade-in">
          <div style={{ fontSize: '64px', color: 'var(--danger)', marginBottom: '16px' }}>✕</div>
          <h2 className="title mb-2">Payment Failed</h2>
          <p className="text-muted mb-6">We could not verify your transaction.</p>
          <button 
            className="btn-primary w-full"
            style={{ width: '100%', background: 'var(--danger)' }}
            onClick={() => router.push('/payment')}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
