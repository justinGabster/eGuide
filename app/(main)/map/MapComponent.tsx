'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { transitLines } from './transitData';

export default function MapComponent() {
  // Center map around Metro Manila
  const position: [number, number] = [14.6091, 121.0223]; 

  const [pasigFerryData, setPasigFerryData] = useState<any>(null);
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [showAllLabels, setShowAllLabels] = useState<boolean>(false);

  useEffect(() => {
    fetch('/data/pasig-ferry.json')
      .then(res => res.json())
      .then(data => setPasigFerryData(data))
      .catch(err => console.error('Failed to load ferry GeoJSON:', err));
  }, []);

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
        gap: '6px'
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
          >
            Show Station Names
          </label>
        </div>
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
      `}</style>

      <MapContainer 
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
          const lineOpacity = isFaded ? 0.35 : 1.0;
          const markerOpacity = isFaded ? 0.3 : 1.0;

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
                      dashArray: segment.isDashed ? '6, 8' : undefined
                    }}
                  />
                ))
              ) : (
                <Polyline 
                  positions={line.path || line.stations.map((s) => s.coords)}
                  pathOptions={{ 
                    color: lineColor, 
                    weight: lineWeight,
                    opacity: lineOpacity
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
                  <Popup>
                    <strong>{station.name}</strong><br />
                    <span style={{ color: line.color, fontWeight: 'bold' }}>{line.name}</span>
                  </Popup>
                </CircleMarker>
              ))}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
