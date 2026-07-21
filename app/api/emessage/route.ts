import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { number, message } = body;

    if (!number || !message) {
      return NextResponse.json({ error: "Missing number or message" }, { status: 400 });
    }

    const apiToken = process.env.EGOV_EMESSAGE_API_TOKEN;
    const baseUrl = process.env.EGOV_EMESSAGE_BASE_URL || 'https://hackathon-emessage-api.e.gov.ph';

    if (!apiToken || apiToken === 'your_emessage_api_token_here') {
      console.warn("eMessage API token not found, falling back to mock success.");
      return NextResponse.json({ 
        data: { message: "Mock SMS was successfully created (No API token found)." } 
      }, { status: 201 });
    }

    const res = await fetch(`${baseUrl}/messaging/v1/sms/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-EMESSAGE-Auth': apiToken
      },
      body: JSON.stringify({ number, message })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("eMessage Proxy Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
