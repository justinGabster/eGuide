const routeCache = new Map<string, any>();

export async function getFlightRoute(callsign: string) {
  if (!callsign) return null;
  const cleanCallsign = callsign.trim().toUpperCase();
  
  if (routeCache.has(cleanCallsign)) {
    return routeCache.get(cleanCallsign);
  }
  
  try {
    const res = await fetch(`https://api.adsbdb.com/v0/callsign/${cleanCallsign}`);
    if (!res.ok) {
      routeCache.set(cleanCallsign, null);
      return null;
    }
    const data = await res.json();
    const route = data?.response?.flightroute;
    if (route) {
      const result = {
        airline: route.airline?.name,
        origin: route.origin ? {
          name: route.origin.municipality || route.origin.name,
          iata: route.origin.iata_code,
          lat: route.origin.latitude,
          lng: route.origin.longitude
        } : null,
        destination: route.destination ? {
          name: route.destination.municipality || route.destination.name,
          iata: route.destination.iata_code,
          lat: route.destination.latitude,
          lng: route.destination.longitude
        } : null
      };
      routeCache.set(cleanCallsign, result);
      return result;
    }
    routeCache.set(cleanCallsign, null);
    return null;
  } catch (e) {
    console.error("Adsbdb lookup failed", e);
    return null;
  }
}
