import { NextResponse } from 'next/server';
import { scanStore } from '../store';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');
  
  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  if (scanStore[uid]) {
    const { url, payload } = scanStore[uid];
    delete scanStore[uid]; // Clear it after reading once
    return NextResponse.json({ scanned: true, url, payload });
  }

  return NextResponse.json({ scanned: false });
}
