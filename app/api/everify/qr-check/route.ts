import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { value } = body;

    if (!value) {
      return NextResponse.json({ error: "Missing QR value" }, { status: 400 });
    }

    const clientId = process.env.EGOV_EVERIFY_CLIENT_ID;
    const clientSecret = process.env.EGOV_EVERIFY_CLIENT_SECRET;
    const baseUrl = process.env.EGOV_EVERIFY_BASE_URL || 'https://hackathon-everify-api.e.gov.ph';

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "eVerify credentials missing" }, { status: 500 });
    }

    // Step 1: Obtain Server-to-Server Access Token
    const authRes = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const authData = await authRes.json();
    
    if (!authRes.ok || !authData.data?.access_token) {
      return NextResponse.json({ error: "Server authentication failed", details: authData }, { status: 401 });
    }

    const accessToken = authData.data.access_token;

    // Step 2: Submit QR code to check endpoint
    const checkRes = await fetch(`${baseUrl}/api/query/qr/check`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ value })
    });

    const checkData = await checkRes.json();

    if (!checkRes.ok) {
      return NextResponse.json(checkData, { status: checkRes.status });
    }

    return NextResponse.json(checkData);
  } catch (error: any) {
    console.error("QR Check Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
