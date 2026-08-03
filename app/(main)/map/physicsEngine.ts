import { LINE_CONFIGS, LineConfig } from './duration_matrix';
import { transitLines } from './transitData';

export interface PhysicsPosition {
  startStationIdx: number;
  endStationIdx: number;
  isDwelling: boolean;
  progress: number;
  isForward: boolean;
  totalLegMs: number;
  dwellMs: number;
  nextStationEtaMs: number;
  logicalFraction: number; // needed for MapComponent logic
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);  
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

// Dynamically compute exact physical distances for legDurations
let physicsInitialized = false;
export const initPhysics = () => {
    if (physicsInitialized) return;
    physicsInitialized = true;
    
    transitLines.forEach(line => {
        let speedKph = 40;
        if (line.id.includes('bus') || line.id.includes('carousel')) speedKph = 25;
        if (line.id.includes('ferry')) speedKph = 15;
        if (line.id.includes('pnr')) speedKph = 60;
        if (line.id.includes('bgc')) speedKph = 15;

        const kmPerSec = speedKph / 3600;
        const config = LINE_CONFIGS[line.id];
        if (!config) return;
        
        const stations = line.stations.filter(s => !s.isVia);
        const durations = [];
        
        for(let i = 0; i < stations.length - 1; i++) {
           const distKm = getDistanceFromLatLonInKm(
              stations[i].coords[0], stations[i].coords[1],
              stations[i+1].coords[0], stations[i+1].coords[1]
           );
           let durationSec = Math.round(distKm / kmPerSec);
           if (durationSec < 45) durationSec = 45;
           durations.push(durationSec);
        }
        
        // Overwrite static config with real physical durations
        config.legDurations = durations;
    });
};
initPhysics();

export const getLineRoundTripMs = (lineId: string): number => {
  const config = LINE_CONFIGS[lineId];
  if (!config) return 0;
  
  const dwellMs = config.dwellTimeSec * 1000;
  let totalLegsMs = 0;
  for (const d of config.legDurations) {
    totalLegsMs += d * 1000;
  }
  
  const M = config.legDurations.length;
  // oneWayMs = totalLegsMs + (M + 1) dwells
  const oneWayMs = totalLegsMs + (M + 1) * dwellMs;
  return 2 * oneWayMs;
};

export const getVehiclePosition = (t: number, lineId: string): PhysicsPosition | null => {
  const config = LINE_CONFIGS[lineId];
  if (!config) return null;

  const M = config.legDurations.length;
  const loopDurationMs = getLineRoundTripMs(lineId);
  const time = t % loopDurationMs;
  const dwellMs = config.dwellTimeSec * 1000;
  
  let currentMs = 0;

  // Simulate Forward Half
  for (let i = 0; i < M; i++) {
     const legMs = config.legDurations[i] * 1000;
     
     // Dwell at i
     if (time >= currentMs && time < currentMs + dwellMs) {
         return {
             startStationIdx: i,
             endStationIdx: i + 1,
             isDwelling: true,
             progress: (time - currentMs) / dwellMs,
             isForward: true,
             totalLegMs: legMs,
             dwellMs: dwellMs,
             nextStationEtaMs: (currentMs + dwellMs) - time + legMs,
             logicalFraction: i / M
         };
     }
     currentMs += dwellMs;

     // Leg i
     if (time >= currentMs && time < currentMs + legMs) {
         return {
             startStationIdx: i,
             endStationIdx: i + 1,
             isDwelling: false,
             progress: (time - currentMs) / legMs,
             isForward: true,
             totalLegMs: legMs,
             dwellMs: dwellMs,
             nextStationEtaMs: (currentMs + legMs) - time,
             logicalFraction: (i + (time - currentMs) / legMs) / M
         };
     }
     currentMs += legMs;
  }
  
  // Terminal Dwell at M (Forward trip ends)
  if (time >= currentMs && time < currentMs + dwellMs) {
      return {
          startStationIdx: M,
          endStationIdx: M - 1, // Next station will be M-1 on return
          isDwelling: true,
          progress: (time - currentMs) / dwellMs,
          isForward: true, // Still considered forward until it starts return
          totalLegMs: 0,
          dwellMs: dwellMs,
          nextStationEtaMs: (currentMs + dwellMs) - time,
          logicalFraction: 1
      };
  }
  currentMs += dwellMs;

  // Simulate Return Half
  for (let i = M; i > 0; i--) {
     const legMs = config.legDurations[i - 1] * 1000;
     
     // Dwell at i
     if (time >= currentMs && time < currentMs + dwellMs) {
         return {
             startStationIdx: i,
             endStationIdx: i - 1,
             isDwelling: true,
             progress: (time - currentMs) / dwellMs,
             isForward: false,
             totalLegMs: legMs,
             dwellMs: dwellMs,
             nextStationEtaMs: (currentMs + dwellMs) - time + legMs,
             logicalFraction: i / M
         };
     }
     currentMs += dwellMs;

     // Leg i-1 (traveling from i to i-1)
     if (time >= currentMs && time < currentMs + legMs) {
         return {
             startStationIdx: i,
             endStationIdx: i - 1,
             isDwelling: false,
             progress: (time - currentMs) / legMs,
             isForward: false,
             totalLegMs: legMs,
             dwellMs: dwellMs,
             nextStationEtaMs: (currentMs + legMs) - time,
             logicalFraction: (i - (time - currentMs) / legMs) / M
         };
     }
     currentMs += legMs;
  }

  // Terminal Dwell at 0 (Return trip ends)
  if (time >= currentMs && time <= currentMs + dwellMs) {
      return {
          startStationIdx: 0,
          endStationIdx: 1, // Next station is 1
          isDwelling: true,
          progress: (time - currentMs) / (dwellMs || 1), // prevent div zero
          isForward: false,
          totalLegMs: 0,
          dwellMs: dwellMs,
          nextStationEtaMs: (currentMs + dwellMs) - time,
          logicalFraction: 0
      };
  }

  // Fallback in case of rounding errors
  return {
    startStationIdx: 0,
    endStationIdx: 1,
    isDwelling: true,
    progress: 0,
    isForward: true,
    totalLegMs: 0,
    dwellMs,
    nextStationEtaMs: 0,
    logicalFraction: 0
  };
};

export const getTravelTimeMs = (lineId: string, fromIdx: number, toIdx: number, isForward: boolean): number => {
    const config = LINE_CONFIGS[lineId];
    if (!config) return 0;
    
    let ms = 0;
    if (isForward) {
        for (let i = fromIdx; i < toIdx; i++) {
            ms += config.legDurations[i] * 1000;
            if (i < toIdx - 1) ms += config.dwellTimeSec * 1000;
        }
    } else {
        for (let i = fromIdx - 1; i >= toIdx; i--) {
            ms += config.legDurations[i] * 1000;
            if (i > toIdx) ms += config.dwellTimeSec * 1000;
        }
    }
    return ms;
};
