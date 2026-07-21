import { NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/epay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const paymentData = await createPaymentLink(Number(amount));

    return NextResponse.json(paymentData, { status: 200 });
  } catch (error: any) {
    console.error("ePay Generation Proxy Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate payment link", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
