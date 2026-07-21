import { NextResponse } from 'next/server';
import { sendDynamicTransitAlert } from '@/lib/emessage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { number, vehicleType, distanceStr, speedStr } = body;

    if (!number || !vehicleType || !distanceStr || !speedStr) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data = await sendDynamicTransitAlert(number, vehicleType, distanceStr, speedStr);
    
    return NextResponse.json(data, { status: 201 });
    
  } catch (error: any) {
    console.error("Dynamic eMessage Proxy Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
