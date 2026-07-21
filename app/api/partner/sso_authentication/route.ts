import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.EGOV_SSO_BASE_URL || 'https://hackathon-sso.e.gov.ph';
    const egovRes = await fetch(`${baseUrl}/api/partner/sso_authentication`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
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
