import { NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/epay';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data = url.searchParams.get('data');
    if (!data) return NextResponse.json({ error: "Missing data payload" }, { status: 400 });

    const parsedData = JSON.parse(decodeURIComponent(data));
    const fare = Number(parsedData.fare);

    if (isNaN(fare) || fare <= 0) {
      return NextResponse.json({ error: "Invalid fare amount" }, { status: 400 });
    }

    // 1. Generate the eGovPay Payment Link
    const paymentData = await createPaymentLink(fare);

    const baseUrl = `${url.protocol}//${url.host}`;
    const ticketMessage = `eGuide e-Ticket: \nName: Commuter\nLine: ${parsedData.line}\nFrom: ${parsedData.origin}\nTo: ${parsedData.dest}\nFare: P${parsedData.fare} (${parsedData.type})\nThank you for using eGovPay!`;

    const phones = ['09567669852', '09325298802'];
    
    // Fire and forget the SMS requests so it doesn't block the redirect
    phones.forEach(p => {
      fetch(`${baseUrl}/api/emessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: p, message: ticketMessage })
      }).catch(err => console.error("Failed to send SMS in QR scan trigger", err));
    });

    // 3. Redirect the user's mobile browser directly to the eGovPay receipt!
    // We use a raw HTML meta refresh because some mobile QR scanners drop 307 cross-origin redirects
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${paymentData.url}">
          <title>Redirecting to eGovPay...</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white; margin: 0; }
            .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 16px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .container { text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loader" style="margin: 0 auto 16px;"></div>
            <h2>Processing Gate Scan...</h2>
            <p style="color: #94a3b8">Redirecting to eGovPay</p>
          </div>
          <script>
            window.location.href = "${paymentData.url}";
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    console.error("QR Scan Handler Error:", error);
    return NextResponse.json({ error: "Failed to process QR scan", details: error.message }, { status: 500 });
  }
}
