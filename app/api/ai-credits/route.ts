import { NextResponse } from 'next/server';
import { getAiAccessToken } from '@/lib/egovAi';

export async function GET() {
  try {
    const token = await getAiAccessToken();
    const baseUrl = process.env.EGOV_AI_BASE_URL || 'https://egov-ai-core-ws.oueg.info';

    if (token === "mock_ai_token") {
      return NextResponse.json({ 
        credits_total: 200,
        credits_used: 0,
        credits_remaining: 200,
        expires_at: new Date().toISOString()
      }, { status: 200 });
    }

    const res = await fetch(`${baseUrl}/api/v1/egov/integration/credits`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("AI Credits Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
