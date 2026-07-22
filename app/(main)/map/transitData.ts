export interface Station {
  name: string;
  coords: [number, number]; // [lat, lng]
}

export interface TransitSegment {
  stations: Station[];
  isDashed?: boolean;
}

export interface TransitLine {
  id: string;
  name: string;
  color: string;
  stations: Station[];
  segments?: TransitSegment[];
  path?: [number, number][]; // Optional custom polyline path (e.g. for rivers)
}

export const lrt1: TransitLine = {
  id: 'lrt-1',
  name: 'LRT-1 (Green Line)',
  color: '#00B140', // or #28a745
  stations: [
    { name: 'Fernando Poe Jr. (Roosevelt)', coords: [14.6576, 121.0211] },
    { name: 'Balintawak', coords: [14.6575, 121.0041] },
    { name: 'Monumento', coords: [14.6540, 120.9839] },
    { name: '5th Ave', coords: [14.6443, 120.9836] },
    { name: 'R. Papa', coords: [14.6360, 120.9824] },
    { name: 'Abad Santos', coords: [14.6306, 120.9815] },
    { name: 'Blumentritt', coords: [14.6226, 120.9829] },
    { name: 'Tayuman', coords: [14.6167, 120.9826] },
    { name: 'Bambang', coords: [14.6111, 120.9823] },
    { name: 'Doroteo Jose', coords: [14.6054, 120.9817] },
    { name: 'Carriedo', coords: [14.5985, 120.9806] },
    { name: 'Central Terminal', coords: [14.5927, 120.9817] },
    { name: 'United Nations', coords: [14.5826, 120.9845] },
    { name: 'Pedro Gil', coords: [14.5763, 120.9879] },
    { name: 'Quirino', coords: [14.5702, 120.9915] },
    { name: 'Vito Cruz', coords: [14.5633, 120.9947] },
    { name: 'Gil Puyat', coords: [14.5539, 120.9975] },
    { name: 'Libertad', coords: [14.5476, 120.9986] },
    { name: 'EDSA', coords: [14.5385, 121.0007] },
    { name: 'Baclaran', coords: [14.5343, 120.9982] }
  ]
};

export const lrt2: TransitLine = {
  id: 'lrt-2',
  name: 'LRT-2 (Purple Line)',
  color: '#A020F0',
  stations: [
    { name: 'Recto', coords: [14.6033, 120.9834] },
    { name: 'Legarda', coords: [14.6009, 120.9928] },
    { name: 'Pureza', coords: [14.6014, 121.0052] },
    { name: 'V. Mapa', coords: [14.6041, 121.0171] },
    { name: 'J. Ruiz', coords: [14.6106, 121.0264] },
    { name: 'Gilmore', coords: [14.6135, 121.0343] },
    { name: 'Betty Go-Belmonte', coords: [14.6185, 121.0428] },
    { name: 'Araneta Center-Cubao', coords: [14.6223, 121.0531] },
    { name: 'Anonas', coords: [14.6280, 121.0651] },
    { name: 'Katipunan', coords: [14.6315, 121.0729] },
    { name: 'Santolan', coords: [14.6220, 121.0858] },
    { name: 'Marikina-Pasig', coords: [14.6195, 121.1005] },
    { name: 'Antipolo', coords: [14.6247, 121.1215] }
  ]
};

export const mrt3: TransitLine = {
  id: 'mrt-3',
  name: 'MRT-3 (Yellow Line)',
  color: '#FFCC00',
  stations: [
    { name: 'North Avenue', coords: [14.6521, 121.0323] },
    { name: 'Quezon Avenue', coords: [14.6433, 121.0387] },
    { name: 'Kamuning', coords: [14.6353, 121.0433] },
    { name: 'Araneta Center-Cubao', coords: [14.6195, 121.0511] },
    { name: 'Santolan-Annapolis', coords: [14.6078, 121.0565] },
    { name: 'Ortigas', coords: [14.5880, 121.0567] },
    { name: 'Shaw Boulevard', coords: [14.5807, 121.0537] },
    { name: 'Boni', coords: [14.5739, 121.0483] },
    { name: 'Guadalupe', coords: [14.5673, 121.0457] },
    { name: 'Buendia', coords: [14.5540, 121.0345] },
    { name: 'Ayala', coords: [14.5492, 121.0279] },
    { name: 'Magallanes', coords: [14.5408, 121.0188] },
    { name: 'Taft Avenue', coords: [14.5376, 121.0014] }
  ]
};

