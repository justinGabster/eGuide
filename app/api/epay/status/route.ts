import { NextResponse } from 'next/server';
import { checkTransactionStatus } from '@/lib/epay';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json({ error: "Transaction UUID is required" }, { status: 400 });
    }

    const statusData = await checkTransactionStatus(uuid);

    return NextResponse.json(statusData, { status: 200 });
  } catch (error: any) {
    console.error("ePay Status Proxy Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch payment status", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
