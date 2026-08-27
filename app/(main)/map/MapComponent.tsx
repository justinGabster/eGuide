'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFlightRoute } from '@/lib/adsbdb';
import { getFlightTime } from '@/lib/flightTime';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip, GeoJSON, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronUp, ChevronDown, MapPin, Circle, Map, Plane } from 'lucide-react';
import { transitLines } from './transitData';
import { philippineAirports } from './philippineAirports';
import { philippineSeaports } from './philippineSeaports';

const seaportIcon = L.divIcon({
  className: 'custom-seaport-icon',
  html: `<div style="background-color: #0d9488; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/></svg>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

const airportIcon = L.divIcon({
  className: 'custom-airport-icon',
  html: `<div style="background-color: #6366f1; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.3 2.6c-.2.4-.1.9.3 1.2L9 14l-4.5 4.5-2.7-.9c-.4-.1-.8.1-1 .5l-.5 1c-.1.3 0 .7.3.9l3.4 1.4 1.4 3.4c.2.3.6.4.9.3l1-.5c.4-.2.6-.6.5-1l-.9-2.7 4.5-4.5 3.3 6.3c.3.4.8.5 1.2.3l2.6-1.3c.5-.2.8-.6.7-1.1z"/></svg>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});
import { LINE_CONFIGS, isPeakHour } from './duration_matrix';
import { getLineRoundTripMs, getVehiclePosition, getTravelTimeMs } from './physicsEngine';

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size after a short delay to ensure the DOM flex layout has settled
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export interface VehicleState {
  id: string;
  lineId: string;
  num: number;
  coords: [number, number];
  statusText: string;
  boundFor: string;
  headingText: string;
  angle: number;
  logicalFraction: number;
  isForward: boolean;
  isDwelling: boolean;
  nextStationEtaMs: number;
  totalLegMs: number;
}


