// lib/opensky.ts

// Global cache for the token to survive Next.js hot reloads
declare global {
  var openskyTokenCache: {
    token: string;
    expiresAt: number;
  } | undefined;
}

export async function getOpenSkyToken(): Promise<string> {
  const now = Date.now();
  // Buffer of 60 seconds
  if (globalThis.openskyTokenCache && globalThis.openskyTokenCache.expiresAt > now + 60000) {
    return globalThis.openskyTokenCache.token;
  }

  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing OPENSKY_CLIENT_ID or OPENSKY_CLIENT_SECRET environment variables');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString(),
    // ensure we don't aggressively cache the token endpoint response via Next fetch cache
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch OpenSky token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 1800; // usually in seconds

  globalThis.openskyTokenCache = {
    token: data.access_token,
    expiresAt: now + (expiresIn * 1000)
  };

  return data.access_token;
}
