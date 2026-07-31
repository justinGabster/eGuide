import { NextResponse } from 'next/server';
import { getOpenSkyToken } from '@/lib/opensky';

export async function GET() {
  try {
    console.log('[OPENSKY] Initiating token fetch...');
    const token = await getOpenSkyToken();
    console.log('[OPENSKY] Token fetched successfully. Length:', token?.length);

    // Bounding box for Philippines
    const lamin = 4.5;
    const lomin = 116;
    const lamax = 21;
    const lomax = 127;
    
    const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    console.log('[OPENSKY] Fetching states from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    console.log('[OPENSKY] Raw HTTP Response Status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[OPENSKY] Raw HTTP Error Response:', errText);
      return NextResponse.json({ error: 'Failed to fetch flights from OpenSky', details: errText }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.states) {
      console.log('[OPENSKY] No states returned. Data object:', JSON.stringify(data).substring(0, 200));
    }
    
    const flights = (data.states || []).map((state: any[]) => ({
      icao24: state[0],
      callsign: state[1]?.trim() || 'Unknown',
      origin_country: state[2],
      longitude: state[5],
      latitude: state[6],
      altitude: state[7] != null ? state[7] : state[13],
      velocity: state[9],
      true_track: state[10],
      on_ground: state[8]
    })).filter((f: any) => f.latitude != null && f.longitude != null && !f.on_ground);

    console.log(`[OPENSKY] Successfully parsed ${flights.length} flights.`);
    return NextResponse.json({ flights });
  } catch (error: any) {
    console.error('[OPENSKY] Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
