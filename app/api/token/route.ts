import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.exchange_code) {
      return NextResponse.json({ error: "Missing exchange_code" }, { status: 400 });
    }

    // We use environment variables so your secret doesn't get pushed to GitHub!
    const partnerCode = process.env.EGOV_PARTNER_CODE || 'TEST_AGENCY';
    const partnerSecret = process.env.EGOV_PARTNER_SECRET || 'value';

    const baseUrl = process.env.EGOV_SSO_BASE_URL || 'https://hackathon-sso.e.gov.ph';
    const egovRes = await fetch(`${baseUrl}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exchange_code: body.exchange_code,
        scope: 'SSO_AUTHENTICATION',
        partner_code: partnerCode,
        partner_secret: partnerSecret
      })
    });

    const data = await egovRes.json();

    if (!egovRes.ok) {
      return NextResponse.json(data, { status: egovRes.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
