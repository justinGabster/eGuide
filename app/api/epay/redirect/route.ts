import { NextResponse } from 'next/server';

function getRedirectUrl(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  let protocol = req.headers.get('x-forwarded-proto') || url.protocol;
  if (!protocol.endsWith(':')) {
    protocol += ':';
  }
  return `${protocol}//${host}/payment/callback`;
}

export async function POST(req: Request) {
  // Using 303 forces the browser to issue a GET request to the redirect target.
  // This prevents Next.js 405 Method Not Allowed errors when payment gateways POST to pages.
  return NextResponse.redirect(getRedirectUrl(req), 303);
}

export async function GET(req: Request) {
  return NextResponse.redirect(getRedirectUrl(req), 302);
}
