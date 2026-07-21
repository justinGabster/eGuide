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
