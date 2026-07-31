export type TransitMode = 
  | 'MRT-3' 
  | 'LRT-2' 
  | 'LRT-1' 
  | 'PNR'
  | 'BUS_ORDINARY' 
  | 'BUS_AIRCON' 
  | 'MODERN_JEEP' 
  | 'TRAD_JEEP' 
  | 'P2P_BUS' 
  | 'UV_EXPRESS';

export type PassengerType = 'REGULAR' | 'STUDENT' | 'SENIOR' | 'PWD';

export type FareResult = {
  baseFare: number;
  statutoryDiscount: number;
  appDiscount: number;
  finalFare: number;
  savings: number;
};

export type BeepCard = {
  cardNumber: string;
  nickname?: string;
  linkedDate: string;
};

export type WalletCard = {
  id: string;
  cardName: string;
  provider: string;
  cardNumber: string;
  cardBgImage: string;
  providerLogo: string;
  networkLogo: string;
  isDefault: boolean;
};
