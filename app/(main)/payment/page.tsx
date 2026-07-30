'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { 
  mrt3Stations, mrt3Matrix, 
  lrta2Stations, lrta2Matrix, 
  lrt1Stations, lrt1Matrix,
  pnrStations, pnrMatrix,
  calculateFareDetails, calculateRoadFare,
  APP_DISCOUNT_RATE
} from '@/lib/fareMatrix';
import { TransitMode, PassengerType, BeepCard } from '@/lib/fareTypes';

export default function RideAndPay() {
  const [activeTab, setActiveTab] = useState<'TICKET' | 'TOPUP'>('TICKET');
  
  // TICKET State
  const [passengerType, setPassengerType] = useState<PassengerType>('REGULAR');
  const [userName, setUserName] = useState<string>('Commuter');
  const [userId, setUserId] = useState<string>('eG-12345');
  // Replace hardcoded phone with dynamic local storage fetch in useEffect
  const [profilePhone, setProfilePhone] = useState('');
  
  useEffect(() => {
    const p = localStorage.getItem('profileData');
    if (p) {
      try {
        const parsed = JSON.parse(p);
        if (parsed.phone) setProfilePhone(parsed.phone);
        if (parsed.name) setUserName(parsed.name);
      } catch (e) {}
    }
    
    // Check for tab query parameter
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('tab') === 'topup') {
      setActiveTab('TOPUP');
    }
  }, []);  
  const [mode, setMode] = useState<TransitMode>('MRT-3');
  const [originIndex, setOriginIndex] = useState<number | ''>('');
  const [destIndex, setDestIndex] = useState<number | ''>(''); 
  const [distanceKm, setDistanceKm] = useState<number>(5);
  
  const [simulatingScan, setSimulatingScan] = useState(false);

  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(500.00);
  const [originUrl, setOriginUrl] = useState('');
  
  const [beepCard, setBeepCard] = useState<BeepCard | null>(null);
  const [beepInput, setBeepInput] = useState('');

  useEffect(() => {
    setOriginUrl(window.location.origin);
    const saved = localStorage.getItem('egov_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setUserName(user.givenName || user.firstName || 'Commuter');
        setUserId(user.id || 'eG-12345');
      } catch (e) {
        console.error("Error parsing egov user", e);
      }
    }

    const savedProfile = localStorage.getItem('profileData');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setUserName(parsed.name);
      } catch(e) {}
    }

    const savedBalance = localStorage.getItem('mock_balance');
    if (savedBalance) {
      setBalance(Number(savedBalance));
    }
    
    const savedBeep = localStorage.getItem('linked_beep_card');
    if (savedBeep) {
      try {
        setBeepCard(JSON.parse(savedBeep));
      } catch(e) {}
    }
  }, []);

  // Poll the backend to see if a physical phone scanned the QR Code
  useEffect(() => {
    if (activeTab !== 'TICKET' || !userId) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/everify/shared?action=status&uid=${userId}`);
        const data = await res.json();
        
        if (data.scanned && data.url && data.payload) {
          clearInterval(interval);
          setSimulatingScan(true);

          // Log the transaction
          const txsStr = localStorage.getItem('mock_transactions');
          const txs = txsStr ? JSON.parse(txsStr) : [];
          
          const fareAmount = Number(data.payload.fare);
          
          txs.unshift({
             id: Date.now().toString(),
             type: `${data.payload.line} Fare`,
             desc: data.payload.origin && data.payload.dest ? `${data.payload.origin} to ${data.payload.dest}` : `${data.payload.line} Ride`,
             amount: fareAmount,
             date: new Date().toISOString(),
             isAddition: false
          });
          localStorage.setItem('mock_transactions', JSON.stringify(txs));
          localStorage.setItem('has_new_transaction', 'true');

          // Deduct from Wallet Balance
          const currentBalance = Number(localStorage.getItem('mock_balance')) || 500.00;
          const newBalance = currentBalance - fareAmount;
          localStorage.setItem('mock_balance', newBalance.toFixed(2));

          // Calculate and Award EG Points (Boosted for demo)
          let earnedPoints = Math.max(15, Math.floor(fareAmount / 2)); // At least 15 pts
          const today = new Date().toDateString();
          const lastRideDate = localStorage.getItem('last_ride_date');
          let ridesToday = Number(localStorage.getItem('rides_today')) || 0;
          
          if (lastRideDate === today) {
            ridesToday += 1;
            earnedPoints += (ridesToday * 10); // Escalating bonus for multiple rides
          } else {
            ridesToday = 1;
            localStorage.setItem('last_ride_date', today);
          }
          localStorage.setItem('rides_today', ridesToday.toString());
          
          const currentPoints = Number(localStorage.getItem('mock_eg_points')) || 120;
          const newPoints = Math.min(500, currentPoints + earnedPoints);
          localStorage.setItem('mock_eg_points', newPoints.toString());
          window.dispatchEvent(new Event('eg-points-updated'));

          window.location.href = data.url;
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab, userId]);

  const isRail = ['MRT-3', 'LRT-2', 'LRT-1', 'PNR'].includes(mode);
  
  let stations: string[] = [];
  let matrix: number[][] = [];
  if (mode === 'MRT-3') { stations = mrt3Stations; matrix = mrt3Matrix; }
  if (mode === 'LRT-2') { stations = lrta2Stations; matrix = lrta2Matrix; }
  if (mode === 'LRT-1') { stations = lrt1Stations; matrix = lrt1Matrix; }
  if (mode === 'PNR') { stations = pnrStations; matrix = pnrMatrix; }

  const getFareData = () => {
    let baseFare = 0;
    if (isRail) {
      if (originIndex !== '' && destIndex !== '' && originIndex !== destIndex && matrix[originIndex]) {
        baseFare = matrix[originIndex][destIndex] || 0;
      }
    } else {
      baseFare = calculateRoadFare(mode, distanceKm);
    }
    return calculateFareDetails(baseFare, passengerType);
  };
  
  const fareData = getFareData();

  const handleTopup = async (isBeep: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/epay/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to generate link');
      
      // Store pending amount so callback page knows what to add to balance
      localStorage.setItem('pending_topup', amount);
      if (isBeep) {
        localStorage.setItem('pending_beep_reload', 'true');
      }
      
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const linkBeepCard = () => {
    if (beepInput.length < 16) {
      setError("Please enter a valid 16-digit Beep card number");
      return;
    }
    const card: BeepCard = {
      cardNumber: beepInput,
      linkedDate: new Date().toISOString()
    };
    setBeepCard(card);
    localStorage.setItem('linked_beep_card', JSON.stringify(card));
    setBeepInput('');
    setError(null);
  };
  
  const unlinkBeepCard = () => {
    setBeepCard(null);
    localStorage.removeItem('linked_beep_card');
  };

  const simulateTurnstileScan = async () => {
    if (isRail && (originIndex === '' || destIndex === '' || originIndex === destIndex)) return;
    setSimulatingScan(true);
    setError(null);

    const origin = isRail ? stations[originIndex as number] : `${distanceKm} km`;
    const dest = isRail ? stations[destIndex as number] : 'Destination';
    const fare = fareData.finalFare.toFixed(2);

    const ticketMessage = `eGuide e-Ticket: \nName: ${userName}\nMode: ${mode}\nFrom: ${origin}\nTo: ${dest}\nFare: P${fare} (${passengerType})\nThank you for using eGovPay!`;

    try {
      // Send SMS Receipt
      // Only send if the user provided a phone number in their profile
      const phones = profilePhone ? [profilePhone] : [];
      await Promise.all(phones.map(p => 
        fetch('/api/emessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: p, message: ticketMessage })
        }).catch(err => console.error("SMS Error:", err))
      ));

      // Generate eGovPay link
      const res = await fetch('/api/epay/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(fare) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to generate payment link');

      // Push Notification to mock_notifications
      const newNotif = { message: `e-Ticket: ${mode} fare (₱${fare}) deducted.`, timestamp: Date.now() };
      const savedNotifs = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
      localStorage.setItem('mock_notifications', JSON.stringify([newNotif, ...savedNotifs]));
      localStorage.setItem('has_new_notification', 'true');

      // Log the transaction
      const txsStr = localStorage.getItem('mock_transactions');
      const txs = txsStr ? JSON.parse(txsStr) : [];
      txs.unshift({
         id: Date.now().toString(),
         type: `${mode} Fare`,
         desc: `${origin} to ${dest}`,
         amount: Number(fare),
         date: new Date().toISOString(),
         isAddition: false
      });
      localStorage.setItem('mock_transactions', JSON.stringify(txs));
      localStorage.setItem('has_new_transaction', 'true');

      // Deduct Balance instantly in UI and local storage
      const currentBalance = balance;
      const newBalance = currentBalance - Number(fare);
      localStorage.setItem('mock_balance', newBalance.toFixed(2));
      setBalance(newBalance);
      
      // Redirect to eGovPay receipt/gateway
      setTimeout(() => {
        setSimulatingScan(false);
        window.location.href = data.url;
      }, 500);

    } catch (err: any) {
      setError(err.message);
      setSimulatingScan(false);
    }
  };

  const baseJsonData = {
    uid: userId,
    type: passengerType,
    line: mode,
    origin: isRail ? (originIndex !== '' ? stations[originIndex as number] : '') : `${distanceKm} km`,
    dest: isRail ? (destIndex !== '' ? stations[destIndex as number] : '') : 'Destination',
    fare: fareData.finalFare.toFixed(2)
  };
  const qrData = `${originUrl || 'http://localhost:3000'}/api/everify/shared?action=scan&data=${encodeURIComponent(JSON.stringify(baseJsonData))}`;

  return (
    <div>
      <h2 className="title" style={{ fontSize: '16px', margin: '0 0 8px 0' }}>Ride & Pay</h2>
      
      <div className="glass-card text-center mb-2" style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <span className="text-xs text-muted">Available Balance:</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success)' }}>
            ₱{balance.toFixed(2)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: 'var(--bg-color)', padding: '4px', borderRadius: '8px' }}>
        <button 
          onClick={() => setActiveTab('TICKET')}
          style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px', border: 'none', background: activeTab === 'TICKET' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'TICKET' ? 'white' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          🎫 Ticket
        </button>
        <button 
          onClick={() => setActiveTab('TOPUP')}
          style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px', border: 'none', background: activeTab === 'TOPUP' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'TOPUP' ? 'white' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          💳 Top Up
        </button>
      </div>

      {activeTab === 'TICKET' && (
        <div className="glass-card fade-in" style={{ padding: '16px' }}>
          
          <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 'bold' }}>
              Dynamic Ticket ({mode})
            </div>
            
            {isRail && (originIndex === '' || destIndex === '') ? (
               <div style={{ padding: '32px 0', color: 'var(--text-secondary)' }}>
                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚉</div>
                 <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Select Stations</div>
                 <div style={{ fontSize: '12px', marginTop: '8px' }}>Please select your origin and destination.</div>
               </div>
            ) : isRail && originIndex === destIndex ? (
               <div style={{ padding: '32px 0', color: '#ef4444' }}>
                 <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                 <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Invalid Route</div>
                 <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-secondary)' }}>Origin and Destination cannot be the same.</div>
               </div>
            ) : (
              <>
                <div 
                  onClick={simulateTurnstileScan}
                  style={{ 
                    background: 'white', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    display: 'inline-block', 
                    marginBottom: '16px',
                    cursor: 'pointer',
                    opacity: simulatingScan ? 0.5 : 1,
                    transform: simulatingScan ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                  }}
                >
                  <QRCode value={qrData} size={150} level="H" />
                </div>

                {simulatingScan ? (
                  <div style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Scanning at Turnstile...
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                      <path d="M13 13l6 6"></path>
                    </svg>
                    Tap QR Code to simulate gate scan
                  </div>
                )}

                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  ₱{fareData.finalFare.toFixed(2)}
                </div>
                
                {fareData.savings > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Base: ₱{fareData.baseFare.toFixed(2)} 
                    {fareData.statutoryDiscount > 0 && ` - 20% Stat`}
                    {fareData.appDiscount > 0 && ` - ${(APP_DISCOUNT_RATE * 100).toFixed(0)}% App`}
                  </div>
                )}
                {fareData.savings > 0 && (
                  <div style={{ color: 'var(--success)', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
                    Total Savings: ₱{fareData.savings.toFixed(2)}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>Transit Mode</h3>
            <select 
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as TransitMode);
                setOriginIndex('');
                setDestIndex('');
              }}
              style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}
            >
              <optgroup label="Trains">
                <option value="MRT-3">MRT-3 (50% Off)</option>
                <option value="LRT-2">LRTA-2 (50% Off)</option>
                <option value="LRT-1">LRTA-1 (50% Off)</option>
                <option value="PNR">PNR (Estimated)</option>
              </optgroup>
              <optgroup label="Road Transport">
                <option value="BUS_ORDINARY">City Bus (Ordinary)</option>
                <option value="BUS_AIRCON">City Bus (Aircon)</option>
                <option value="MODERN_JEEP">Modern Jeepney</option>
                <option value="TRAD_JEEP">Trad. Jeepney</option>
                <option value="UV_EXPRESS">UV Express</option>
                <option value="P2P_BUS">P2P Bus</option>
              </optgroup>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
             <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Passenger Profile</h4>
             <select 
                value={passengerType}
                onChange={(e) => setPassengerType(e.target.value as PassengerType)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="REGULAR">Regular Passenger</option>
                <option value="STUDENT">Student (20% Off)</option>
                <option value="SENIOR">Senior Citizen (20% Off)</option>
                <option value="PWD">PWD (20% Off)</option>
              </select>
          </div>

          {isRail ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                 <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Leaving From</h4>
                 <select 
                    value={originIndex}
                    onChange={(e) => setOriginIndex(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    <option value="" disabled>Select</option>
                    {stations.map((st, i) => (
                      <option key={i} value={i}>{st}</option>
                    ))}
                  </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                 <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Going To</h4>
                 <select 
                    value={destIndex}
                    onChange={(e) => setDestIndex(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    <option value="" disabled>Select</option>
                    {stations.map((st, i) => (
                      <option key={i} value={i}>{st}</option>
                    ))}
                  </select>
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '32px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                 <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>Distance (km)</h4>
                 <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{distanceKm} km</span>
               </div>
               <input 
                  type="range"
                  min="1"
                  max="50"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                {mode === 'UV_EXPRESS' || mode === 'P2P_BUS' ? (
                  <p style={{ fontSize: '11px', color: 'var(--warning, #f59e0b)', marginTop: '8px' }}>
                    * Fares for {mode} are estimated and may vary depending on exact route and provider.
                  </p>
                ) : null}
            </div>
          )}
          
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            Disclaimer: Fares are subjected to change aligning to the transportation companies.
          </div>

          {error && <div style={{ color: '#ef4444', marginTop: '16px', fontSize: '14px', textAlign: 'center' }}>⚠️ {error}</div>}
        </div>
      )}

      {activeTab === 'TOPUP' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Beep Card Section */}
          <div className="glass-card fade-in" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Manage Beep Card</h3>
            
            {beepCard ? (
              <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)', borderRadius: '12px', padding: '16px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', fontStyle: 'italic' }}>beep</div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <div style={{ fontSize: '18px', letterSpacing: '2px', marginBottom: '12px', fontFamily: 'monospace' }}>
                  {beepCard.cardNumber.slice(0, 4)} **** **** {beepCard.cardNumber.slice(-4)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px' }}>
                  <div>Linked: {new Date(beepCard.linkedDate).toLocaleDateString()}</div>
                  <button onClick={unlinkBeepCard} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Unlink</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Link your Beep card to reload remotely via eGovPay. (Limit 1 per account).
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="16-digit Beep Card #" 
                    value={beepInput}
                    onChange={(e) => setBeepInput(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  />
                  <button onClick={linkBeepCard} className="btn-primary" style={{ padding: '0 16px', borderRadius: '8px', fontSize: '14px' }}>
                    Link
                  </button>
                </div>
              </div>
            )}
            
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '16px' }}>
              Disclaimer: Remote reloading powered by eGovPay. Physical tap required at station for fare deduction.
            </div>
          </div>

          <div className="glass-card fade-in" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Add Funds via eGovPay</h3>
            
            {error && (
              <div style={{ background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Amount (PHP)
              </label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '24px', textAlign: 'center' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[100, 200, 500, 1000].map(val => (
                <button 
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  style={{ flex: 1, padding: '10px 0', background: amount === val.toString() ? 'var(--border-color)' : 'var(--bg-color)', border: `1px solid ${amount === val.toString() ? 'var(--primary-color)' : 'var(--border-color)'}`, color: amount === val.toString() ? 'var(--primary-color)' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ₱{val}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                className="btn-primary w-full" 
                onClick={() => handleTopup(false)}
                disabled={loading || !amount || Number(amount) <= 0}
                style={{ padding: '16px', fontSize: '16px', fontWeight: 'bold' }}
              >
                {loading ? 'Processing...' : 'Pay via eGovPay'}
              </button>
              
              {beepCard && (
                <button 
                  className="btn-secondary w-full" 
                  onClick={() => handleTopup(true)}
                  disabled={loading || !amount || Number(amount) <= 0}
                  style={{ padding: '14px', fontSize: '14px', fontWeight: 'bold', background: 'var(--bg-color)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}
                >
                  {loading ? 'Processing...' : 'Reload Beep Card'}
                </button>
              )}

              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', position: 'relative', margin: '4px 0' }}>
                <span style={{ background: 'var(--card-bg)', padding: '0 8px', position: 'relative', zIndex: 1 }}>Or top up using</span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-color)', zIndex: 0 }}></div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                {[
                  { id: 'gcash', color: '#007DFE', icon: '/icons/gcash.png', scale: 1.4 },
                  { id: 'maya', color: '#000000', icon: '/icons/maya.png' },
                  { id: 'gotyme', color: '#00FFFF', icon: '/icons/gotyme.jpg', scale: 1.6 },
                  { id: 'visa', color: '#FFC107', icon: '/icons/visa.svg' }
                ].map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => handleTopup(false)}
                    disabled={loading || !amount || Number(amount) <= 0}
                    style={{ 
                      flex: 1, 
                      aspectRatio: '1.2', 
                      backgroundColor: provider.color, 
                      borderRadius: '12px', 
                      border: 'none', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      cursor: (loading || !amount || Number(amount) <= 0) ? 'not-allowed' : 'pointer',
                      opacity: (loading || !amount || Number(amount) <= 0) ? 0.5 : 1,
                      padding: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    <img src={provider.icon} alt={provider.id} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: provider.scale ? `scale(${provider.scale})` : 'none' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
