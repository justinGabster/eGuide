import { NextResponse } from 'next/server';
import { sendTransitAlert } from '@/lib/emessage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { number, message } = body;

    if (!number || !message) {
      return NextResponse.json({ error: "Missing number or message" }, { status: 400 });
    }

    const data = await sendTransitAlert(number, message);
    return NextResponse.json(data, { status: 201 });
    
  } catch (error: any) {
    console.error("eMessage Proxy Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
