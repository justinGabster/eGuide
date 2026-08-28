import { NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/epay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const origin = request.headers.get('origin');
    
    let appUrl = origin || `${protocol}://${host}`;
    if (appUrl.includes('localhost') && process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    }

    const paymentData = await createPaymentLink(Number(amount), "eGuide Wallet Top-up", appUrl);

    return NextResponse.json(paymentData, { status: 200 });
  } catch (error: any) {
    console.error("ePay Generation Proxy Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate payment link", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