function AircraftPopupInfo({ plane }: { plane: any }) {
  const [route, setRoute] = useState<any>(undefined);
  const [flightTime, setFlightTime] = useState<any>(undefined);

  useEffect(() => {
    let mounted = true;
    getFlightRoute(plane.callsign).then(res => {
      if (mounted) setRoute(res);
    });
    getFlightTime(plane.icao24).then(res => {
      if (mounted) setFlightTime(res);
    });
    return () => { mounted = false; };
  }, [plane.callsign, plane.icao24]);

  const formatTime = (unix: number) => {
    if (!unix) return 'N/A';
    return new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getArrivalInfo = () => {
    if (plane.on_ground) return 'Arrived';

    // If no destination coords or velocity is 0, we can't calculate ETA
    if (!route || !route.destination || !route.destination.lat || !route.destination.lng || !plane.velocity) {
      if (flightTime !== undefined) {
        return flightTime ? formatTime(flightTime.lastSeen) : 'Time unavailable'; // fallback to last updated if ETA impossible
      }
      return 'Loading...';
    }

    // Haversine formula
    const R = 6371;
    const dLat = (route.destination.lat - plane.latitude) * Math.PI / 180;
    const dLon = (route.destination.lng - plane.longitude) * Math.PI / 180;
    const lat1 = plane.latitude * Math.PI / 180;
    const lat2 = route.destination.lat * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    if (distanceKm < 15) return 'Landing soon';

    const velocityKmh = plane.velocity * 3.6;
    const hoursRemaining = distanceKm / velocityKmh;
    const secondsRemaining = hoursRemaining * 60 * 60;

    const estimatedArrivalUnix = Math.floor(Date.now() / 1000) + secondsRemaining;
    return formatTime(estimatedArrivalUnix);
  };

  const isShowingETA = () => {
    return !plane.on_ground && route && route.destination && route.destination.lat && route.destination.lng && plane.velocity;
  };

  return (
    <div style={{ padding: '8px', background: '#0f172a', borderRadius: '8px', color: '#e2e8f0', minWidth: '180px' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #334155' }}>
        <Plane size={16} color="#38bdf8" />
        Flight {plane.callsign}
      </div>

      {route && (route.origin || route.destination) && (
        <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #334155', textAlign: 'center', color: '#f8fafc', fontSize: '12px' }}>
          {route.airline && <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{route.airline}</div>}
          <div style={{ fontWeight: 'bold' }}>
            {route.origin ? `${route.origin.name} (${route.origin.iata})` : 'Unknown'}
            {' → '}
            {route.destination ? `${route.destination.name} (${route.destination.iata})` : 'Unknown'}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}>Departure</div>
          <div style={{ color: '#f8fafc', fontWeight: '500' }}>
            {flightTime !== undefined ? (flightTime ? formatTime(flightTime.firstSeen) : 'Time unavailable') : 'Loading...'}
          </div>
        </div>
        <div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}>
            {isShowingETA() ? 'Estimated Arrival' : 'Last Updated'}
          </div>
          <div style={{ color: '#f8fafc', fontWeight: '500' }}>
            {getArrivalInfo()}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '12px' }}>
        <div style={{ color: '#94a3b8' }}>Country:</div>
        <div style={{ color: '#f8fafc', fontWeight: '500' }}>{plane.origin_country || 'Unknown'}</div>

        <div style={{ color: '#94a3b8' }}>Altitude:</div>
        <div style={{ color: '#f8fafc', fontWeight: '500' }}>{plane.altitude ? `${Math.round(plane.altitude)} m` : 'N/A'}</div>

        <div style={{ color: '#94a3b8' }}>Velocity:</div>
        <div style={{ color: '#f8fafc', fontWeight: '500' }}>{plane.velocity ? `${Math.round(plane.velocity * 3.6)} km/h` : 'N/A'}</div>
      </div>
    </div>
  );
}

export default function MapComponent() {
  // Center map around Metro Manila
  const position: [number, number] = [14.6091, 121.0223];

  const [pasigFerryData, setPasigFerryData] = useState<any>(null);
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [showAllLabels, setShowAllLabels] = useState<boolean>(false);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'NB' | 'SB'>('ALL');
  const [vehicles, setVehicles] = useState<VehicleState[]>([]);
  const [showLiveVehicles, setShowLiveVehicles] = useState<boolean>(true);
  const [osrmPaths, setOsrmPaths] = useState<Record<string, [number, number][]>>({});
  const [isOsrmLoading, setIsOsrmLoading] = useState<boolean>(false);
  const [showPastStations, setShowPastStations] = useState<boolean>(false);
  const [isStationSelectionMode, setIsStationSelectionMode] = useState<boolean>(true);
  const [showAirports, setShowAirports] = useState<boolean>(false);
  const [showLiveAircraft, setShowLiveAircraft] = useState<boolean>(false);
  const [liveAircraft, setLiveAircraft] = useState<any[]>([]);
  const [showSeaports, setShowSeaports] = useState<boolean>(false);

  const [lineViewConfig, setLineViewConfig] = useState<{
    lineId: string;
    isForward: boolean;
    originStationIdx?: number;
    destinationStationIdx?: number;
    selectedVehicleId?: string;
  }>({ lineId: 'mrt-3', isForward: true });

  const [isLineViewOpen, setIsLineViewOpen] = useState(false);
  const [showCarouselBanner, setShowCarouselBanner] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);
  const dragType = useRef<'mouse' | 'touch' | null>(null);

  useEffect(() => {
    if (!isDragging || dragType.current !== 'mouse') return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      currentDragY.current = deltaY;
      setDragY(deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragType.current = null;
      if (isPanelCollapsed && currentDragY.current > 40) setIsPanelCollapsed(false);
      else if (!isPanelCollapsed && currentDragY.current < -40) setIsPanelCollapsed(true);
      setDragY(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, isPanelCollapsed]);
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  // Force re-render periodically for simulation
  const [tick, setTick] = useState(0);

  const [watchedStations, setWatchedStations] = useState<Record<string, boolean>>({});
  const notifiedVehicles = useRef<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'default'>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const [watchedStationsSms, setWatchedStationsSms] = useState<Record<string, boolean>>({});
  const [userPhone, setUserPhone] = useState<string>('');

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('profileData');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.phone) setUserPhone(parsed.phone);
      }
    } catch (e) { }
  }, []);

  const handleToggleSmsWatch = (stationKey: string) => {
    setWatchedStationsSms(prev => ({
      ...prev,
      [stationKey]: !prev[stationKey]
    }));
  };

  const handleToggleWatch = async (stationKey: string) => {
    let perm = notificationPermission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
    if (perm === 'granted') {
      setWatchedStations(prev => ({
        ...prev,
        [stationKey]: !prev[stationKey]
      }));
    } else {
      alert("Please enable notifications in your browser settings to use this feature.");
    }
  };

  useEffect(() => {
    Object.keys(watchedStations).forEach(key => {
      if (!watchedStations[key]) return;
      const parts = key.split('_');
      const lineId = parts[0];
      const stationName = parts.slice(1).join('_');
      const line = transitLines.find(l => l.id === lineId);
      if (!line) return;
      const idx = line.stations.findIndex((s: any) => s.name === stationName);
      if (idx === -1) return;

      const arrivals = getUpcomingArrivals(lineId, idx);
      if (!arrivals) return;

      if (arrivals.forwardMins !== null && arrivals.forwardMins <= 3) {
        const notifKey = `${key}_fwd`;
        if (!notifiedVehicles.current.has(notifKey)) {
          const title = `Approaching ${stationName}`;
          const body = `A ${line.id.toUpperCase()} vehicle to ${arrivals.forwardName} is arriving in ${Math.round(arrivals.forwardMins)} mins!`;

          // Trigger In-App Banner
          const existingNotifs = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
          localStorage.setItem('mock_notifications', JSON.stringify([{ message: `${title} - ${body}`, timestamp: Date.now() }, ...existingNotifs]));

          // Toggle the flag so layout.tsx's 1s interval picks it up
          localStorage.setItem('has_new_notification', 'false');
          setTimeout(() => {
            localStorage.setItem('has_new_notification', 'true');
          }, 1100);

          // Trigger Native Browser Notification
          if (notificationPermission === 'granted') {
            new Notification(title, { body });
          }

          // Trigger SMS Notification if opted in
          if (watchedStationsSms[`${key}`] && userPhone) {
            const smsBody = `eGuide Alert: A ${line.id.toUpperCase()} vehicle to ${arrivals.forwardName} is approaching ${stationName} — arriving in ${Math.round(arrivals.forwardMins)} mins!`;
            fetch('/api/emessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ number: userPhone, message: smsBody })
            }).catch(e => console.error('SMS trigger failed', e));
          }

          notifiedVehicles.current.add(notifKey);
          setTimeout(() => notifiedVehicles.current.delete(notifKey), 5 * 60 * 1000);
        }
      }
      if (arrivals.backwardMins !== null && arrivals.backwardMins <= 3) {
        const notifKey = `${key}_bwd`;
        if (!notifiedVehicles.current.has(notifKey)) {
          const title = `Approaching ${stationName}`;
          const body = `A ${line.id.toUpperCase()} vehicle to ${arrivals.backwardName} is arriving in ${Math.round(arrivals.backwardMins)} mins!`;

          // Trigger In-App Banner
          const existingNotifs = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
          localStorage.setItem('mock_notifications', JSON.stringify([{ message: `${title} - ${body}`, timestamp: Date.now() }, ...existingNotifs]));

          // Toggle the flag so layout.tsx's 1s interval picks it up
          localStorage.setItem('has_new_notification', 'false');
          setTimeout(() => {
            localStorage.setItem('has_new_notification', 'true');
          }, 1100);

          // Trigger Native Browser Notification
          if (notificationPermission === 'granted') {
            new Notification(title, { body });
          }

          // Trigger SMS Notification if opted in
          if (watchedStationsSms[`${key}`] && userPhone) {
            const smsBody = `eGuide Alert: A ${line.id.toUpperCase()} vehicle to ${arrivals.backwardName} is approaching ${stationName} — arriving in ${Math.round(arrivals.backwardMins)} mins!`;
            fetch('/api/emessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ number: userPhone, message: smsBody })
            }).catch(e => console.error('SMS trigger failed', e));
          }

          notifiedVehicles.current.add(notifKey);
          setTimeout(() => notifiedVehicles.current.delete(notifKey), 5 * 60 * 1000);
        }
      }
    });
  }, [tick, watchedStations, notificationPermission]); // intentionally omitted transitLines to avoid unnecessary re-runs


  const mapRef = useRef<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (showLiveAircraft) {
      const fetchFlights = async () => {
        try {
          const res = await fetch('/api/flights');
          if (res.ok) {
            const data = await res.json();
            console.log('[FRONTEND] Received OpenSky data:', data);
            if (data.flights) {
              console.log('[FRONTEND] Setting liveAircraft array with length:', data.flights.length);
              setLiveAircraft(data.flights);
            } else {
              console.warn('[FRONTEND] No flights array found in response');
            }
          }
        } catch (e) {
          console.error("Failed to fetch live aircraft", e);
        }
      };

      fetchFlights();
      intervalId = setInterval(fetchFlights, 25000);
    } else {
      setLiveAircraft([]);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showLiveAircraft]);

  useEffect(() => {
    const mode = searchParams?.get('mode');
    const targetLine = searchParams?.get('targetLine');
    const lat = searchParams?.get('lat');
    const lng = searchParams?.get('lng');

    if (mode) {
      if (mode === 'trains') {
        setSelectedLine('category-trains');
        setExpandedDropdown('trains');
      } else if (mode === 'buses') {
        setSelectedLine('category-buses');
        setExpandedDropdown('buses');
      }
    }

    if (targetLine) {
      setSelectedLine(targetLine);
      if (['lrt-1', 'lrt-2', 'mrt-3', 'mrt-7', 'pnr-nscr', 'pnr-south', 'pnr-bicol'].includes(targetLine)) {
        setExpandedDropdown('trains');
      } else if (['edsa-carousel', 'bgc-bus-west', 'bgc-bus-east-express', 'bgc-bus-north'].includes(targetLine)) {
        setExpandedDropdown('buses');
      }

      if (lat && lng) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.flyTo([parseFloat(lat), parseFloat(lng)], 15, { duration: 1.5 });
          }
        }, 500);
      }
    }
  }, [searchParams]);

  const zoomToLines = (lineIds: string[]) => {
    if (!mapRef.current) return;
    const coords: [number, number][] = [];
    transitLines.filter(l => lineIds.includes(l.id)).forEach(line => {
      line.stations.forEach(s => coords.push(s.coords));
      if (osrmPaths[line.id]) {
        coords.push(...osrmPaths[line.id]);
      } else if (line.path) {
        coords.push(...line.path);
      }
    });
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
  };

  useEffect(() => {
    const fetchFerryData = async () => {
      const FALLBACK_FERRY_COORDINATES: [number, number][] = [
        [14.5925, 120.9692], // Escolta
        [14.5938, 120.9782], // Lawton
        [14.5902, 120.9902], // Plaza Mexico / Quinta
        [14.5912, 120.9985], // PUP Sta. Mesa
        [14.5822, 121.0118], // Lambingan
        [14.5788, 121.0255], // Valenzuela
        [14.5701, 121.0348], // Hulo
        [14.5668, 121.0452], // Guadalupe
        [14.5572, 121.0660], // San Joaquin
        [14.5560, 121.0772], // Kalawaan
        [14.5588, 121.0835]  // Pinagbuhatan
      ];

      const fallbackGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              // GeoJSON expects [longitude, latitude]
              coordinates: FALLBACK_FERRY_COORDINATES.map(([lat, lng]) => [lng, lat])
            },
            properties: {
              name: "Pasig River Ferry",
              stroke: "#06b6d4"
            }
          }
        ]
      };

      try {
        const res = await fetch('/data/pasig-ferry.json');
        if (!res.ok) {
          console.warn(`Ferry GeoJSON not found (Status ${res.status}). Using fallback array.`);
          setPasigFerryData(fallbackGeoJSON);
          return;
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Ferry response is not JSON. Using fallback array.');
          setPasigFerryData(fallbackGeoJSON);
          return;
        }
        const ferryData = await res.json();
        setPasigFerryData(ferryData);
      } catch (err) {
        console.error('Error loading Ferry GeoJSON. Using fallback array.', err);
        setPasigFerryData(fallbackGeoJSON);
      }
    };
    fetchFerryData();
  }, []);

  useEffect(() => {
    // Note: Using the public OSRM demo server (router.project-osrm.org) for now,
    // which is rate-limited and not meant for production.
    // TODO: Self-host OSRM or switch to Mapbox Map Matching API for production.
    const fetchOsrmRoutes = async () => {
      setIsOsrmLoading(true);
      const bgcLines = transitLines.filter(l => l.id.startsWith('bgc-bus'));

      for (const bgcLine of bgcLines) {
        try {
          let route: [number, number][] = [];

          if (bgcLine.outboundWaypoints && bgcLine.returnWaypoints && bgcLine.stations.length === 2) {
            // Dual-leg true loop (e.g., East Express)
            const start = bgcLine.stations[0];
            const end = bgcLine.stations[1];

            // 1. Outbound (Start -> Outbound Vias -> End)
            const outStops = [start, ...bgcLine.outboundWaypoints, end];
            const outString = outStops.map(s => `${s.coords[1]},${s.coords[0]}`).join(';');
            const outUrl = `https://router.project-osrm.org/route/v1/driving/${outString}?overview=full&geometries=geojson`;

            // 2. Return (End -> Return Vias -> Start)
            const retStops = [end, ...bgcLine.returnWaypoints, start];
            const retString = retStops.map(s => `${s.coords[1]},${s.coords[0]}`).join(';');
            const retUrl = `https://router.project-osrm.org/route/v1/driving/${retString}?overview=full&geometries=geojson`;

            const [outRes, retRes] = await Promise.all([fetch(outUrl), fetch(retUrl)]);
            const outData = await outRes.json();
            const retData = await retRes.json();

            if (outData.code !== 'Ok' || retData.code !== 'Ok') {
              throw new Error(`OSRM API Error for dual-leg route`);
            }

            const outCoords = outData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            const retCoords = retData.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

            // Combine both legs
            route = [...outCoords, ...retCoords];
          } else {
            // Standard single-call route (e.g., West Route)
            let stopsToRoute: { lat: number, lng: number, rad: string }[] = [];

            bgcLine.stations.forEach(s => {
              // Zone 3 Fix: The user's exact HSBC coordinate falls precisely on the Southbound lane of 5th Ave (which has a median).
              // This naturally forces OSRM to U-turn around 30th/32nd streets. By dynamically nudging the routing target 
              // slightly East here (without modifying the user's base coordinate array), we snap perfectly to the Northbound lane.
              const isHSBCNorth = bgcLine.id === 'bgc-bus-north' && s.name === 'HSBC';
              const routingLng = isHSBCNorth ? 121.0486 : s.coords[1];

              stopsToRoute.push({ lat: s.coords[0], lng: routingLng, rad: 'unlimited' });

              // Inject generic via-points specified in transitData (using afterStation property)
              if (bgcLine.routingWaypoints) {
                const vias = bgcLine.routingWaypoints.filter(w => w.afterStation === s.name || (s.name === 'Arya Residences' && w.name === 'Via 9th Ave'));
                vias.forEach(via => {
                  stopsToRoute.push({ lat: via.coords[0], lng: via.coords[1], rad: 'unlimited' });
                });
              }
            });

            // Close the loop by returning to the first station
            if (bgcLine.stations.length > 0) {
              const firstStation = bgcLine.stations[0];
              stopsToRoute.push({ lat: firstStation.coords[0], lng: firstStation.coords[1], rad: 'unlimited' });
            }

            const coordsString = stopsToRoute.map(s => `${s.lng},${s.lat}`).join(';');
            const radiuses = stopsToRoute.map(s => s.rad).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&radiuses=${radiuses}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code !== 'Ok') {
              throw new Error(`OSRM API Error: ${data.code} - ${data.message || ''}`);
            }

            const coordinates = data.routes[0].geometry.coordinates;
            route = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          }

          // Hack to remove Ayala Avenue U-turn spike and zigzag for BGC Bus routes ending at EDSA
          // OSRM forces a U-turn on Ayala because it thinks the left turn into the terminal is illegal.
          // This creates a Westbound overshoot, a U-turn spike, and an Eastbound backtrack (zigzag).
          // We filter out these redundant coordinates from the arrival sequence to simulate a clean left turn.
          // We only apply this filter to the final 30% of the route to avoid breaking outbound paths, 
          // and use an expanded bounding box to ensure no stray triangle artifacts are left behind.
          const filterStartIdx = Math.floor(route.length * 0.7);
          const filteredArrival = route.slice(filterStartIdx).filter(
            (c: [number, number]) => !(c[0] > 14.5493 && c[1] < 121.0305)
          );
          route = [...route.slice(0, filterStartIdx), ...filteredArrival];

          setOsrmPaths(prev => ({ ...prev, [bgcLine.id]: route }));
        } catch (error) {
          console.error(`Failed to get OSRM route for ${bgcLine.name}, falling back to straight lines:`, error);
        }
      }
      setIsOsrmLoading(false);
    };
    fetchOsrmRoutes();
  }, []);

  const linePaths = useMemo(() => {
    const paths: Record<string, any> = {};
    transitLines.forEach(line => {
      let points: [number, number][] = [];
      let totalDist = 0;
      let dists: number[] = [0];

      let rawPoints: [number, number][] = [];
      if (osrmPaths[line.id]) {
        rawPoints = osrmPaths[line.id];
      } else if (line.path) {
        rawPoints = line.path;
      } else {
        line.stations.forEach(st => rawPoints.push(st.coords));
      }

      if (!rawPoints || rawPoints.length === 0) {
        rawPoints = [[0, 0]];
      }

      // Permanent Safety check: filter out invalid, duplicate, or zero-length segments gracefully
      points = [];
      for (let i = 0; i < rawPoints.length; i++) {
        const p = rawPoints[i];
        if (!p || typeof p[0] !== 'number' || typeof p[1] !== 'number' || isNaN(p[0]) || isNaN(p[1])) {
          continue; // Skip invalid points
        }
        if (points.length > 0) {
          const last = points[points.length - 1];
          if (last[0] === p[0] && last[1] === p[1]) {
            continue; // Skip duplicates
          }
        }
        points.push(p);
      }

      if (points.length === 0) {
        points = [[0, 0]]; // Ultimate fallback
      }

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const d = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        totalDist += d;
        dists.push(totalDist);
      }

      const stationDists = line.stations.map(st => {
        let nearestDist = 0;
        let minDiff = Infinity;
        points.forEach((pt, idx) => {
          const diff = Math.sqrt(Math.pow(pt[0] - st.coords[0], 2) + Math.pow(pt[1] - st.coords[1], 2));
          if (diff < minDiff) {
            minDiff = diff;
            nearestDist = dists[idx];
          }
        });
        return nearestDist;
      });

      // Handle loop routes (like BGC buses) which only list unique stations
      // but are driven as a continuous loop back to the start terminal.
      // This provides the missing 'endDist' for the final return leg.
      if (line.id.startsWith('bgc-bus')) {
        stationDists.push(totalDist);
      }

      paths[line.id] = { points, totalDist, dists, stationDists };
    });
    return paths;
  }, [osrmPaths]);

  const getSimulatedTime = () => {
    return new Date();
  };

  const isSystemActive = () => {
    const now = getSimulatedTime();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const time = hours + mins / 60;
    // 4:30 AM = 4.5, 10:00 PM = 22.0
    return time >= 4.5 && time < 22.0;
  };



  // Realistic Simulation loop using Date.now() timetables (1 update per second)
  useEffect(() => {
    if (!showLiveVehicles) {
      setVehicles([]);
      return;
    }

    const updateVehicles = () => {
      if (!isSystemActive()) {
        setVehicles([]);
        return;
      }

      const nowObj = getSimulatedTime();
      const now = nowObj.getTime();
      const isPeak = isPeakHour(nowObj);
      const newVehicles: VehicleState[] = [];

      transitLines.forEach(line => {
        if (line.isUnderConstruction) return;

        const config = LINE_CONFIGS[line.id];
        if (!config) return;

        const ROUND_TRIP_MS = getLineRoundTripMs(line.id);
        const fleetSize = isPeak ? config.fleetSizePeak : config.fleetSizeOffPeak;
        const headwayMs = (isPeak ? config.peakHeadwaySec : config.offPeakHeadwaySec) * 1000;
        const M = line.stations.length - 1;
        const pathInfo = linePaths[line.id];
        if (!pathInfo) return;

        for (let i = 0; i < fleetSize; i++) {
          // Perfectly space trains across the full track loop
          const offsetMs = (i / fleetSize) * ROUND_TRIP_MS;
          const t = (now + offsetMs) % ROUND_TRIP_MS;

          const pos = getVehiclePosition(t, line.id);
          if (!pos) continue;

          // Wrap indices gracefully to prevent out-of-bounds console errors 
          // if a route's leg config doesn't perfectly match its station array size
          const validStartIdx = pos.startStationIdx % pathInfo.stationDists.length;
          const validEndIdx = pos.endStationIdx % pathInfo.stationDists.length;

          const startDist = pathInfo.stationDists[validStartIdx];
          const endDist = pathInfo.stationDists[validEndIdx];

          let baseCoords: [number, number] = pathInfo.points[0];
          let p0 = pathInfo.points[0];
          let p1 = pathInfo.points[0];
          let dLat = 0;
          let dLng = 0;

          if (startDist === undefined || endDist === undefined) {
            console.error(`Invalid dists for line ${line.id} at idx ${pos.startStationIdx}`);
          } else {
            const currentDist = startDist + (endDist - startDist) * pos.progress;

            // Get exact coordinates from currentDist along the polyline
            for (let j = 1; j < pathInfo.dists.length; j++) {
              if (pathInfo.dists[j] >= currentDist || j === pathInfo.dists.length - 1) {
                const d0 = pathInfo.dists[j - 1];
                const d1 = pathInfo.dists[j];
                const fraction = d1 === d0 ? 0 : (currentDist - d0) / (d1 - d0);
                p0 = pathInfo.points[j - 1];
                p1 = pathInfo.points[j];
                baseCoords = [
                  p0[0] + (p1[0] - p0[0]) * fraction,
                  p0[1] + (p1[1] - p0[1]) * fraction
                ];
                break;
              }
            }

            // Fallback if interpolation evaluates to NaN
            if (isNaN(baseCoords[0]) || isNaN(baseCoords[1])) {
              console.error(`Interpolation NaN for ${line.id}`);
              baseCoords = pathInfo.points[0];
            }

            dLat = p1[0] - p0[0];
            dLng = p1[1] - p0[1];
            if (!pos.isForward) {
              dLat = p0[0] - p1[0];
              dLng = p0[1] - p1[1];
            }

            if (dLat === 0 && dLng === 0 && pathInfo.points.length > 1) {
              dLat = pathInfo.points[1][0] - pathInfo.points[0][0];
              dLng = pathInfo.points[1][1] - pathInfo.points[0][1];
              if (!pos.isForward) { dLat = -dLat; dLng = -dLng; }
            }
          }

          const norm = Math.sqrt(dLat * dLat + dLng * dLng);
          const OFFSET = 0.00015;
          let shiftLat = 0;
          let shiftLng = 0;
          if (norm > 0) {
            shiftLat = (-dLng / norm) * OFFSET;
            shiftLng = (dLat / norm) * OFFSET;
          }

          const coords: [number, number] = [
            baseCoords[0] + shiftLat,
            baseCoords[1] + shiftLng
          ];

          // Additional safety check
          if (isNaN(coords[0]) || isNaN(coords[1])) {
            continue; // Do not render if completely invalid
          }

          const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
          const isFerry = line.id === 'pasig-ferry';
          const isEastWest = line.id === 'lrt-2' || isFerry || line.id === 'bgc-bus-east-express' || line.id === 'bgc-bus-west';

          let headingText = pos.isForward ? 'Southbound' : 'Northbound';
          if (isFerry) {
            headingText = pos.isForward ? 'Upstream (Eastbound)' : 'Downstream (Westbound)';
          } else if (isEastWest) {
            headingText = pos.isForward ? 'Eastbound' : 'Westbound';
          }

          const safeStartIdx = pos.startStationIdx % line.stations.length;
          const safeEndIdx = pos.endStationIdx % line.stations.length;
          const safeM = M % line.stations.length;

          const startName = line.stations[safeStartIdx].name;
          const endName = line.stations[safeEndIdx].name;
          const boundFor = pos.isForward ? line.stations[safeM].name : line.stations[0].name;

          const minsToNext = Math.max(1, Math.ceil(pos.nextStationEtaMs / 60000));
          let statusText = pos.isDwelling
            ? `Boarding at ${startName}`
            : `Approaching ${endName} in ${minsToNext} min`;

          if (pos.isDwelling && (pos.startStationIdx === 0 || pos.startStationIdx === M)) {
            statusText = `Standby at ${startName}`;
          }

          let logicalFraction = 0;
          if (pos.isForward) {
            logicalFraction = (pos.startStationIdx + pos.progress) / M;
          } else {
            logicalFraction = (M - pos.startStationIdx + pos.progress) / M;
          }

          newVehicles.push({
            id: `${line.id}-v${i + 1}`,
            lineId: line.id,
            num: i + 1,
            coords,
            statusText,
            boundFor,
            headingText,
            angle,
            logicalFraction,
            isForward: pos.isForward,
            isDwelling: pos.isDwelling,
            nextStationEtaMs: pos.nextStationEtaMs,
            totalLegMs: pos.totalLegMs
          });
        }
      });

      setVehicles(newVehicles);
    };

    updateVehicles();
    const interval = setInterval(updateVehicles, 1000);
    return () => clearInterval(interval);
  }, [showLiveVehicles, linePaths]);

  const createVehicleIcon = (lineId: string, color: string, isFaded: boolean, headingText: string) => {
    const opacity = isFaded ? 0.2 : 1;
    const line = transitLines.find(l => l.id === lineId);
    const isTrain = line?.type === 'rail';
    const isFerry = line?.type === 'ferry';
    const isBus = line?.type === 'bus';

    let dirCode = 'NB';
    if (headingText.includes('Southbound')) dirCode = 'SB';
    else if (headingText.includes('Eastbound')) dirCode = 'EB';
    else if (headingText.includes('Westbound')) dirCode = 'WB';

    // High-contrast direction badge pill (Option B)
    const dirBadge = `<div style="
      position: absolute;
      top: -8px;
      right: -10px;
      background-color: #111827;
      color: #ffffff;
      font-size: 8px;
      font-family: monospace;
      font-weight: 900;
      padding: 2px 4px;
      border-radius: 4px;
      border: 1.5px solid ${color};
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      z-index: 10;
    ">${dirCode}</div>`;

    if (isTrain || isFerry || isBus) {
      const trainSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16px" height="16px" style="z-index: 2; position: relative; margin-top: 1px"><path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2.23v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm6 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z"/></svg>`;
      const ferrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16px" height="16px" style="z-index: 2; position: relative; margin-top: 1px"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`;
      const busSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14px" height="14px" style="z-index: 2; position: relative; margin-top: 1px"><path d="M4 6 5.2 3.6a2 2 0 0 1 1.8-1.1h10a2 2 0 0 1 1.8 1.1L20 6"/><path d="M2.5 12h19"/><path d="M18 6H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/><path d="M6 19v2"/><path d="M18 19v2"/><circle cx="7" cy="15" r="1"/><circle cx="17" cy="15" r="1"/></svg>`;

      let iconSvg = trainSvg;
      if (isFerry) iconSvg = ferrySvg;
      if (isBus) iconSvg = busSvg;

      return L.divIcon({
        className: 'custom-vehicle-marker',
        html: `<div style="
          position: relative;
          background-color: ${color};
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          opacity: ${opacity};
          display: flex;
          align-items: center;
          justify-content: center;
        ">${iconSvg}${dirBadge}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
    }

    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `<div class="${!isFaded ? 'vehicle-pulse' : ''}" style="
        position: relative;
        background-color: ${color};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 6px ${color};
        opacity: ${opacity};
        display: flex;
        align-items: center;
        justify-content: center;
      ">${dirBadge}</div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  // Snap station coordinates to the nearest point on the GeoJSON river geometry
  const snappedFerryStations = useMemo(() => {
    if (!pasigFerryData) return null;

    // Extract all geometry coordinates from GeoJSON
    const allPoints: [number, number][] = []; // [lat, lng]
    if (pasigFerryData.features) {
      pasigFerryData.features.forEach((feature: any) => {
        if (feature.geometry && feature.geometry.type === 'LineString') {
          // GeoJSON coordinates are [lng, lat]
          feature.geometry.coordinates.forEach((coord: [number, number]) => {
            allPoints.push([coord[1], coord[0]]);
          });
        } else if (feature.geometry && feature.geometry.type === 'MultiLineString') {
          feature.geometry.coordinates.forEach((line: [number, number][]) => {
            line.forEach((coord: [number, number]) => {
              allPoints.push([coord[1], coord[0]]);
            });
          });
        }
      });
    }

    const pasigFerryLine = transitLines.find(l => l.id === 'pasig-ferry');
    if (!pasigFerryLine) return null;

    // Helper for squared distance
    const distSq = (p1: [number, number], p2: [number, number]) => {
      const dLat = p1[0] - p2[0];
      const dLng = p1[1] - p2[1];
      return dLat * dLat + dLng * dLng;
    };

    return pasigFerryLine.stations.map(station => {
      let nearest = station.coords;
      let minD = Infinity;
      allPoints.forEach(p => {
        const d = distSq(station.coords, p);
        if (d < minD) {
          minD = d;
          nearest = p;
        }
      });
      return { ...station, coords: nearest };
    });
  }, [pasigFerryData]);

  const formatArrivalTime = (mins: number) => {
    const d = getSimulatedTime();
    d.setMinutes(d.getMinutes() + mins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getUpcomingArrivals = (lineId: string, stationIdx: number) => {
    const line = transitLines.find(l => l.id === lineId);
    if (!line) return null;
    const M = line.stations.length - 1;
    if (M <= 0) return null;

    const config = LINE_CONFIGS[lineId];
    if (!config) return null;

    const nowObj = getSimulatedTime();
    const isPeak = isPeakHour(nowObj);
    const fleetSize = isPeak ? config.fleetSizePeak : config.fleetSizeOffPeak;
    const headwayMs = (isPeak ? config.peakHeadwaySec : config.offPeakHeadwaySec) * 1000;
    const ROUND_TRIP_MS = getLineRoundTripMs(lineId);

    const now = nowObj.getTime();

    let forwardTargetTime = 0;
    const dwellMs = config.dwellTimeSec * 1000;
    for (let i = 0; i < stationIdx; i++) {
      forwardTargetTime += dwellMs + (config.legDurations[i] * 1000);
    }

    let backwardTargetTime = 0;
    for (let i = 0; i < M; i++) {
      backwardTargetTime += dwellMs + (config.legDurations[i] * 1000);
    }
    backwardTargetTime += dwellMs;
    for (let i = M - 1; i >= stationIdx; i--) {
      backwardTargetTime += dwellMs + (config.legDurations[i] * 1000);
    }

    let minForwardMs = Infinity;
    let minBackwardMs = Infinity;

    for (let i = 0; i < fleetSize; i++) {
      const offsetMs = i * headwayMs;
      const t = (now + offsetMs) % ROUND_TRIP_MS;

      let diffFwd = (forwardTargetTime - t + ROUND_TRIP_MS) % ROUND_TRIP_MS;
      if (diffFwd < minForwardMs) minForwardMs = diffFwd;

      let diffBwd = (backwardTargetTime - t + ROUND_TRIP_MS) % ROUND_TRIP_MS;
      if (diffBwd < minBackwardMs) minBackwardMs = diffBwd;
    }

    return {
      forwardMins: Math.max(1, Math.ceil(minForwardMs / 60000)),
      backwardMins: Math.max(1, Math.ceil(minBackwardMs / 60000)),
      forwardName: line.stations[M % line.stations.length].name,
      backwardName: line.stations[0].name
    };
  };

  const getUpcomingDepartures = (lineId: string, stationIdx: number, isForward: boolean, count: number = 4) => {
    const config = LINE_CONFIGS[lineId];
    if (!config) return [];

    const nowObj = getSimulatedTime();
    const isPeak = isPeakHour(nowObj);
    const fleetSize = isPeak ? config.fleetSizePeak : config.fleetSizeOffPeak;
    const headwayMs = (isPeak ? config.peakHeadwaySec : config.offPeakHeadwaySec) * 1000;
    const ROUND_TRIP_MS = getLineRoundTripMs(lineId);

    const now = nowObj.getTime();
    let targetTime = 0;
    const M = config.legDurations.length;
    const dwellMs = config.dwellTimeSec * 1000;

    if (isForward) {
      for (let i = 0; i < stationIdx; i++) {
        targetTime += dwellMs + (config.legDurations[i] * 1000);
      }
    } else {
      // Forward trip
      for (let i = 0; i < M; i++) {
        targetTime += dwellMs + (config.legDurations[i] * 1000);
      }
      targetTime += dwellMs; // Terminal dwell

      // Backward trip up to stationIdx
      for (let i = M - 1; i >= stationIdx; i--) {
        targetTime += dwellMs + (config.legDurations[i] * 1000);
      }
    }

    const departures = [];
    for (let i = 0; i < fleetSize; i++) {
      const offsetMs = i * headwayMs;
      const t = (now + offsetMs) % ROUND_TRIP_MS;
      let diffMs = (targetTime - t + ROUND_TRIP_MS) % ROUND_TRIP_MS;
      departures.push({
        vehicleId: `${lineId}-v${i + 1}`,
        etaMs: diffMs,
        etaMins: Math.max(1, Math.ceil(diffMs / 60000))
      });
    }
    return departures.sort((a, b) => a.etaMs - b.etaMs).slice(0, count);
  };

  const renderStationSelectionPrompt = () => {
    const handleUseMyLocation = () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          let closestDist = Infinity;
          let closestStationIdx = 0;
          let closestLineId = 'lrt-1';

          const distSq = (lat1: number, lng1: number, lat2: number, lng2: number) => {
            const dLat = lat1 - lat2;
            const dLng = lng1 - lng2;
            return dLat * dLat + dLng * dLng;
          };

          transitLines.forEach(line => {
            if (line.isUnderConstruction) return;
            line.stations.forEach((station, idx) => {
              const d = distSq(lat, lng, station.coords[0], station.coords[1]);
              if (d < closestDist) {
                closestDist = d;
                closestStationIdx = idx;
                closestLineId = line.id;
              }
            });
          });

          setLineViewConfig({
            lineId: closestLineId,
            isForward: true,
            originStationIdx: closestStationIdx
          });
          setIsStationSelectionMode(false);
          setShowPastStations(false);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Unable to retrieve your location. Please check browser permissions.");
        }
      );
    };

    const activeLine = transitLines.find(l => l.id === lineViewConfig.lineId) || transitLines[0];

    return (
      <div style={{ padding: '24px 20px 120px 20px', color: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', backgroundColor: '#0f172a', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Select Your Station</h2>
          <button onClick={() => setIsLineViewOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
          Where are you starting your journey?
        </p>

        <button
          onClick={handleUseMyLocation}
          style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <MapPin size={16} /> Use My Location
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
          <span style={{ padding: '0 12px', fontSize: '11px', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.5px' }}>OR SELECT MANUALLY</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TRANSIT LINE</label>
            <select
              value={lineViewConfig.lineId}
              onChange={e => setLineViewConfig(c => ({ ...c, lineId: e.target.value, originStationIdx: 0 }))}
              style={{ width: '100%', padding: '12px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            >
              {transitLines.filter(l => !l.isUnderConstruction).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>ORIGIN STATION</label>
            <select
              value={lineViewConfig.originStationIdx ?? ''}
              onChange={e => setLineViewConfig(c => ({ ...c, originStationIdx: parseInt(e.target.value) }))}
              style={{ width: '100%', padding: '12px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            >
              <option value="" disabled>Select Origin</option>
              {activeLine.stations.filter(s => !s.isVia).map((s, idx) => <option key={idx} value={idx}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>DESTINATION STATION</label>
            <select
              value={lineViewConfig.destinationStationIdx ?? ''}
              onChange={e => setLineViewConfig(c => ({ ...c, destinationStationIdx: parseInt(e.target.value) }))}
              style={{ width: '100%', padding: '12px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            >
              <option value="" disabled>Select Destination</option>
              {activeLine.stations.filter(s => !s.isVia).map((s, idx) => <option key={idx} value={idx}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ position: 'sticky', bottom: '-20px', backgroundColor: '#0f172a', paddingTop: '10px', paddingBottom: '10px', marginTop: 'auto', zIndex: 10 }}>
            <button
              onClick={() => {
                const originStationName = lineViewConfig.originStationIdx !== undefined ? activeLine.stations[lineViewConfig.originStationIdx]?.name || '' : '';
                const destinationStationName = lineViewConfig.destinationStationIdx !== undefined ? activeLine.stations[lineViewConfig.destinationStationIdx]?.name || '' : '';

                const isCarouselDemo = lineViewConfig.lineId === 'edsa-carousel' && originStationName.toLowerCase().includes('trinoma') && destinationStationName.toLowerCase().includes('main ave');

                if (isCarouselDemo) {
                  setShowCarouselBanner(true);
                  setTimeout(() => setShowCarouselBanner(false), 5000); // auto dismiss
                }

                if (lineViewConfig.originStationIdx === undefined) {
                  setLineViewConfig(c => ({ ...c, originStationIdx: 0 }));
                }
                if (lineViewConfig.originStationIdx !== undefined && lineViewConfig.destinationStationIdx !== undefined) {
                  const isForward = lineViewConfig.destinationStationIdx >= lineViewConfig.originStationIdx;
                  setLineViewConfig(c => ({ ...c, isForward }));
                }
                setIsStationSelectionMode(false);
                setShowPastStations(false);
              }}
              style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 -4px 10px rgba(0,0,0,0.2)' }}
            >
              View Route &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLineViewContent = () => {
    const line = transitLines.find(l => l.id === lineViewConfig.lineId);
    if (!line) return null;

    const M = line.stations.length - 1;

    let stations = line.stations.filter(s => !s.isVia);
    if (!lineViewConfig.isForward) {
      stations = [...stations].reverse();
    }

    const isContextual = lineViewConfig.originStationIdx !== undefined;
    let originRenderIdx = 0;
    if (isContextual) {
      originRenderIdx = lineViewConfig.isForward
        ? lineViewConfig.originStationIdx!
        : M - lineViewConfig.originStationIdx!;
    }

    const activeVehicles = vehicles.filter(v => {
      if (v.lineId !== line.id || v.isForward !== lineViewConfig.isForward) return false;
      if (isContextual) {
        const vehicleRenderIdx = v.logicalFraction * M;
        // Hide trains that have already passed the origin station
        if (vehicleRenderIdx > originRenderIdx) return false;
      }
      return true;
    });

    let departures: { vehicleId: string, etaMs: number, etaMins: number }[] = [];
    let selectedDep: any = undefined;

    if (isContextual) {
      departures = getUpcomingDepartures(line.id, lineViewConfig.originStationIdx!, lineViewConfig.isForward, 4);

      if (lineViewConfig.selectedVehicleId) {
        selectedDep = departures.find(d => d.vehicleId === lineViewConfig.selectedVehicleId) || { vehicleId: lineViewConfig.selectedVehicleId };
      } else {
        // Find the nearest incoming train physically behind the origin station
        let nearestVehicleId = undefined;
        let minDistance = Infinity;
        for (const v of activeVehicles) {
          const vehicleRenderIdx = v.logicalFraction * M;
          const dist = originRenderIdx - vehicleRenderIdx;
          // activeVehicles already filters out vehicleRenderIdx > originRenderIdx, so dist >= 0 is guaranteed
          if (dist >= 0 && dist < minDistance) {
            minDistance = dist;
            nearestVehicleId = v.id;
          }
        }

        if (nearestVehicleId) {
          selectedDep = departures.find(d => d.vehicleId === nearestVehicleId) || { vehicleId: nearestVehicleId };
        }
      }
    }

    let renderStations = stations;
    let hiddenCount = 0;

    if (isContextual) {
      if (!showPastStations) {
        let targetVehicleRenderIdx = originRenderIdx;
        if (selectedDep) {
          const sv = activeVehicles.find(v => v.id === selectedDep.vehicleId);
          if (sv) {
            targetVehicleRenderIdx = sv.logicalFraction * M;
          }
        }

        hiddenCount = Math.floor(targetVehicleRenderIdx);
        // Don't hide more than the origin (so we always show the origin station)
        hiddenCount = Math.min(hiddenCount, originRenderIdx);

        renderStations = stations.slice(hiddenCount);
      }
    }

    const formatAbsoluteTime = (addedMs: number) => {
      const d = new Date(getSimulatedTime().getTime() + addedMs);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const headerTitle = isContextual
      ? `${line.name.split(' ')[0]} - ${stations[stations.length - 1].name}`
      : `${line.name.split(' ')[0]} Schematic`;

    return (
      <>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', backgroundColor: '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ backgroundColor: line.color, width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' }}></span>
                {headerTitle}
              </h2>
              <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#334155', color: '#cbd5e1', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                {lineViewConfig.isForward
                  ? (line.id === 'lrt-2' || line.id === 'pasig-ferry' ? 'EASTBOUND' : 'SOUTHBOUND')
                  : (line.id === 'lrt-2' || line.id === 'pasig-ferry' ? 'WESTBOUND' : 'NORTHBOUND')}
              </span>
              {isContextual && (
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', marginLeft: '22px' }}>
                  from <strong>{line.stations[lineViewConfig.originStationIdx!].name}</strong>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isContextual && (
                <button
                  onClick={() => setIsStationSelectionMode(true)}
                  style={{ fontSize: '11px', background: '#334155', color: '#e2e8f0', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Change Station
                </button>
              )}
              <button onClick={() => setIsLineViewOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
          </div>

          {isContextual && departures.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Departures</div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {departures.map((dep, idx) => {
                  const isSelected = selectedDep?.vehicleId === dep.vehicleId;
                  return (
                    <button
                      key={dep.vehicleId}
                      onClick={() => setLineViewConfig(c => ({ ...c, selectedVehicleId: dep.vehicleId }))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: isSelected ? `1px solid ${line.color}` : '1px solid #334155',
                        background: isSelected ? `${line.color}20` : '#0f172a',
                        color: isSelected ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '80px'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{formatAbsoluteTime(dep.etaMs)}</span>
                      <span style={{ fontSize: '10px', color: isSelected ? line.color : '#64748b', marginTop: '2px' }}>{idx === 0 ? 'Next' : `in ${dep.etaMins}m`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', position: 'relative' }}>
          {isContextual && hiddenCount > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button
                onClick={() => setShowPastStations(true)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                ↑ Show {hiddenCount} previous stops
              </button>
            </div>
          )}

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: `${renderStations.length * 70}px`, zIndex: 5 }}>
            {/* Vertical Track Line */}
            <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '26px', transform: 'translateX(-50%)', width: '4px', backgroundColor: line.color, borderRadius: '2px', zIndex: -1 }}>
              {activeVehicles.map(v => {
                const isFaded = isContextual && v.id !== selectedDep?.vehicleId;

                let topPct = v.logicalFraction * 100;

                if (hiddenCount > 0) {
                  const startFrac = hiddenCount / M;
                  topPct = (v.logicalFraction - startFrac) / (1 - startFrac) * 100;
                }

                if (topPct < 0 || topPct > 100) return null;

                return (
                  <div key={v.id} style={{
                    position: 'absolute',
                    top: `${topPct}%`,
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: 'top 1s linear',
                    zIndex: isFaded ? 5 : 30,
                    opacity: isFaded ? 0.15 : 1
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: line.color,
                      border: '2px solid #FFFFFF',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                    }}>
                      {line.id === 'pasig-ferry'
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.93V3c0-1.1-.9-2-2-2h-1c-1.1 0-2 .9-2 2v2h-1V3c0-1.1-.9-2-2-2H9C7.9 0 7 .9 7 2v5H6V3c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v7.93l-1.29.11c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM11 2h2v4h-2V2z" /></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm4 0V6h5v4h-5zm1.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              let cumulativeMs = 0;
              return renderStations.map((st, i) => {
                const globalRenderIdx = hiddenCount + i;
                const originalIdx = lineViewConfig.isForward ? globalRenderIdx : (stations.length - 1 - globalRenderIdx);

                let etaText = '---';

                if (isContextual && selectedDep) {
                  if (i > 0) {
                    const prevOriginalIdx = lineViewConfig.isForward ? (globalRenderIdx - 1) : (stations.length - 1 - (globalRenderIdx - 1));
                    const legMs = getTravelTimeMs(line.id, prevOriginalIdx, originalIdx, lineViewConfig.isForward);
                    cumulativeMs += legMs;
                  }
                  const stationEtaMs = selectedDep.etaMs + cumulativeMs;
                  etaText = formatAbsoluteTime(stationEtaMs);
                } else if (!isContextual) {
                  const arrivals = getUpcomingArrivals(line.id, originalIdx);
                  if (arrivals) {
                    const mins = lineViewConfig.isForward ? arrivals.forwardMins : arrivals.backwardMins;
                    etaText = formatArrivalTime(mins);
                  }
                }

                const isOrigin = isContextual && globalRenderIdx === originRenderIdx;

                const approachingVehicle = activeVehicles.find(v => {
                  if (isContextual && v.id !== selectedDep?.vehicleId) return false;
                  const distance = v.logicalFraction * M - globalRenderIdx;
                  return distance >= -0.1 && distance <= 1.0;
                });
                const isApproaching = !!approachingVehicle;

                return (
                  <div key={st.name} style={{ display: 'flex', alignItems: 'center', height: '40px', cursor: 'pointer', opacity: (isApproaching || isOrigin) ? 1 : 0.7, transition: 'opacity 0.2s' }} onClick={() => {
                    if (mapRef.current) mapRef.current.flyTo(st.coords, 16);
                  }}>
                    <div style={{ width: '52px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5 }}>
                      <div style={{
                        width: isOrigin ? '14px' : '10px',
                        height: isOrigin ? '14px' : '10px',
                        backgroundColor: '#fff',
                        border: isOrigin ? `3px solid ${line.color}` : 'none',
                        borderRadius: '50%',
                        transition: 'all 0.3s',
                        transform: isApproaching && !isOrigin ? 'scale(1.3)' : (isOrigin ? 'scale(1.2)' : 'scale(1)'),
                        boxSizing: 'content-box',
                        boxShadow: isOrigin ? '0 0 8px rgba(255,255,255,0.5)' : 'none'
                      }}></div>
                    </div>
                    <div style={{ flex: 1, paddingLeft: '4px' }}>
                      <div style={{ fontSize: (isApproaching || isOrigin) ? '15px' : '14px', fontWeight: (isApproaching || isOrigin) ? 'bold' : 'normal', color: (isApproaching || isOrigin) ? '#fff' : '#e2e8f0', transition: 'all 0.2s' }}>
                        {st.name} {isOrigin && <span style={{ fontSize: '10px', backgroundColor: line.color, color: 'white', padding: '2px 4px', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>ORIGIN</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: isApproaching ? '#38bdf8' : (isOrigin ? '#fff' : '#94a3b8'), fontWeight: (isApproaching || isOrigin) ? 'bold' : 'normal' }}>
                      {etaText}
                    </div>
                  </div>
                );
              })
            })()}
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>


      {/* Top Sheet Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: '#1C2436',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        width: '92%',
        maxWidth: '400px',
        padding: '12px',
      }}>
        {/* Collapsible Top Section */}
        <div style={{
          maxHeight: isDragging ? Math.max(0, (isPanelCollapsed ? 0 : 250) + dragY) : (isPanelCollapsed ? 0 : 250),
          opacity: isDragging ? Math.min(1, Math.max(0.3, (isPanelCollapsed ? 0 : 1) + (dragY / 150))) : (isPanelCollapsed ? 0 : 1),
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%'
        }}>
          <div style={{ padding: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                MAP CONTROLS
              </label>
              <button
                onClick={() => setIsPanelCollapsed(true)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                aria-label="Collapse Panel"
              >
                <ChevronUp size={16} />
              </button>
            </div>

            {/* Toggle Station Names */}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                id="label-toggle"
                type="checkbox"
                checked={showAllLabels}
                onChange={(e) => setShowAllLabels(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#38bdf8' }}
              />
              <label
                htmlFor="label-toggle"
                style={{
                  color: '#f8fafc',
                  fontSize: '13px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Show Station Names
              </label>
            </div>



            {/* Toggle Live Vehicles */}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="liveVehiclesToggle"
                  checked={showLiveVehicles}
                  onChange={(e) => setShowLiveVehicles(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#38bdf8', width: '16px', height: '16px' }}
                />
                <label
                  htmlFor="liveVehiclesToggle"
                  style={{
                    color: '#f8fafc',
                    fontSize: '13px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  Show Live Vehicles
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <span>{vehicles.length} active vehicles</span>
              </div>
            </div>



            {/* Direction Filter */}

            {showLiveVehicles && (
              <div style={{ display: 'flex', backgroundColor: '#0f172a', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155', marginTop: '4px' }}>
                <button
                  onClick={() => setDirectionFilter('ALL')}
                  style={{ flex: 1, padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: directionFilter === 'ALL' ? '#3b82f6' : 'transparent', color: directionFilter === 'ALL' ? 'white' : '#94a3b8' }}
                >All</button>
                <button
                  onClick={() => setDirectionFilter('NB')}
                  style={{ flex: 1, padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', cursor: 'pointer', backgroundColor: directionFilter === 'NB' ? '#3b82f6' : 'transparent', color: directionFilter === 'NB' ? 'white' : '#94a3b8' }}
                >▲ NB/EB</button>
                <button
                  onClick={() => setDirectionFilter('SB')}
                  style={{ flex: 1, padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: directionFilter === 'SB' ? '#3b82f6' : 'transparent', color: directionFilter === 'SB' ? 'white' : '#94a3b8' }}
                >▼ SB/WB</button>
              </div>
            )}



            {/* Toggle Line View Button */}

            <button
              onClick={() => {
                if (!isLineViewOpen) {
                  setIsStationSelectionMode(true); // Open directly to selection wizard when launched globally
                }
                setIsLineViewOpen(prev => !prev);
              }}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '10px',
                backgroundColor: isLineViewOpen ? '#3b82f6' : '#0f172a',
                color: 'white',
                border: '1px solid #334155',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                transition: 'background 0.2s'
              }}
            >
              {isLineViewOpen ? 'Close Schematic' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Map size={16} /> Open Line View</span>}
            </button>

          </div>
        </div>


        {/* Transit Categories Row */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', padding: '0', justifyContent: 'center' }}>
          {/* Trains Dropdown */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: selectedLine === 'category-trains' || ['lrt-1', 'lrt-2', 'mrt-3', 'mrt-7', 'pnr-nscr', 'pnr-south', 'pnr-bicol'].includes(selectedLine) ? 'rgba(59, 130, 246, 0.2)' : '#0B1220',
              borderRadius: '9999px',
              border: selectedLine === 'category-trains' || ['lrt-1', 'lrt-2', 'mrt-3', 'mrt-7', 'pnr-nscr', 'pnr-south', 'pnr-bicol'].includes(selectedLine) ? '1px solid #3b82f6' : '1px solid rgba(51, 65, 85, 0.4)'
            }}>
              <button
                onClick={() => setExpandedDropdown(expandedDropdown === 'trains' ? null : 'trains')}
                style={{
                  background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 4px 6px 8px', display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronDown size={14} style={{ transform: expandedDropdown === 'trains' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <button
                onClick={() => {
                  const isDeselect = selectedLine === 'category-trains';
                  setSelectedLine(isDeselect ? 'all' : 'category-trains');
                  if (!isDeselect) zoomToLines(['lrt-1', 'lrt-2', 'mrt-3', 'mrt-7', 'pnr-nscr', 'pnr-south', 'pnr-bicol']);
                }}
                style={{
                  background: 'transparent', color: 'white', border: 'none', padding: '6px 12px 6px 4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}
              >
                Trains
              </button>
            </div>
            {expandedDropdown === 'trains' && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#1C2436', backdropFilter: 'blur(10px)',
                border: '1px solid #334155', borderRadius: '8px', padding: '6px', minWidth: '140px', zIndex: 1001, display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}>
                {transitLines.filter(l => ['lrt-1', 'lrt-2', 'mrt-3', 'mrt-7', 'pnr-nscr', 'pnr-south', 'pnr-bicol'].includes(l.id)).map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      const isDeselect = selectedLine === l.id;
                      setSelectedLine(isDeselect ? 'all' : l.id);
                      setExpandedDropdown(null);
                      if (!isDeselect) zoomToLines([l.id]);
                    }}
                    style={{
                      background: selectedLine === l.id ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '8px 10px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: selectedLine === l.id ? 'bold' : 'normal'
                    }}
                  >{l.name}</button>
                ))}
              </div>
            )}
          </div>

          {/* Buses Dropdown */}
          {/* Buses Dropdown */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: selectedLine === 'category-buses' || ['edsa-carousel', 'bgc-bus-west', 'bgc-bus-east-express', 'bgc-bus-north'].includes(selectedLine) ? 'rgba(59, 130, 246, 0.2)' : '#0B1220',
              borderRadius: '9999px',
              border: selectedLine === 'category-buses' || ['edsa-carousel', 'bgc-bus-west', 'bgc-bus-east-express', 'bgc-bus-north'].includes(selectedLine) ? '1px solid #3b82f6' : '1px solid rgba(51, 65, 85, 0.4)'
            }}>
              <button
                onClick={() => setExpandedDropdown(expandedDropdown === 'buses' ? null : 'buses')}
                style={{
                  background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '6px 4px 6px 8px', display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronDown size={14} style={{ transform: expandedDropdown === 'buses' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <button
                onClick={() => {
                  const isDeselect = selectedLine === 'category-buses';
                  setSelectedLine(isDeselect ? 'all' : 'category-buses');
                  if (!isDeselect) zoomToLines(['edsa-carousel', 'bgc-bus-west', 'bgc-bus-east-express', 'bgc-bus-north']);
                }}
                style={{
                  background: 'transparent', color: 'white', border: 'none', padding: '6px 12px 6px 4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}
              >
                Buses
              </button>
            </div>
            {expandedDropdown === 'buses' && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#1C2436', backdropFilter: 'blur(10px)',
                border: '1px solid #334155', borderRadius: '8px', padding: '6px', minWidth: '180px', zIndex: 1001, display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}>
                {transitLines.filter(l => ['edsa-carousel', 'bgc-bus-west', 'bgc-bus-east-express', 'bgc-bus-north'].includes(l.id)).map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      const isDeselect = selectedLine === l.id;
                      setSelectedLine(isDeselect ? 'all' : l.id);
                      setExpandedDropdown(null);
                      if (!isDeselect) zoomToLines([l.id]);
                    }}
                    style={{
                      background: selectedLine === l.id ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '8px 10px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: selectedLine === l.id ? 'bold' : 'normal'
                    }}
                  >{l.name}</button>
                ))}
              </div>
            )}
          </div>

          {/* Airplane Dropdown */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: (showAirports || showLiveAircraft) ? 'rgba(59, 130, 246, 0.2)' : '#0B1220',
              borderRadius: '9999px',
              border: (showAirports || showLiveAircraft) ? '1px solid #3b82f6' : '1px solid rgba(51, 65, 85, 0.4)'
            }}>
              <button
                onClick={() => setExpandedDropdown(expandedDropdown === 'airplane' ? null : 'airplane')}
                style={{
                  background: 'transparent', border: 'none', color: (showAirports || showLiveAircraft) ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '6px 4px 6px 8px', display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronDown size={14} style={{ transform: expandedDropdown === 'airplane' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <button
                onClick={() => {
                  const isDeselect = showAirports || showLiveAircraft;
                  setShowAirports(!isDeselect);
                  setShowLiveAircraft(!isDeselect);

                  if (!isDeselect && mapRef.current) {
                    const bounds = L.latLngBounds(philippineAirports.map(a => a.coords));
                    mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
                  }
                }}
                style={{
                  background: 'transparent', color: 'white', border: 'none', padding: '6px 12px 6px 4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}
              >
                Airplane
              </button>
            </div>
            {expandedDropdown === 'airplane' && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: '#1C2436', backdropFilter: 'blur(10px)',
                border: '1px solid #334155', borderRadius: '8px', padding: '6px', minWidth: '140px', zIndex: 1001, display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}>
                <button
                  onClick={() => setShowAirports(!showAirports)}
                  style={{
                    background: showAirports ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '8px 10px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: showAirports ? 'bold' : 'normal'
                  }}
                >Airports</button>
                <button
                  onClick={() => setShowLiveAircraft(!showLiveAircraft)}
                  style={{
                    background: showLiveAircraft ? '#3b82f6' : 'transparent', color: 'white', border: 'none', padding: '8px 10px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: showLiveAircraft ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >Live Aircraft
                  {showLiveAircraft && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />}
                </button>
              </div>
            )}
          </div>

          {/* Ships Dropdown */}
          {/* Ships Dropdown */}

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: showSeaports ? 'rgba(13, 148, 136, 0.2)' : '#0B1220',
              borderRadius: '9999px',
              border: showSeaports ? '1px solid #0d9488' : '1px solid rgba(51, 65, 85, 0.4)'
            }}>
              <button
                onClick={() => {
                  const nextState = !showSeaports;
                  setShowSeaports(nextState);
                  if (nextState && mapRef.current) {
                    const bounds = L.latLngBounds(philippineSeaports.map(s => s.coords));
                    mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
                  }
                }}
                style={{
                  background: 'transparent', border: 'none', color: showSeaports ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '6px 4px 6px 8px', display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => {
                  const nextState = !showSeaports;
                  setShowSeaports(nextState);
                  if (nextState && mapRef.current) {
                    const bounds = L.latLngBounds(philippineSeaports.map(s => s.coords));
                    mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
                  }
                }}
                style={{
                  background: 'transparent', color: 'white', border: 'none', padding: '6px 12px 6px 4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}
              >
                Ships
              </button>
            </div>
          </div>

        </div>


        {/* Drag Handle Area */}
        <div
          onMouseDown={(e) => { setIsDragging(true); dragType.current = 'mouse'; dragStartY.current = e.clientY; currentDragY.current = 0; setDragY(0); }}
          onTouchStart={(e) => { setIsDragging(true); dragType.current = 'touch'; dragStartY.current = e.touches[0].clientY; currentDragY.current = 0; setDragY(0); }}
          onTouchMove={(e) => {
            if (!isDragging) return;
            const deltaY = e.touches[0].clientY - dragStartY.current;
            currentDragY.current = deltaY;
            setDragY(deltaY);
          }}
          onTouchEnd={() => {
            setIsDragging(false);
            if (isPanelCollapsed && currentDragY.current > 40) setIsPanelCollapsed(false);
            else if (!isPanelCollapsed && currentDragY.current < -40) setIsPanelCollapsed(true);
            setDragY(0);
          }}
          style={{ width: '100%', padding: '8px 0 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
          <div style={{ width: '40px', height: '4px', backgroundColor: '#475569', borderRadius: '2px' }} />
        </div>
      </div>

      <style>{`
        .dark-station-tooltip {
          background-color: rgba(30, 41, 59, 0.95);
          border: 1px solid #334155;
          color: #f8fafc;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
          white-space: nowrap;
        }
        .dark-station-tooltip::before {
          border-top-color: rgba(30, 41, 59, 0.95);
        }
        .vehicle-pulse {
          animation: vehicle-pulse-anim 1.5s infinite;
        }
        @keyframes vehicle-pulse-anim {
          0% { transform: scale(1); box-shadow: 0 0 0 0px rgba(255,255,255,0.7); }
          50% { transform: scale(1.2); box-shadow: 0 0 0 6px rgba(255,255,255,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0px rgba(255,255,255,0); }
        }
        .custom-station-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          background-color: #1e293b;
          color: #f8fafc;
          box-shadow: 0 8px 16px rgba(0,0,0,0.5);
        }
        .custom-station-popup .leaflet-popup-content {
          margin: 12px;
        }
        .custom-station-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          margin-top: 6px;
          margin-right: 6px;
          font-size: 16px;
        }
      `}</style>

      <div style={{
        position: 'absolute',
        top: 0,
        left: isLineViewOpen ? 0 : '-380px',
        width: '380px',
        height: '100%',
        backgroundColor: '#0f172a',
        boxShadow: '4px 0 15px rgba(0,0,0,0.5)',
        zIndex: 2000,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        borderRight: '1px solid #1e293b'
      }}>
        {isLineViewOpen && (isStationSelectionMode ? renderStationSelectionPrompt() : renderLineViewContent())}
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
        {isOsrmLoading && (
          <div style={{
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155'
          }}>
            <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
            Loading map routes...
          </div>
        )}
      </div>

      <MapContainer
        ref={mapRef}
        center={[14.6500, 121.0300]}
        zoom={11}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#1e293b' }}
      >
        <MapResizer />
        {/* Dark mode tiles using CartoDB Dark Matter */}
        <style>{`
          .leaflet-tile {
            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important;
            -webkit-filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) !important;
          }
        `}</style>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {transitLines.map((line) => {
          const isSelected = selectedLine === 'all' || selectedLine === line.id ||
            (selectedLine === 'category-trains' && ['lrt-1', 'lrt-2', 'mrt-3', 'mrt-7', 'pnr-nscr', 'pnr-south', 'pnr-bicol'].includes(line.id)) ||
            (selectedLine === 'category-buses' && ['edsa-carousel', 'bgc-bus-west', 'bgc-bus-east-express', 'bgc-bus-north'].includes(line.id));
          const isFaded = selectedLine !== 'all' && !isSelected;

          const lineColor = isFaded ? '#4A5568' : line.color;
          const lineWeight = isFaded ? 3 : 5;
          const lineOpacity = isFaded ? 0.35 : (line.isUnderConstruction ? 0.5 : 1.0);
          const markerOpacity = isFaded ? 0.3 : (line.isUnderConstruction ? 0.6 : 1.0);

          return (
            <React.Fragment key={line.id}>
              {/* Render the polyline path */}
              {line.id === 'pasig-ferry' ? (
                pasigFerryData && (
                  <GeoJSON
                    data={pasigFerryData}
                    style={{
                      color: lineColor,
                      weight: lineWeight,
                      opacity: lineOpacity
                    }}
                  />
                )
              ) : line.segments ? (
                line.segments.map((segment, sIdx) => (
                  <Polyline
                    key={`${line.id}-seg-${sIdx}`}
                    positions={segment.stations.map((s) => s.coords)}
                    pathOptions={{
                      color: lineColor,
                      weight: lineWeight,
                      opacity: lineOpacity,
                      dashArray: (segment.isDashed || line.isUnderConstruction) ? '6, 8' : undefined
                    }}
                  />
                ))
              ) : (
                <Polyline
                  positions={osrmPaths[line.id] || line.path || line.stations.map((s) => s.coords)}
                  pathOptions={{
                    color: lineColor,
                    weight: lineWeight,
                    opacity: lineOpacity,
                    dashArray: line.isUnderConstruction ? '6, 8' : undefined
                  }}
                />
              )}

              {/* Render the station markers */}
              {(line.id === 'pasig-ferry' ? (snappedFerryStations || []) : line.stations)
                .filter(s => !s.isVia)
                .map((station, idx) => (
                  <CircleMarker
                    key={`${line.id}-${idx}-${showAllLabels}-${isFaded}`}
                    center={station.coords}
                    radius={5}
                    pathOptions={{
                      color: isFaded ? '#4A5568' : '#ffffff', // white border if active, grey if muted
                      opacity: markerOpacity,
                      fillColor: lineColor,
                      fillOpacity: markerOpacity,
                      weight: 2
                    }}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -5]}
                      permanent={showAllLabels && !isFaded}
                      className="dark-station-tooltip"
                      key={`tooltip-${showAllLabels}-${isFaded}`}
                    >
                      <span style={{ color: line.color, fontWeight: 'bold' }}>
                        {station.name}
                      </span>
                    </Tooltip>
                    <Popup minWidth={220} className="custom-station-popup">
                      <div style={{ padding: '4px', fontFamily: 'sans-serif' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>
                            {station.name}
                          </h3>
                          <span style={{
                            backgroundColor: line.color,
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            letterSpacing: '0.5px'
                          }}>
                            {line.id.toUpperCase()}
                          </span>
                          {(line.id === 'pnr-south' || line.id === 'pnr-bicol') && (
                            <span style={{ backgroundColor: '#22c55e', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                              Operational
                            </span>
                          )}
                        </div>

                        {/* Status / Arrivals */}
                        {line.isUnderConstruction ? (
                          <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#431407', borderRadius: '6px', textAlign: 'center', border: '1px solid #7c2d12' }}>
                            <span style={{ color: '#fdba74', fontWeight: 'bold', fontSize: '13px' }}>Under Construction</span>
                            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#fed7aa', lineHeight: '1.4' }}>
                              {line.id === 'pnr-nscr'
                                ? 'Operations suspended due to North-South Commuter Railway (NSCR) construction.'
                                : 'Operations for this line are pending construction completion.'}
                            </p>
                          </div>
                        ) : isSystemActive() ? (() => {
                          let isLineActive = true;
                          const hours = getSimulatedTime().getHours();
                          const minutes = getSimulatedTime().getMinutes();
                          const timeVal = hours + minutes / 60;
                          if (line.id === 'pnr-south' && (timeVal < 5 || timeVal > 18.5)) isLineActive = false;
                          if (line.id === 'pnr-bicol' && (timeVal < 4.5 || timeVal > 17.16)) isLineActive = false;

                          if (!isLineActive) {
                            return (
                              <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', textAlign: 'center', border: '1px solid #334155' }}>
                                <span style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '13px' }}>Off Hours</span>
                                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                                  Train operations run between specific hours.
                                </p>
                              </div>
                            );
                          }

                          const arrivals = getUpcomingArrivals(line.id, idx);
                          if (!arrivals) return null;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                              {idx < line.stations.length - 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '6px', opacity: (directionFilter === 'NB' ? 0.3 : 1), transition: 'opacity 0.2s' }}>
                                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>To <strong>{arrivals.forwardName}</strong></span>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: line.color }}>{formatArrivalTime(arrivals.forwardMins)}</span>
                                </div>
                              )}
                              {idx > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '6px', opacity: (directionFilter === 'SB' ? 0.3 : 1), transition: 'opacity 0.2s' }}>
                                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>To <strong>{arrivals.backwardName}</strong></span>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: line.color }}>{formatArrivalTime(arrivals.backwardMins)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })() : (
                          <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '6px', textAlign: 'center' }}>
                            <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>Service Closed</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!line.isUnderConstruction && isSystemActive() && (() => {
                          let isLineActive = true;
                          const hours = getSimulatedTime().getHours();
                          const minutes = getSimulatedTime().getMinutes();
                          const timeVal = hours + minutes / 60;
                          if (line.id === 'pnr-south' && (timeVal < 5 || timeVal > 18.5)) isLineActive = false;
                          if (line.id === 'pnr-bicol' && (timeVal < 4.5 || timeVal > 17.16)) isLineActive = false;

                          if (!isLineActive) return null;

                          return (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              {idx < line.stations.length - 1 && (
                                <button
                                  onClick={() => {
                                    setLineViewConfig({ lineId: line.id, isForward: true, originStationIdx: idx });
                                    setIsLineViewOpen(true);
                                    setShowPastStations(false);
                                  }}
                                  style={{ flex: 1, padding: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  ▼ {line.id === 'lrt-2' || line.id === 'pasig-ferry' ? 'Eastbound' : 'Southbound'}
                                </button>
                              )}
                              {idx > 0 && (
                                <button
                                  onClick={() => {
                                    setLineViewConfig({ lineId: line.id, isForward: false, originStationIdx: idx });
                                    setIsLineViewOpen(true);
                                    setShowPastStations(false);
                                  }}
                                  style={{ flex: 1, padding: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  ▲ {line.id === 'lrt-2' || line.id === 'pasig-ferry' ? 'Westbound' : 'Northbound'}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                        {/* Notification Toggle */}
                        {!line.isUnderConstruction && (
                          <>
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0' }}>Notify me when approaching</span>
                                {notificationPermission === 'denied' && (
                                  <span style={{ fontSize: '10px', color: '#ef4444' }}>Notifications blocked by browser</span>
                                )}
                              </div>
                              <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                                <input
                                  type="checkbox"
                                  checked={!!watchedStations[`${line.id}_${station.name}`]}
                                  onChange={() => handleToggleWatch(`${line.id}_${station.name}`)}
                                  style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                  backgroundColor: watchedStations[`${line.id}_${station.name}`] ? '#10b981' : '#475569',
                                  transition: '.4s', borderRadius: '20px'
                                }}>
                                  <span style={{
                                    position: 'absolute', content: '""', height: '14px', width: '14px', left: '3px', bottom: '3px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                    transform: watchedStations[`${line.id}_${station.name}`] ? 'translateX(16px)' : 'none'
                                  }} />
                                </span>
                              </label>
                            </div>
                            {/* SMS Toggle */}
                            {watchedStations[`${line.id}_${station.name}`] && (
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>Also notify me via SMS</span>
                                  {!userPhone && (
                                    <span style={{ fontSize: '9px', color: '#f59e0b', marginTop: '2px' }}>Set your phone number in Account Profile</span>
                                  )}
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '28px', height: '16px', opacity: userPhone ? 1 : 0.5 }}>
                                  <input
                                    type="checkbox"
                                    disabled={!userPhone}
                                    checked={!!watchedStationsSms[`${line.id}_${station.name}`]}
                                    onChange={() => handleToggleSmsWatch(`${line.id}_${station.name}`)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                  />
                                  <span style={{
                                    position: 'absolute', cursor: userPhone ? 'pointer' : 'not-allowed', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: watchedStationsSms[`${line.id}_${station.name}`] && userPhone ? '#3b82f6' : '#475569',
                                    transition: '.4s', borderRadius: '16px'
                                  }}>
                                    <span style={{
                                      position: 'absolute', content: '""', height: '10px', width: '10px', left: '3px', bottom: '3px',
                                      backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                      transform: watchedStationsSms[`${line.id}_${station.name}`] && userPhone ? 'translateX(12px)' : 'none'
                                    }} />
                                  </span>
                                </label>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

              {/* Render Live Vehicles */}
              {showLiveVehicles && vehicles.filter(v => {
                if (v.lineId !== line.id) return false;
                if (directionFilter === 'ALL') return true;

                let dirCode = 'NB';
                if (v.headingText.includes('Southbound')) dirCode = 'SB';
                else if (v.headingText.includes('Eastbound')) dirCode = 'EB';
                else if (v.headingText.includes('Westbound')) dirCode = 'WB';

                if (directionFilter === 'NB' && (dirCode === 'NB' || dirCode === 'EB')) return true;
                if (directionFilter === 'SB' && (dirCode === 'SB' || dirCode === 'WB')) return true;
                return false;
              }).map(v => {
                const M = line.stations.length - 1;
                let nextIdx = v.isForward
                  ? Math.floor(v.logicalFraction * M) + 1
                  : Math.ceil(v.logicalFraction * M) - 1;

                if (nextIdx > M) nextIdx = M;
                if (nextIdx < 0) nextIdx = 0;

                const stops: { name: string, etaMs: number }[] = [];
                const dir = v.isForward ? 1 : -1;
                let idxWalker = nextIdx;

                while (idxWalker >= 0 && idxWalker <= M && stops.length < 4) {
                  const msFromNext = idxWalker === nextIdx ? 0 : getTravelTimeMs(line.id, nextIdx, idxWalker, v.isForward);
                  stops.push({ name: (line.id === 'pasig-ferry' && snappedFerryStations ? snappedFerryStations[idxWalker].name : line.stations[idxWalker].name), etaMs: v.nextStationEtaMs + msFromNext });
                  idxWalker += dir;
                }

                // Speed calc
                let baseSpeed = 45;
                if (line.id.includes('pnr')) baseSpeed = 65;
                else if (line.id === 'pasig-ferry') baseSpeed = 22;

                // Add tiny deterministic variance based on ID string
                let hash = 0;
                for (let i = 0; i < v.id.length; i++) hash = (hash << 5) - hash + v.id.charCodeAt(i);
                const variance = Math.abs(hash) % 10 - 5;
                const speed = v.isDwelling ? 0 : baseSpeed + variance;

                return (
                  <Marker
                    key={`vehicle-${v.lineId}-${v.id}-${v.isForward ? 'FWD' : 'BWD'}`}
                    position={v.coords}
                    icon={createVehicleIcon(line.id, line.color, isFaded, v.headingText)}
                    zIndexOffset={1000}
                  >
                    <Tooltip direction="top" offset={[0, -15]} className="dark-station-tooltip">
                      <span style={{ color: line.color, fontWeight: 'bold', fontSize: '12px' }}>
                        {line.name.split(' ')[0]} • {v.headingText}
                      </span>
                      <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: '11px', marginLeft: '6px' }}>
                        (Bound for {v.boundFor})
                      </span><br />
                      <span style={{ color: '#e2e8f0', fontWeight: 'normal', fontSize: '11px', marginTop: '4px', display: 'inline-block' }}>
                        {v.statusText}
                      </span>
                    </Tooltip>
                    <Popup minWidth={260} className="custom-station-popup">
                      <div style={{ padding: '2px', fontFamily: 'sans-serif', color: '#f8fafc' }}>
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>
                              {line.type === 'bus' ? 'Bus Details' : line.type === 'ferry' ? 'Ferry Details' : 'Train Details'}
                            </h3>
                            <span style={{ backgroundColor: line.color, color: '#fff', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                              {line.id.toUpperCase()}
                            </span>
                          </div>
                          <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', border: '1px solid #334155' }}>
                            PREDICTED
                          </span>
                        </div>

                        {/* Next Stops Block */}
                        {stops.length > 0 && (
                          <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px', marginBottom: '12px', border: '1px solid #1e293b' }}>
                            {/* Primary Stop */}
                            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '8px', marginBottom: '8px' }}>
                              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Next Stop</div>
                              <div style={{ fontSize: '15px', fontWeight: 'bold', color: line.color }}>
                                {stops[0].etaMs < 60000
                                  ? `${Math.floor(stops[0].etaMs / 1000)} sec to ${stops[0].name}`
                                  : `${formatArrivalTime(Math.ceil(stops[0].etaMs / 60000))} to ${stops[0].name}`}
                              </div>
                            </div>

                            {/* Subsequent Stops */}
                            {stops.length > 1 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {stops.slice(1).map((s, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#cbd5e1' }}>
                                    <span style={{ color: '#475569', marginRight: '8px' }}>•</span>
                                    <span>{formatArrivalTime(Math.ceil(s.etaMs / 60000))} to <strong>{s.name}</strong></span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Telemetry Grid */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          {line.type !== 'ferry' && (
                            <div style={{ flex: 1, backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}>SPEED</div>
                              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{speed} km/h</div>
                            </div>
                          )}
                          <div style={{ flex: 1, backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}>DIRECTION</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{v.headingText.split(' ')[0]}</div>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                          <span>INFO</span>
                          <span>Last Update: <strong>Just now</strong></span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </React.Fragment>
          );
        })}
        {/* Live Aircraft */}
        {showLiveAircraft && liveAircraft.map((plane, idx) => (
          <Marker
            key={`plane-${plane.icao24}-${idx}`}
            position={[plane.latitude, plane.longitude]}
            icon={L.divIcon({
              className: 'live-aircraft-icon',
              html: `<div style="transform: rotate(${plane.true_track || 0}deg); color: #38bdf8; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.5)); display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.5l-1.35 1.35c-.2.2-.2.6 0 .8L9 12l-4.5 4.5-3.1-.8c-.4-.1-.8.2-1 .5L0 16.5c-.2.2-.2.6 0 .8l4.5 2 2 4.5c.2.2.6.2.8 0l.3-.3c.3-.2.6-.6.5-1l-.8-3.1 4.5-4.5 3.2 6.6c.2.5.6.5.8 0l1.35-1.35c.3-.3.6-.7.5-1.1z"/></svg>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}
          >
            <Popup minWidth={220} className="custom-station-popup">
              <AircraftPopupInfo plane={plane} />
            </Popup>
          </Marker>
        ))}

        {showAirports && philippineAirports.map((airport, idx) => (
          <Marker
            key={`airport-${idx}`}
            position={airport.coords}
            icon={airportIcon}
          >
            <Popup className="custom-station-popup">
              <div style={{ padding: '4px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', marginBottom: '4px' }}>
                  {airport.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  IATA: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{airport.iata}</span> &bull;
                  ICAO: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{airport.icao}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {showSeaports && philippineSeaports.map((seaport, idx) => (
          <Marker
            key={`seaport-${idx}`}
            position={seaport.coords}
            icon={seaportIcon}
          >
            <Popup className="custom-station-popup">
              <div style={{ padding: '4px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', marginBottom: '4px' }}>
                  {seaport.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  LOCODE: <span style={{ fontWeight: 'bold', color: '#0d9488' }}>{seaport.locode}</span> &bull;
                  Region: <span style={{ fontWeight: 'bold', color: '#0d9488' }}>{seaport.region}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {showCarouselBanner && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          backgroundColor: '#1E293B',
          borderLeft: '4px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#FFFFFF'
        }}>
          <div style={{ fontSize: '20px' }}>🚍</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Next EDSA Carousel in 5 Mins</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Trinoma &rarr; Main Ave</div>
          </div>
        </div>
      )}
    </div>
  );
}
