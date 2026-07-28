import { PassengerType, FareResult, TransitMode } from './fareTypes';

export const mrt3Stations = [
  'North Ave', 'Quezon Ave', 'Kamuning', 'Cubao', 'Santolan', 'Ortigas', 
  'Shaw Blvd', 'Boni', 'Guadalupe', 'Buendia', 'Ayala', 'Magallanes', 'Taft Ave'
];

// Original matrix, we apply 50% discount in the getter
const rawMrt3Matrix = [
  [13, 13, 13, 16, 16, 20, 20, 20, 24, 24, 24, 28, 28],
  [13, 13, 13, 13, 16, 16, 20, 20, 20, 24, 24, 24, 28],
  [13, 13, 13, 13, 13, 16, 16, 20, 20, 20, 24, 24, 24],
  [16, 13, 13, 13, 13, 13, 16, 16, 20, 20, 20, 24, 24],
  [16, 16, 13, 13, 13, 13, 13, 16, 16, 20, 20, 20, 24],
  [20, 16, 16, 13, 13, 13, 13, 13, 16, 16, 20, 20, 20],
  [20, 20, 16, 16, 13, 13, 13, 13, 13, 16, 16, 20, 20],
  [20, 20, 20, 16, 16, 13, 13, 13, 13, 13, 16, 16, 20],
  [24, 20, 20, 20, 16, 16, 13, 13, 13, 13, 13, 16, 16],
  [24, 24, 20, 20, 20, 16, 16, 13, 13, 13, 13, 13, 16],
  [24, 24, 24, 20, 20, 20, 16, 16, 13, 13, 13, 13, 13],
  [28, 24, 24, 24, 20, 20, 20, 16, 16, 13, 13, 13, 13],
  [28, 28, 24, 24, 24, 20, 20, 20, 16, 16, 13, 13, 13],
];

export const lrta2Stations = [
  'Recto', 'Legarda', 'Pureza', 'V. Mapa', 'J. Ruiz', 'Gilmore',
  'Betty Go', 'Cubao', 'Anonas', 'Katipunan', 'Santolan', 'Marikina', 'Antipolo'
];

const rawLrta2Matrix = [
  [13, 15, 16, 18, 19, 21, 22, 23, 25, 26, 28, 31, 33],
  [15, 13, 15, 17, 18, 19, 21, 22, 24, 25, 27, 29, 32],
  [16, 15, 13, 15, 16, 18, 19, 20, 22, 23, 26, 28, 30],
  [18, 17, 15, 13, 15, 16, 17, 19, 20, 22, 24, 26, 29],
  [19, 18, 16, 15, 13, 14, 16, 17, 19, 20, 22, 24, 27],
  [21, 19, 18, 16, 14, 13, 15, 16, 18, 19, 21, 23, 26],
  [22, 21, 19, 17, 16, 15, 13, 15, 16, 18, 20, 22, 25],
  [23, 22, 20, 19, 17, 16, 15, 13, 15, 16, 19, 21, 23],
  [25, 24, 22, 20, 19, 18, 16, 15, 13, 14, 17, 19, 22],
  [26, 25, 23, 22, 20, 19, 18, 16, 14, 13, 16, 18, 21],
  [28, 27, 26, 24, 22, 21, 20, 19, 17, 16, 13, 15, 18],
  [31, 29, 28, 26, 24, 23, 22, 21, 19, 18, 15, 13, 16],
  [33, 32, 30, 29, 27, 26, 25, 23, 22, 21, 18, 16, 13],
];

export const mrt3Matrix = rawMrt3Matrix.map(row => row.map(val => Math.round(val * 0.5)));
export const lrta2Matrix = rawLrta2Matrix.map(row => row.map(val => Math.round(val * 0.5)));

export const lrt1Stations = [
  'Baclaran', 'EDSA', 'Libertad', 'Gil Puyat', 'Vito Cruz', 'Quirino', 
  'Pedro Gil', 'U.N. Avenue', 'Central Terminal', 'Carriedo', 'Doroteo Jose', 
  'Bambang', 'Tayuman', 'Blumentritt', 'Abad Santos', 'R. Papa', '5th Avenue', 
  'Monumento', 'Balintawak', 'Roosevelt (FPJ)'
];

// Generate an approximate matrix for LRT-1 (base 15, max 30), then apply 50% discount
const rawLrt1Matrix = Array(20).fill(0).map((_, i) => 
  Array(20).fill(0).map((_, j) => 15 + Math.floor(Math.abs(i - j) * 0.8))
);
export const lrt1Matrix = rawLrt1Matrix.map(row => row.map(val => Math.round(val * 0.5)));

export const pnrStations = [
  'Tutuban', 'Blumentritt', 'Laong Laan', 'Espana', 'Sta. Mesa', 'Pandacan', 
  'Paco', 'San Andres', 'Vito Cruz', 'Buendia', 'Pasay Road', 'EDSA', 
  'Nichols', 'FTI', 'Bicutan', 'Sucat', 'Alabang'
];

// Generate an approximate matrix for PNR (base 15)
export const pnrMatrix = Array(17).fill(0).map((_, i) => 
  Array(17).fill(0).map((_, j) => 15 + Math.floor(Math.abs(i - j) * 1.5))
);


export const APP_DISCOUNT_RATE = 0.05; // 5% fixed app discount

export function calculateFareDetails(baseFare: number, passengerType: PassengerType): FareResult {
  let statDiscountRate = 0;
  if (passengerType !== 'REGULAR') {
    statDiscountRate = 0.20;
  }
  
  const fareAfterStatutory = baseFare * (1 - statDiscountRate);
  const statutoryDiscountAmount = baseFare - fareAfterStatutory;
  
  const fareAfterAppDiscount = fareAfterStatutory * (1 - APP_DISCOUNT_RATE);
  const appDiscountAmount = fareAfterStatutory - fareAfterAppDiscount;
  
  return {
    baseFare,
    statutoryDiscount: statutoryDiscountAmount,
    appDiscount: appDiscountAmount,
    finalFare: fareAfterAppDiscount,
    savings: statutoryDiscountAmount + appDiscountAmount
  };
}

export function calculateRoadFare(mode: TransitMode, km: number): number {
  switch (mode) {
    case 'BUS_ORDINARY':
      return 15 + Math.max(0, km - 5) * 2.49;
    case 'BUS_AIRCON':
      return 18 + Math.max(0, km - 5) * 2.98;
    case 'MODERN_JEEP':
      return 17 + Math.max(0, km - 4) * 2.30;
    case 'TRAD_JEEP':
      return 14 + Math.max(0, km - 4) * 2.00;
    case 'UV_EXPRESS':
      return 25 + Math.max(0, km - 2) * 2.50; // Estimate
    case 'P2P_BUS':
      return 150; // Flat estimate
    default:
      return 0;
  }
}
