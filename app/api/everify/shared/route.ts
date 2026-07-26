import { NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/epay';
import { sendTransitAlert } from '@/lib/emessage';

// Global store for the same serverless instance
// In Vercel, this will only share state if requests hit the same warm function instance.
const globalAny: any = global;
if (!globalAny.scanStore) {
  globalAny.scanStore = {};
}
const scanStore = globalAny.scanStore;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // --- STATUS POLLING ACTION ---
    if (action === 'status') {
      const uid = url.searchParams.get('uid');
      if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

      if (scanStore[uid]) {
        const { url: paymentUrl, payload } = scanStore[uid];
        delete scanStore[uid]; // Clear it after reading once
        return NextResponse.json({ scanned: true, url: paymentUrl, payload });
      }

      return NextResponse.json({ scanned: false });
    }

    // --- QR SCAN ACTION ---
    if (action === 'scan') {
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

      const ticketMessage = `eGuide e-Ticket: \nName: Denisse Jane Karim\nLine: ${parsedData.line}\nFrom: ${parsedData.origin}\nTo: ${parsedData.dest}\nFare: P${parsedData.fare} (${parsedData.type})\nThank you for using eGovPay!`;

      // 2. Send SMS receipt securely (awaiting it so Vercel doesn't kill it early!)
      const phones = ['09201057839', '09325298802'];
      
      await Promise.all(phones.map(p => 
        sendTransitAlert(p, ticketMessage).catch(err => console.error("SMS Failed", err))
      ));

      // 3. Store the payment URL and payload in the global store so the desktop can read it
      scanStore[uid] = { url: paymentData.url, payload: parsedData };

      // 4. Show success to the phone! (With a fallback button in case polling fails on Vercel)
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Gate Scan Success</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white; margin: 0; text-align: center; padding: 20px; }
              .icon { font-size: 64px; color: #22c55e; margin-bottom: 16px; }
              .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: #3b8df8; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
            </style>
          </head>
          <body>
            <div>
              <div class="icon">✅</div>
              <h2>Scan Successful!</h2>
              <p style="color: #94a3b8">The e-Ticket has been sent to your phone via SMS.</p>
              <p style="color: #94a3b8">Please look at the turnstile screen to complete your payment.</p>
              <a href="${paymentData.url}" class="btn">Complete Payment on Phone</a>
            </div>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Shared QR Handler Error:", error);
    return NextResponse.json({ error: "Failed to process request", details: error.message }, { status: 500 });
  }
}
