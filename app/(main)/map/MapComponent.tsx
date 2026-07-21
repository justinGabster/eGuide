'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip, GeoJSON, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { transitLines } from './transitData';

interface VehicleState {
  id: string;
  lineId: string;
  num: number;
  coords: [number, number];
  statusText: string;
  boundFor: string;
  headingText: string;
  angle: number;
}

export default function MapComponent() {
  // Center map around Metro Manila
  const position: [number, number] = [14.6091, 121.0223]; 

  const [pasigFerryData, setPasigFerryData] = useState<any>(null);
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [showAllLabels, setShowAllLabels] = useState<boolean>(false);
  const [showLiveVehicles, setShowLiveVehicles] = useState<boolean>(true);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'NB' | 'SB'>('ALL');
  const [vehicles, setVehicles] = useState<VehicleState[]>([]);

  useEffect(() => {
    fetch('/data/pasig-ferry.json')
      .then(res => res.json())
      .then(data => setPasigFerryData(data))
      .catch(err => console.error('Failed to load ferry GeoJSON:', err));
  }, []);

  // Pre-calculate exact distance of stations along their polylines
  const linePaths = useMemo(() => {
    const distSq = (p1: [number, number], p2: [number, number]) => {
      const dLat = p1[0] - p2[0];
      const dLng = p1[1] - p2[1];
      return dLat * dLat + dLng * dLng;
    };

    const paths: Record<string, { 
      points: [number, number][], 
      totalDist: number, 
      dists: number[],
      stationDists: number[]
    }> = {};

    transitLines.forEach(line => {
      const points = line.path || line.stations.map(s => s.coords);
      let totalDist = 0;
      const dists = [0];
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const d = Math.sqrt(distSq(p1, p2));
        totalDist += d;
        dists.push(totalDist);
      }

      // Map each station to its exact distance along polyline
      const stationDists = line.stations.map(st => {
        let nearestDist = 0;
        let minSq = Infinity;
        points.forEach((p, idx) => {
          const d = distSq(st.coords, p);
          if (d < minSq) {
            minSq = d;
            nearestDist = dists[idx];
          }
        });
        return nearestDist;
      });

      paths[line.id] = { points, totalDist, dists, stationDists };
    });
    return paths;
  }, []);

  // TEMPORARY TESTING OVERRIDE (Comment out for production):
  // Set time to 7:15 AM today to test morning rush hour train movement & arrival ETAs
  const getSimulatedTime = () => {
    const testDate = new Date();
    testDate.setHours(7, 15, 0, 0);
    // return new Date(); // Production
    return testDate;      // Development Override
  };

  const isSystemActive = () => {
    const now = getSimulatedTime();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const time = hours + mins / 60;
    // 4:30 AM = 4.5, 10:00 PM = 22.0
    return time >= 4.5 && time < 22.0;
  };

  // Global Vehicle Specs
  const vehicleSpecs = useMemo(() => {
    const specs: { id: string, lineId: string, offsetMs: number, num: number }[] = [];
    transitLines.forEach(line => {
      const M = line.stations.length - 1;
      if (M <= 0 || line.id === 'pnr-nscr') return;
      
      let TOTAL_LEG_MS = 150000;
      let SPAWN_INTERVAL = 420000; // 7 mins

      if (line.id === 'pnr-south') {
        TOTAL_LEG_MS = 3000000; // 50 mins
        SPAWN_INTERVAL = 3600000; // 60 mins
      } else if (line.id === 'pnr-bicol') {
        TOTAL_LEG_MS = 2700000; // 45 mins
        SPAWN_INTERVAL = 3600000; // 60 mins
      }

      const DWELL_MS = 20000;
      const LEG_CYCLE = TOTAL_LEG_MS + DWELL_MS;
      const ROUND_TRIP_MS = 2 * M * LEG_CYCLE;
      
      let offset = 0;
      let num = 1;
      while (offset < ROUND_TRIP_MS) {
        specs.push({
          id: `${line.id}-v${num}`,
          lineId: line.id,
          offsetMs: offset,
          num: num
        });
        offset += SPAWN_INTERVAL;
        num++;
      }
    });
    return specs;
  }, []);

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
      
      const now = getSimulatedTime().getTime();
      const newVehicles: VehicleState[] = vehicleSpecs.map(spec => {
        const line = transitLines.find(l => l.id === spec.lineId)!;
        // Skip suspended PNR line
        if (line.id === 'pnr-nscr') return null;

        let TOTAL_LEG_MS = 150000;
        if (line.id === 'pnr-south') TOTAL_LEG_MS = 3000000; // 50 mins
        else if (line.id === 'pnr-bicol') TOTAL_LEG_MS = 2700000; // 45 mins
        const DWELL_MS = 20000;
        const LEG_CYCLE = TOTAL_LEG_MS + DWELL_MS;

        const pathInfo = linePaths[spec.lineId];
        if (!pathInfo) return null;

        const M = line.stations.length - 1;
        const ROUND_TRIP_MS = 2 * M * LEG_CYCLE;
        const t = (now + spec.offsetMs) % ROUND_TRIP_MS;

        const legIndex = Math.floor(t / LEG_CYCLE);
        const legTime = t % LEG_CYCLE;

        let startStationIdx = 0;
        let endStationIdx = 0;
        let isDwelling = false;
        let progress = 0;

        if (legIndex < M) {
          startStationIdx = legIndex;
          endStationIdx = legIndex + 1;
        } else {
          const k = legIndex - M;
          startStationIdx = M - k;
          endStationIdx = M - k - 1;
        }

        if (legTime < DWELL_MS) {
          isDwelling = true;
          progress = 0;
        } else {
          isDwelling = false;
          progress = (legTime - DWELL_MS) / TOTAL_LEG_MS;
        }

        const startDist = pathInfo.stationDists[startStationIdx];
        const endDist = pathInfo.stationDists[endStationIdx];
        const currentDist = startDist + (endDist - startDist) * progress;

        // Get exact coordinates from currentDist along the polyline
        let baseCoords: [number, number] = pathInfo.points[0];
        let p0 = pathInfo.points[0];
        let p1 = pathInfo.points[0];
        for (let i = 1; i < pathInfo.dists.length; i++) {
          if (pathInfo.dists[i] >= currentDist || i === pathInfo.dists.length - 1) {
            const d0 = pathInfo.dists[i - 1];
            const d1 = pathInfo.dists[i];
            const fraction = d1 === d0 ? 0 : (currentDist - d0) / (d1 - d0);
            p0 = pathInfo.points[i - 1];
            p1 = pathInfo.points[i];
            baseCoords = [
              p0[0] + (p1[0] - p0[0]) * fraction,
              p0[1] + (p1[1] - p0[1]) * fraction
            ];
            break;
          }
        }

        const isForward = legIndex < M;
        
        let dLat = p1[0] - p0[0];
        let dLng = p1[1] - p0[1];
        if (!isForward) {
          dLat = p0[0] - p1[0];
          dLng = p0[1] - p1[1];
        }

        if (dLat === 0 && dLng === 0 && pathInfo.points.length > 1) {
          dLat = pathInfo.points[1][0] - pathInfo.points[0][0];
          dLng = pathInfo.points[1][1] - pathInfo.points[0][1];
          if (!isForward) { dLat = -dLat; dLng = -dLng; }
        }

        // 1. Right-hand track offset (0.00015 degrees ~ 15 meters)
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

        // 2. Rotation Angle for Chevron
        const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);

        // 3. Direction Naming
        const isFerry = line.id === 'pasig-ferry';
        const isEastWest = line.id === 'lrt-2' || isFerry;
        let headingText = isForward ? 'Southbound' : 'Northbound';
        if (isFerry) {
          headingText = isForward ? 'Upstream (Eastbound)' : 'Downstream (Westbound)';
        } else if (isEastWest) {
          headingText = isForward ? 'Eastbound' : 'Westbound';
        }

        const startName = line.stations[startStationIdx].name;
        const endName = line.stations[endStationIdx].name;
        const boundFor = isForward ? line.stations[M].name : line.stations[0].name;

        // 4. ETA
        const minsToNext = Math.max(1, Math.ceil((LEG_CYCLE - legTime) / 60000));

        let statusText = isDwelling 
          ? `Boarding at ${startName}` 
          : `Approaching ${endName} in ${minsToNext} min`;

        if (isDwelling && (startStationIdx === 0 || startStationIdx === M)) {
           statusText = `Standby at ${startName}`;
        }

        return {
          id: spec.id,
          lineId: spec.lineId,
          num: spec.num,
          coords,
          statusText,
          boundFor,
          headingText,
          angle
        };
      }).filter(Boolean) as VehicleState[];

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

    let TOTAL_LEG_MS = 150000;
    if (lineId === 'pnr-south') TOTAL_LEG_MS = 3000000;
    else if (lineId === 'pnr-bicol') TOTAL_LEG_MS = 2700000;
    const DWELL_MS = 20000;
    const LEG_CYCLE = TOTAL_LEG_MS + DWELL_MS;
    const ROUND_TRIP_MS = 2 * M * LEG_CYCLE;
    const now = getSimulatedTime().getTime();

    const forwardTarget = stationIdx * LEG_CYCLE;
    const backwardTarget = (2 * M - stationIdx) * LEG_CYCLE;

    let minForwardMs = Infinity;
    let minBackwardMs = Infinity;

    const lineSpecs = vehicleSpecs.filter(spec => spec.lineId === lineId);
    lineSpecs.forEach(spec => {
      const t = (now + spec.offsetMs) % ROUND_TRIP_MS;
      
      let diffFwd = (forwardTarget - t + ROUND_TRIP_MS) % ROUND_TRIP_MS;
      if (diffFwd < minForwardMs) minForwardMs = diffFwd;

      let diffBwd = (backwardTarget - t + ROUND_TRIP_MS) % ROUND_TRIP_MS;
      if (diffBwd < minBackwardMs) minBackwardMs = diffBwd;
    });

    return {
      forwardMins: Math.max(1, Math.ceil(minForwardMs / 60000)),
      backwardMins: Math.max(1, Math.ceil(minBackwardMs / 60000)),
      forwardName: line.stations[M].name,
      backwardName: line.stations[0].name
    };
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Filter Control Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: '#1e293b',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #334155',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <label htmlFor="line-filter" style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          HIGHLIGHT LINE
        </label>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
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

        {/* Direction Filter */}
        {showLiveVehicles && (
          <div style={{ display: 'flex', backgroundColor: '#0f172a', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155', marginTop: '4px' }}>
            <button 
              onClick={() => setDirectionFilter('ALL')}
              style={{ flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: directionFilter === 'ALL' ? '#3b82f6' : 'transparent', color: directionFilter === 'ALL' ? 'white' : '#94a3b8' }}
            >All</button>
            <button 
              onClick={() => setDirectionFilter('NB')}
              style={{ flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', border: 'none', borderLeft: '1px solid #334155', borderRight: '1px solid #334155', cursor: 'pointer', backgroundColor: directionFilter === 'NB' ? '#3b82f6' : 'transparent', color: directionFilter === 'NB' ? 'white' : '#94a3b8' }}
            >▲ NB/EB</button>
            <button 
              onClick={() => setDirectionFilter('SB')}
              style={{ flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer', backgroundColor: directionFilter === 'SB' ? '#3b82f6' : 'transparent', color: directionFilter === 'SB' ? 'white' : '#94a3b8' }}
            >▼ SB/WB</button>
          </div>
        )}
      </div>

      <style>{`
        .dark-station-tooltip {
          background-color: rgba(30, 41, 59, 0.85);
          border: 1px solid #475569;
          color: #f8fafc;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.4);
          white-space: nowrap;
        }
        .dark-station-tooltip::before {
          border-top-color: rgba(30, 41, 59, 0.85);
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

      <MapContainer 
        center={position} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ width: '100%', height: '100%', background: '#1e293b' }}
      >
        {/* Dark mode tiles using CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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

                      {/* Action Button */}
                      <button 
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        + Report Delay
                      </button>
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
              }).map(v => (
                <Marker 
                  key={v.id} 
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
                </Marker>
              ))}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
