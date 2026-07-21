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
