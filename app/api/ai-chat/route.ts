import { NextResponse } from 'next/server';
import { getAiAccessToken } from '@/lib/egovAi';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const token = await getAiAccessToken();
    const baseUrl = process.env.EGOV_AI_BASE_URL || 'https://egov-ai-core-ws.oueg.info';

    if (token === "mock_ai_token") {
      // Return a simulated delay and mock response if no real token is available
      await new Promise(r => setTimeout(r, 1000));
      return NextResponse.json({ 
        data: `This is a mock AI response to: "${prompt}". Please add your real EGOV_AI_ACCESS_CODE to .env.local to chat with the real eGov AI Assistant.` 
      }, { status: 200 });
    }

    const res = await fetch(`${baseUrl}/api/v1/egov/integration/ai_assistant/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: prompt,
        category: "PH" // Hardcoded to PH as requested by eGov docs
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("AI Chat Proxy Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message || error.toString() 
    }, { status: 500 });
  }
}