const pnrActiveStations: Station[] = [
  { name: 'Tutuban', coords: [14.6083, 120.9739] },
  { name: 'Blumentritt', coords: [14.6212, 120.9840] },
  { name: 'España', coords: [14.6111, 120.9986] },
  { name: 'Sta. Mesa', coords: [14.6006, 121.0112] },
  { name: 'Pandacan', coords: [14.5872, 121.0064] },
  { name: 'Paco', coords: [14.5772, 120.9986] },
  { name: 'San Andres', coords: [14.5714, 121.0000] },
  { name: 'Vito Cruz', coords: [14.5647, 121.0019] },
  { name: 'Buendia', coords: [14.5539, 121.0053] },
  { name: 'Pasay Road', coords: [14.5469, 121.0136] },
  { name: 'EDSA', coords: [14.5422, 121.0198] },
  { name: 'Nichols', coords: [14.5244, 121.0264] },
  { name: 'FTI', coords: [14.5050, 121.0369] },
  { name: 'Bicutan', coords: [14.4875, 121.0475] },
  { name: 'Sucat', coords: [14.4539, 121.0506] },
  { name: 'Alabang', coords: [14.4172, 121.0436] }
];

const pnrExtendedStations: Station[] = [
  { name: 'Alabang', coords: [14.4172, 121.0436] }, // Connects to active section
  { name: 'San Pedro', coords: [14.3644, 121.0567] },
  { name: 'Biñan', coords: [14.3314, 121.0822] },
  { name: 'Santa Rosa', coords: [14.3050, 121.1097] },
  { name: 'Cabuyao', coords: [14.2750, 121.1242] },
  { name: 'Calamba', coords: [14.2044, 121.1650] }
];

export const pnrNscr: TransitLine = {
  id: 'pnr-nscr',
  name: 'PNR Metro (Suspended)',
  color: '#E65100', // or #FF6F00
  stations: [...pnrActiveStations, ...pnrExtendedStations.slice(1)],
  segments: [
    {
      stations: pnrActiveStations,
      isDashed: true
    },
    {
      stations: pnrExtendedStations,
      isDashed: true
    }
  ]
};

const pnrSouthStations: Station[] = [
  { name: 'Calamba', coords: [14.2044, 121.1650] },
  { name: 'Pansol', coords: [14.1793, 121.1895] },
  { name: 'San Pablo', coords: [14.0720, 121.3260] },
  { name: 'Lucena', coords: [13.9269, 121.6131] }
];

export const pnrSouth: TransitLine = {
  id: 'pnr-south',
  name: 'PNR South (Active)',
  color: '#E65100',
  stations: pnrSouthStations
};

const pnrBicolStations: Station[] = [
  { name: 'Lupi Viejo', coords: [13.7883, 122.9075] },
  { name: 'Sipocot', coords: [13.7690, 122.9776] },
  { name: 'Naga', coords: [13.6196, 123.1859] }
];

export const pnrBicol: TransitLine = {
  id: 'pnr-bicol',
  name: 'PNR Bicol (Active)',
  color: '#E65100',
  stations: pnrBicolStations
};

