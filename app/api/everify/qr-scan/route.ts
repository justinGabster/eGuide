import { NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/epay';
import { scanStore } from '../store';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data = url.searchParams.get('data');
    if (!data) return NextResponse.json({ error: "Missing data payload" }, { status: 400 });

    const parsedData = JSON.parse(decodeURIComponent(data));
    const fare = Number(parsedData.fare);
    const uid = parsedData.uid;

    if (isNaN(fare) || fare <= 0 || !uid) {
      return NextResponse.json({ error: "Invalid payload data" }, { status: 400 });
    }

    // 1. Generate the eGovPay Payment Link
    const paymentData = await createPaymentLink(fare);

    const baseUrl = `${url.protocol}//${url.host}`;
    const ticketMessage = `eGuide e-Ticket: \nName: Commuter\nLine: ${parsedData.line}\nFrom: ${parsedData.origin}\nTo: ${parsedData.dest}\nFare: P${parsedData.fare} (${parsedData.type})\nThank you for using eGovPay!`;

    const phones = ['09567669852', '09325298802'];
    
    // Fire and forget the SMS requests
    phones.forEach(p => {
      fetch(`${baseUrl}/api/emessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: p, message: ticketMessage })
      }).catch(err => console.error("Failed to send SMS in QR scan trigger", err));
    });

    // 2. Store the payment URL and payload in the global store so the desktop can read it
    scanStore[uid] = { url: paymentData.url, payload: parsedData };

    // 3. Show success to the phone!
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Gate Scan Success</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white; margin: 0; text-align: center; padding: 20px; }
            .icon { font-size: 64px; color: #22c55e; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <div>
            <div class="icon">✅</div>
            <h2>Scan Successful!</h2>
            <p style="color: #94a3b8">The e-Ticket has been sent to your phone via SMS.</p>
            <p style="color: #94a3b8">Please look at the turnstile screen to complete your payment.</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    console.error("QR Scan Handler Error:", error);
    return NextResponse.json({ error: "Failed to process QR scan", details: error.message }, { status: 500 });
  }
}
