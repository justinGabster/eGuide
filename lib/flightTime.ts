const timeCache = new Map<string, any>();

export async function getFlightTime(icao24: string) {
  if (!icao24) return null;
  const cleanIcao = icao24.trim().toLowerCase();
  
  if (timeCache.has(cleanIcao)) {
    return timeCache.get(cleanIcao);
  }
  
  try {
    const res = await fetch(`/api/flights/time?icao24=${cleanIcao}`);
    if (!res.ok) {
      timeCache.set(cleanIcao, null);
      return null;
    }
    const data = await res.json();
    if (data && data.flight) {
      timeCache.set(cleanIcao, data.flight);
      return data.flight;
    }
    timeCache.set(cleanIcao, null);
    return null;
  } catch (e) {
    console.error("Flight time lookup failed", e);
    return null;
  }
}