export const pasigFerry: TransitLine = {
  id: 'pasig-ferry',
  name: 'Pasig River Ferry',
  color: '#00BFFF', // Deep Sky Blue for the river ferry
  stations: [
    { name: "Escolta River Ferry", coords: [14.5964, 120.9775] },
    { name: "Pasig Ferry Lawton", coords: [14.5958, 120.9815] },
    { name: "Quinta Market Ferry Terminal", coords: [14.5973, 120.9835] },
    { name: "PUP Ferry Terminal", coords: [14.5956, 121.0106] },
    { name: "Sta. Ana Ferry Terminal", coords: [14.5828, 121.0118] },
    { name: "Lambingan Ferry Terminal", coords: [14.5872, 121.0203] },
    { name: "Valenzuela Ferry", coords: [14.5739, 121.0264] },
    { name: "Hulo Ferry", coords: [14.5711, 121.0336] },
    { name: "Guadalupe Ferry", coords: [14.5681, 121.0453] },
    { name: "San Joaquin Ferry", coords: [14.5585, 121.0748] },
    { name: "Kalawaan Ferry Terminal", coords: [14.5582, 121.0805] },
    { name: "Nagpayong Ferry (Pinagbuhatan)", coords: [14.5420, 121.0890] }
  ],
  path: [
    // --- Escolta Terminal ---
    [14.5964, 120.9775], 

    // --- Escolta Ferry Terminal ---
    [14.5966, 120.9786], 

    // --- Lawton Ferry Terminal ---
    [14.5952, 120.9810], 

    // Crossing water under MacArthur Bridge heading towards Quinta North Bank
    [14.5962, 120.9825], 
    [14.5968, 120.9830], 

    // --- Quinta Market Terminal (North Bank) ---
    [14.5973, 120.9835], 

    // Following Pasig River channel under Quezon Bridge towards PUP
    [14.5970, 120.9855], 
    [14.5960, 120.9875], 
    [14.5947, 120.9880],
    [14.5935, 120.9890], // Added
    [14.5925, 120.9905], // Added
    [14.5921, 120.9926], 
    [14.5930, 120.9945], // Added
    [14.5950, 120.9972], 
    [14.5953, 121.0016], 
    [14.5955, 121.0050], // Added
    [14.5956, 121.0080], // Added
    
    // --- PUP Ferry Terminal ---
    [14.5956, 121.0106], 

    // Following the river curve south past Beata/Pandacan
    [14.5948, 121.0120], // Added (Curve start)
    [14.5930, 121.0128],
    [14.5910, 121.0130], // Added (Mid-curve)
    [14.5890, 121.0125],
    [14.5870, 121.0118], // Added (Mid-curve)
    [14.5855, 121.0108],

    // --- Sta. Ana Ferry Terminal (At the river bank bend) ---
    [14.5828, 121.0118], 

    // Curved path following river east towards Lambingan
    [14.5815, 121.0142],
    [14.5820, 121.0155], // Added
    [14.5825, 121.0165],
    [14.5835, 121.0175], // Added
    [14.5850, 121.0182],

    // --- Lambingan Ferry Terminal ---
    [14.5872, 121.0203],

    // Lambingan -> Valenzuela
    [14.5840, 121.0210], // Added
    [14.5807, 121.0224],
    [14.5775, 121.0245], // Added
    [14.5739, 121.0264], // Valenzuela

    // Valenzuela -> Hulo -> Guadalupe
    [14.5720, 121.0300], // Added
    [14.5711, 121.0336], // Hulo
    [14.5708, 121.0370], // Added
    [14.5702, 121.0398],
    [14.5695, 121.0425], // Added
    [14.5681, 121.0453], // Guadalupe

    // Following Pasig River channel East
    [14.5668, 121.0505],
    [14.5655, 121.0535], // Added
    [14.5645, 121.0560],
    [14.5630, 121.0590], // Added
    [14.5615, 121.0620],
    [14.5605, 121.0650], // Added
    [14.5595, 121.0680],
    [14.5590, 121.0710], // Added

    // --- San Joaquin Ferry (On the River Channel) ---
    [14.5585, 121.0748], 

    // River path East to Kalawaan
    [14.5583, 121.0775],

    // --- Kalawaan Ferry Terminal (On the River Channel) ---
    [14.5582, 121.0805], 

    // Swirling East and South following the Napindan River bend
    [14.5580, 121.0845],
    [14.5575, 121.0860], // Added
    [14.5565, 121.0872],
    [14.5550, 121.0880], // Added
    [14.5538, 121.0888],
    [14.5525, 121.0895], // Added
    [14.5510, 121.0895], // Sharp southward river turn
    [14.5490, 121.0895], // Added
    [14.5470, 121.0892],
    [14.5455, 121.0890], // Added
    [14.5445, 121.0890],
    [14.5435, 121.0890], // Added

    // --- Nagpayong Ferry Terminal (Pinagbuhatan) ---
    [14.5420, 121.0890]
  ]
};

export const edsaCarousel: TransitLine = {
  id: 'edsa-carousel',
  name: 'EDSA Carousel Busway',
  color: '#EC4899', // Crimson / Vibrant Pink accent color
  stations: [
    { name: 'Monumento', coords: [14.6575, 120.9839] },
    { name: 'Balintawak', coords: [14.6573, 121.0028] },
    { name: 'North Ave', coords: [14.6528, 121.0326] },
    { name: 'Quezon Ave', coords: [14.6433, 121.0370] },
    { name: 'GMA Kamuning', coords: [14.6346, 121.0435] },
    { name: 'Araneta Center Cubao', coords: [14.6193, 121.0511] },
    { name: 'Santolan EDSA', coords: [14.6080, 121.0566] },
    { name: 'Ortigas EDSA', coords: [14.5878, 121.0566] },
    { name: 'Shaw EDSA', coords: [14.5812, 121.0535] },
    { name: 'Boni EDSA', coords: [14.5739, 121.0481] },
    { name: 'Guadalupe EDSA', coords: [14.5671, 121.0456] },
    { name: 'Buendia EDSA', coords: [14.5546, 121.0345] },
    { name: 'Ayala EDSA', coords: [14.5492, 121.0281] },
    { name: 'Magallanes EDSA', coords: [14.5418, 121.0195] },
    { name: 'Taft EDSA', coords: [14.5375, 121.0012] },
    { name: 'MOA', coords: [14.5352, 120.9822] },
    { name: 'PITX', coords: [14.5113, 120.9912] }
  ]
};

export const transitLines = [lrt1, lrt2, mrt3, pnrNscr, pnrSouth, pnrBicol, pasigFerry, edsaCarousel];
