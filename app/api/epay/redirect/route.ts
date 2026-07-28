import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const url = new URL(req.url);
  // Using 303 forces the browser to issue a GET request to the redirect target.
  // This prevents Next.js 405 Method Not Allowed errors when payment gateways POST to pages.
  return NextResponse.redirect(`${url.origin}/payment/callback`, 303);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(`${url.origin}/payment/callback`, 302);
}
