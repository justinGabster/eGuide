'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip, GeoJSON, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { transitLines } from './transitData';
import { LINE_CONFIGS, isPeakHour } from './duration_matrix';
import { getLineRoundTripMs, getVehiclePosition, getTravelTimeMs } from './physicsEngine';

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

export default function MapComponent() {
  // Center map around Metro Manila
  const position: [number, number] = [14.6091, 121.0223]; 

  const [pasigFerryData, setPasigFerryData] = useState<any>(null);
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [showAllLabels, setShowAllLabels] = useState<boolean>(false);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'NB' | 'SB'>('ALL');
  const [vehicles, setVehicles] = useState<VehicleState[]>([]);
  const [showLiveVehicles, setShowLiveVehicles] = useState<boolean>(true);
  const [showPastStations, setShowPastStations] = useState<boolean>(false);
  const [isStationSelectionMode, setIsStationSelectionMode] = useState<boolean>(true);

  const [lineViewConfig, setLineViewConfig] = useState<{
    lineId: string;
    isForward: boolean;
    originStationIdx?: number;
    selectedVehicleId?: string;
  }>({ lineId: 'mrt-3', isForward: true });
  
  const [isLineViewOpen, setIsLineViewOpen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Force re-render periodically for simulation
  const [tick, setTick] = useState(0);

  const mapRef = useRef<any>(null);

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

  const linePaths = useMemo(() => {
    const paths: Record<string, any> = {};
    transitLines.forEach(line => {
      let points: [number, number][] = [];
      let totalDist = 0;
      let dists: number[] = [0];

      if (line.path) {
         points = line.path;
      } else {
         line.stations.forEach(st => points.push(st.coords));
      }

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i-1];
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

      paths[line.id] = { points, totalDist, dists, stationDists };
    });
    return paths;
  }, []);

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
        if (line.id === 'pnr-nscr') return;
        
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

          const startDist = pathInfo.stationDists[pos.startStationIdx];
          const endDist = pathInfo.stationDists[pos.endStationIdx];
          
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
          const isEastWest = line.id === 'lrt-2' || isFerry;
          
          let headingText = pos.isForward ? 'Southbound' : 'Northbound';
          if (isFerry) {
            headingText = pos.isForward ? 'Upstream (Eastbound)' : 'Downstream (Westbound)';
          } else if (isEastWest) {
            headingText = pos.isForward ? 'Eastbound' : 'Westbound';
          }

          const startName = line.stations[pos.startStationIdx].name;
          const endName = line.stations[pos.endStationIdx].name;
          const boundFor = pos.isForward ? line.stations[M].name : line.stations[0].name;

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
    const isTrain = ['lrt-1', 'lrt-2', 'mrt-3', 'pnr-south', 'pnr-bicol'].includes(lineId);
    const isFerry = lineId === 'pasig-ferry';
    
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

    if (isTrain || isFerry) {
      const trainSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16px" height="16px" style="z-index: 2; position: relative; margin-top: 1px"><path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2.23v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm6 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z"/></svg>`;
      const ferrySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16px" height="16px" style="z-index: 2; position: relative; margin-top: 1px"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`;
      const iconSvg = isFerry ? ferrySvg : trainSvg;

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
      forwardName: line.stations[M].name,
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
             if (line.id === 'pnr-nscr') return;
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
      <div style={{ padding: '24px 20px 40px 20px', color: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', backgroundColor: '#0f172a', overflowY: 'auto' }}>
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
          📍 Use My Location
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
              onChange={e => setLineViewConfig(c => ({...c, lineId: e.target.value, originStationIdx: 0}))}
              style={{ width: '100%', padding: '12px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            >
              {transitLines.filter(l => l.id !== 'pnr-nscr').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>ORIGIN STATION</label>
            <select 
              value={lineViewConfig.originStationIdx || 0} 
              onChange={e => setLineViewConfig(c => ({...c, originStationIdx: parseInt(e.target.value)}))}
              style={{ width: '100%', padding: '12px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            >
              {activeLine.stations.map((s, idx) => <option key={idx} value={idx}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TRAVEL DIRECTION</label>
            <div style={{ display: 'flex', backgroundColor: '#1e293b', borderRadius: '6px', padding: '4px', border: '1px solid #334155' }}>
               <button 
                  onClick={() => setLineViewConfig(c => ({...c, isForward: true}))}
                  style={{ flex: 1, padding: '10px', border: 'none', background: lineViewConfig.isForward ? '#3b82f6' : 'transparent', color: lineViewConfig.isForward ? 'white' : '#94a3b8', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'background 0.2s' }}
               >{activeLine.id === 'lrt-2' || activeLine.id === 'pasig-ferry' ? 'Eastbound' : 'Southbound'}</button>
               <button 
                  onClick={() => setLineViewConfig(c => ({...c, isForward: false}))}
                  style={{ flex: 1, padding: '10px', border: 'none', background: !lineViewConfig.isForward ? '#3b82f6' : 'transparent', color: !lineViewConfig.isForward ? 'white' : '#94a3b8', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'background 0.2s' }}
               >{activeLine.id === 'lrt-2' || activeLine.id === 'pasig-ferry' ? 'Westbound' : 'Northbound'}</button>
            </div>
          </div>

          <div style={{ position: 'sticky', bottom: '-20px', backgroundColor: '#0f172a', paddingTop: '10px', paddingBottom: '10px', marginTop: 'auto', zIndex: 10 }}>
            <button 
              onClick={() => {
                 if (lineViewConfig.originStationIdx === undefined) {
                   setLineViewConfig(c => ({...c, originStationIdx: 0}));
                 }
                 setIsStationSelectionMode(false);
                 setShowPastStations(false);
              }}
              style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 -4px 10px rgba(0,0,0,0.2)' }}
            >
              View Line Schedule &rarr;
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

    let stations = line.stations;
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
                        onClick={() => setLineViewConfig(c => ({...c, selectedVehicleId: dep.vehicleId}))}
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
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.93V3c0-1.1-.9-2-2-2h-1c-1.1 0-2 .9-2 2v2h-1V3c0-1.1-.9-2-2-2H9C7.9 0 7 .9 7 2v5H6V3c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v7.93l-1.29.11c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM11 2h2v4h-2V2z"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm4 0V6h5v4h-5zm1.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                        }
                      </div>
                    </div>
                  );
               })}
            </div>
            
            {renderStations.map((st, i) => {
              const globalRenderIdx = hiddenCount + i;
              const originalIdx = lineViewConfig.isForward ? globalRenderIdx : (stations.length - 1 - globalRenderIdx);
              
              let etaText = '---';
              
              if (isContextual && selectedDep) {
                 const originOriginalIdx = lineViewConfig.isForward ? originRenderIdx : (stations.length - 1 - originRenderIdx);
                 const msDiff = getTravelTimeMs(line.id, originOriginalIdx, originalIdx, lineViewConfig.isForward);
                 const stationEtaMs = selectedDep.etaMs + msDiff;
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
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* Filter Control Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        transition: 'all 0.3s ease-in-out',
        width: isPanelCollapsed ? 'auto' : '260px'
      }}>
        <label htmlFor="line-filter" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          HIGHLIGHT LINE
        </label>
        <select 
          id="line-filter"
          value={selectedLine}
          onChange={(e) => setSelectedLine(e.target.value)}
          style={{
            background: '#F4F6F9',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Lines</option>
          {transitLines.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        {/* Toggle Station Names */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
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
              color: 'var(--text-primary)', 
              fontSize: '13px', 
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'white'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
            aria-label="Toggle Panel"
          >
            {isPanelCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {!isPanelCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            <select 
              id="line-filter"
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <option value="all">All Lines</option>
              {transitLines.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            
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
              
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                🟢 {vehicles.filter(v => ['lrt-1', 'lrt-2', 'mrt-3'].includes(v.lineId)).length} active trains
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
              {isLineViewOpen ? 'Close Schematic' : '🗺️ Open Line View'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .light-station-tooltip {
          background-color: rgba(255, 255, 255, 0.95);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          white-space: nowrap;
        }
        .light-station-tooltip::before {
          border-top-color: rgba(255, 255, 255, 0.95);
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
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
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

      <MapContainer 
        ref={mapRef}
        center={position} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', background: 'var(--bg-color)' }}
      >
        {/* Light mode tiles using CartoDB Light Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {transitLines.map((line) => {
          const isSelected = selectedLine === 'all' || selectedLine === line.id;
          const isFaded = selectedLine !== 'all' && selectedLine !== line.id;

          const lineColor = isFaded ? '#4A5568' : line.color;
          const lineWeight = isFaded ? 3 : 5;
          const lineOpacity = isFaded ? 0.35 : (line.id === 'pnr' ? 0.5 : 1.0);
          const markerOpacity = isFaded ? 0.3 : (line.id === 'pnr' ? 0.6 : 1.0);

          return (
            <div key={line.id}>
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
                      dashArray: (segment.isDashed || line.id === 'pnr') ? '6, 8' : undefined
                    }}
                  />
                ))
              ) : (
                <Polyline 
                  positions={line.path || line.stations.map((s) => s.coords)}
                  pathOptions={{ 
                    color: lineColor, 
                    weight: lineWeight,
                    opacity: lineOpacity,
                    dashArray: line.id === 'pnr' ? '6, 8' : undefined
                  }}
                />
              )}
              
              {/* Render the station markers */}
              {(line.id === 'pasig-ferry' ? (snappedFerryStations || []) : line.stations).map((station, idx) => (
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
                    className="light-station-tooltip"
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
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
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
                      {line.id === 'pnr-nscr' ? (
                        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#fff7ed', borderRadius: '6px', textAlign: 'center', border: '1px solid #fdba74' }}>
                          <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '13px' }}>Suspended / Under Renovation</span>
                          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9a3412', lineHeight: '1.4' }}>
                            Operations suspended due to North-South Commuter Railway (NSCR) construction.
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
                            <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '6px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                              <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '13px' }}>Off Hours</span>
                              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', opacity: (directionFilter === 'NB' ? 0.3 : 1), transition: 'opacity 0.2s' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>To <strong>{arrivals.forwardName}</strong></span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: line.color }}>{formatArrivalTime(arrivals.forwardMins)}</span>
                              </div>
                            )}
                            {idx > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', opacity: (directionFilter === 'SB' ? 0.3 : 1), transition: 'opacity 0.2s' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>To <strong>{arrivals.backwardName}</strong></span>
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
                      {line.id !== 'pnr-nscr' && isSystemActive() && (() => {
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
                      </span><br/>
                      <span style={{ color: '#e2e8f0', fontWeight: 'normal', fontSize: '11px', marginTop: '4px', display: 'inline-block' }}>
                        {v.statusText}
                      </span>
                    </Tooltip>
                    <Popup minWidth={260} className="custom-station-popup">
                      <div style={{ padding: '2px', fontFamily: 'sans-serif', color: '#f8fafc' }}>
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                              {line.id === 'pasig-ferry' ? 'Ferry Details' : 'Train Details'}
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
                          <div style={{ flex: 1, backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}>SPEED</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{speed} km/h</div>
                          </div>
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
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
