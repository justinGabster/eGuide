import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { value, face_liveness_session_id } = body;

    if (!value) {
      return NextResponse.json({ error: "Missing QR value" }, { status: 400 });
    }
    
    if (!face_liveness_session_id) {
      return NextResponse.json({ error: "Missing face_liveness_session_id" }, { status: 400 });
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

    // Step 2: Submit QR code and face session to Verify endpoint
    const verifyRes = await fetch(`${baseUrl}/api/query/qr`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ 
        value,
        face_liveness_session_id 
      })
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      return NextResponse.json(verifyData, { status: verifyRes.status });
    }

    return NextResponse.json(verifyData);
  } catch (error: any) {
    console.error("QR Verify Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
