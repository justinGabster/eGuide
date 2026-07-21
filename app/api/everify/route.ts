import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, middle_name, suffix, birth_date, face_liveness_session_id } = body;

    if (!face_liveness_session_id) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    const clientId = process.env.EGOV_EVERIFY_CLIENT_ID;
    const clientSecret = process.env.EGOV_EVERIFY_CLIENT_SECRET;
    const baseUrl = process.env.EGOV_EVERIFY_BASE_URL || 'https://hackathon-everify.e.gov.ph'; // Defaulting to likely sandbox URL

    if (!clientId || !clientSecret) {
      // Mock mode fallback for smooth hackathon demos if keys aren't set
      console.warn("eVerify API keys not found in .env.local, falling back to mock success.");
      return NextResponse.json({ status: 200, message: "Mock verification successful", verified: true });
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

    // Step 2: Submit demographics and session ID to verify endpoint
    const verifyRes = await fetch(`${baseUrl}/api/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        first_name,
        middle_name,
        last_name,
        suffix: suffix || null,
        birth_date,
        face_liveness_session_id
      })
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      return NextResponse.json(verifyData, { status: verifyRes.status });
    }

    return NextResponse.json(verifyData);
  } catch (error) {
    console.error("eVerify Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
