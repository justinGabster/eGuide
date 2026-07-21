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
    return NextResponse.redirect(paymentData.url);
  } catch (error: any) {
    console.error("QR Scan Handler Error:", error);
    return NextResponse.json({ error: "Failed to process QR scan", details: error.message }, { status: 500 });
  }
}
