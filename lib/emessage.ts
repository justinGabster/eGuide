/**
 * eMessage Framework Utility
 * 
 * Hi Kenneth! 
 * When your algorithm detects that a bus/train is arriving, you can trigger an SMS alert 
 * to the user by simply importing and calling this function.
 * 
 * EXAMPLE USAGE:
 * --------------
 * import { sendTransitAlert } from '@/lib/emessage';
 * 
 * // Inside your algorithm:
 * try {
 *   const result = await sendTransitAlert('+639123456789', 'eGuide Alert: Your bus is arriving in 5 minutes!');
 *   console.log('SMS sent successfully!', result);
 * } catch (error) {
 *   console.error('Failed to send SMS:', error);
 * }
 */

export async function sendTransitAlert(phoneNumber: string, message: string) {
  const apiToken = process.env.EGOV_EMESSAGE_API_TOKEN;
  const baseUrl = process.env.EGOV_EMESSAGE_BASE_URL || 'https://hackathon-emessage-api.e.gov.ph';

  if (!apiToken || apiToken === 'your_emessage_api_token_here') {
    console.warn("eMessage API token not found, returning mock success.");
    return { data: { message: "Mock SMS was successfully created (No API token found)." } };
  }

  const res = await fetch(`${baseUrl}/messaging/v1/sms/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-EMESSAGE-Auth': apiToken
    },
    body: JSON.stringify({ number: phoneNumber, message })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to send SMS via eGov API');
  }

  return data;
}
