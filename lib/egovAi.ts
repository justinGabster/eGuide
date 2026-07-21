/**
 * eGov AI Utility
 * 
 * Handles authentication and communication with the eGov AI API endpoints.
 */

const getAiBaseUrl = () => process.env.EGOV_AI_BASE_URL || 'https://egov-ai-core-ws.oueg.info';

/**
 * Generates a short-lived access token for authenticating with the eGov AI API.
 */
export async function getAiAccessToken(): Promise<string> {
  const accessCode = process.env.EGOV_AI_ACCESS_CODE;
  
  if (!accessCode || accessCode.includes('your_ai_access_code_here')) {
    console.warn("eGov AI access code not found in environment variables. Returning mock token.");
    return "mock_ai_token";
  }

  const res = await fetch(`${getAiBaseUrl()}/api/v1/egov/integration/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: accessCode })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to generate AI access token');
  }

  return data.access_token;
}

/**
 * Generates a dynamic transit alert message using the AI Assistant endpoint.
 */
export async function generateDynamicAlert(
  vehicleType: string, 
  distanceStr: string, 
  speedStr: string
): Promise<string> {
  const token = await getAiAccessToken();
  
  if (token === "mock_ai_token") {
    return `Heads up! Your ${vehicleType} is moving at ${speedStr} and is just ${distanceStr} away. See you at the stop! (Mock AI)`;
  }

  const prompt = `You are a friendly, helpful transit app assistant for eGuide in the Philippines. Write a short, friendly 1 or 2 sentence SMS alert for a commuter. The ${vehicleType} is currently ${distanceStr} away and traveling at ${speedStr}. Do not include greetings or sign-offs, just the alert. Keep it under 140 characters.`;

  const res = await fetch(`${getAiBaseUrl()}/api/v1/egov/integration/ai_assistant/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt: prompt,
      category: "PH"
    })
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("AI Generation Error:", data);
    throw new Error(data.message || data.error || 'Failed to generate AI message');
  }

  // The AI endpoint returns the generated text in the 'data' field
  return data.data;
}
