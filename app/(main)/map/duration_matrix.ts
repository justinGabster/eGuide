export interface LineConfig {
  peakHeadwaySec: number;
  offPeakHeadwaySec: number;
  fleetSizePeak: number;
  fleetSizeOffPeak: number;
  legDurations: number[]; // Array of segment durations in seconds
  dwellTimeSec: number;   // Dwell time at each station
}

export function isPeakHour(date: Date = new Date()): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const morningStart = 5 * 60;      // 5:00 AM
  const morningEnd = 9 * 60 + 30;   // 9:30 AM
  const eveningStart = 17 * 60;     // 5:00 PM
  const eveningEnd = 20 * 60 + 30;  // 8:30 PM

  return (timeInMinutes >= morningStart && timeInMinutes <= morningEnd) ||
         (timeInMinutes >= eveningStart && timeInMinutes <= eveningEnd);
}

export const LINE_CONFIGS: Record<string, LineConfig> = {
  'mrt-3': {
    peakHeadwaySec: 240, // 4 mins
    offPeakHeadwaySec: 480, // 8 mins
    fleetSizePeak: 14,
    fleetSizeOffPeak: 8,
    dwellTimeSec: 20,
    legDurations: [120, 135, 110, 140, 125, 130, 115, 120, 110, 130, 125, 140] // 12 legs
  },
  'lrt-1': {
    peakHeadwaySec: 210, // 3.5 mins
    offPeakHeadwaySec: 420, // 7 mins
    fleetSizePeak: 18,
    fleetSizeOffPeak: 10,
    dwellTimeSec: 20,
    legDurations: [130, 115, 140, 120, 105, 110, 135, 125, 115, 130, 145, 120, 110, 135, 125, 140, 130, 115, 120] // 19 legs
  },
  'lrt-2': {
    peakHeadwaySec: 360, // 6 mins
    offPeakHeadwaySec: 600, // 10 mins
    fleetSizePeak: 9,
    fleetSizeOffPeak: 6,
    dwellTimeSec: 20,
    legDurations: [150, 130, 145, 160, 120, 140, 135, 155, 170, 145, 130, 160] // 12 legs
  },
  'pnr-south': {
    peakHeadwaySec: 1800, // 30 mins
    offPeakHeadwaySec: 3600, // 60 mins
    fleetSizePeak: 4,
    fleetSizeOffPeak: 2,
    dwellTimeSec: 60,
    legDurations: [1500, 1800, 2400] // 3 legs
  },
  'pnr-bicol': {
    peakHeadwaySec: 3600, // 60 mins
    offPeakHeadwaySec: 7200, // 120 mins
    fleetSizePeak: 2,
    fleetSizeOffPeak: 1,
    dwellTimeSec: 120,
    legDurations: [2400, 2700] // 2 legs
  },
  'pasig-ferry': {
    peakHeadwaySec: 900, // 15 mins
    offPeakHeadwaySec: 1800, // 30 mins
    fleetSizePeak: 6,
    fleetSizeOffPeak: 4,
    dwellTimeSec: 30,
    legDurations: [300, 320, 400, 250, 350, 280, 290, 310, 420, 380, 270] // 11 legs
  },
  'edsa-carousel': {
    peakHeadwaySec: 180, // 3 mins
    offPeakHeadwaySec: 360, // 6 mins
    fleetSizePeak: 25,
    fleetSizeOffPeak: 15,
    dwellTimeSec: 20,
    legDurations: [280, 280, 220, 160, 280, 280, 280, 220, 160, 220, 280, 220, 220, 220, 400, 460] // 16 legs
  }
};
