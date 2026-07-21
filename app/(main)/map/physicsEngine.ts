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
}

export const getLineRoundTripMs = (lineId: string): number => {
  const config = LINE_CONFIGS[lineId];
  if (!config) return 0;
  
  const dwellMs = config.dwellTimeSec * 1000;
  let totalLegsMs = 0;
  for (const d of config.legDurations) {
    totalLegsMs += d * 1000;
  }
  
  const M = config.legDurations.length;
  const oneWayMs = totalLegsMs + (M + 1) * dwellMs;
  return 2 * oneWayMs;
};

export const getVehiclePosition = (t: number, lineId: string): PhysicsPosition | null => {
  const config = LINE_CONFIGS[lineId];
  if (!config) return null;

  const M = config.legDurations.length;
  const loopDurationMs = getLineRoundTripMs(lineId);

  // Normalized progress fraction from 0.0 to 1.0
  const progressFraction = t / loopDurationMs;

  // Determine direction based on loop half
  const isReturnLeg = progressFraction > 0.5;
  const legProgress = isReturnLeg ? (progressFraction - 0.5) * 2 : progressFraction * 2;
  const isForward = !isReturnLeg;

  // Calculate scaled progress across the stations
  const scaledProgress = legProgress * M;
  
  let startStationIdx = 0;
  let endStationIdx = 0;
  
  if (isForward) {
    startStationIdx = Math.min(Math.floor(scaledProgress), M);
    endStationIdx = Math.min(startStationIdx + 1, M);
  } else {
    // Reverse direction: start at M and go to 0
    startStationIdx = M - Math.min(Math.floor(scaledProgress), M);
    endStationIdx = Math.max(startStationIdx - 1, 0);
  }

  // Fractional progress between the two stations (0.0 to 1.0)
  const progress = scaledProgress - Math.floor(scaledProgress);
  
  // Estimate dwelling if very close to station
  const isDwelling = progress < 0.05 || progress > 0.95;

  return { 
    startStationIdx, 
    endStationIdx, 
    isDwelling, 
    progress, 
    isForward, 
    totalLegMs: 120000, 
    dwellMs: 20000, 
    nextStationEtaMs: (1 - progress) * 120000 
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
