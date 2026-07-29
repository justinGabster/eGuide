export interface Seaport {
  name: string;
  locode: string;
  region: 'Luzon' | 'Visayas' | 'Mindanao';
  coords: [number, number]; // [lat, lng]
}

export const philippineSeaports: Seaport[] = [
  { name: "Port of Manila (North Passenger Terminal)", locode: "PHMNL", region: "Luzon", coords: [14.5967, 120.9544] },
  { name: "Port of Batangas", locode: "PHBTG", region: "Luzon", coords: [13.7542, 121.0428] },
  { name: "Port of Subic Bay", locode: "PHSFS", region: "Luzon", coords: [14.7933, 120.2711] },
  { name: "Port of Lucena", locode: "PHLCN", region: "Luzon", coords: [13.8825, 121.6214] },
  { name: "Port of Calapan", locode: "PHCPP", region: "Luzon", coords: [13.4214, 121.1842] },
  { name: "Port of Matnog", locode: "PHMTN", region: "Luzon", coords: [12.5833, 124.0858] },
  { name: "Port of Puerto Princesa", locode: "PHPPS", region: "Luzon", coords: [9.7431, 118.7297] },
  { name: "Port of Coron", locode: "PHUSU", region: "Luzon", coords: [11.9964, 120.2033] },
  { name: "Port of Cebu (Baseport)", locode: "PHCEB", region: "Visayas", coords: [10.2931, 123.9056] },
  { name: "Port of Iloilo (Domestic Terminal)", locode: "PHILO", region: "Visayas", coords: [10.6914, 122.5822] },
  { name: "Port of Dumaguete", locode: "PHDGT", region: "Visayas", coords: [9.3083, 123.3131] },
  { name: "Port of Caticlan", locode: "PHMPH", region: "Visayas", coords: [11.9272, 121.9525] },
  { name: "Port of Tagbilaran", locode: "PHTAG", region: "Visayas", coords: [9.6581, 123.8483] },
  { name: "Port of Ormoc", locode: "PHOMC", region: "Visayas", coords: [11.0028, 124.6075] },
  { name: "Port of Tacloban", locode: "PHTAC", region: "Visayas", coords: [11.2483, 124.9989] },
  { name: "Port of Allen", locode: "PHALN", region: "Visayas", coords: [12.5028, 124.2825] },
  { name: "Port of Cagayan de Oro", locode: "PHCGY", region: "Mindanao", coords: [8.5028, 124.6617] },
  { name: "Port of Davao (Sasa Wharf)", locode: "PHDVO", region: "Mindanao", coords: [7.1283, 125.6631] },
  { name: "Port of Zamboanga", locode: "PHZAM", region: "Mindanao", coords: [6.9014, 122.0672] },
  { name: "Port of General Santos (Makar Wharf)", locode: "PHGES", region: "Mindanao", coords: [6.0967, 125.1583] },
  { name: "Port of Surigao (Verano Port)", locode: "PHSUG", region: "Mindanao", coords: [9.7891, 125.4951] },
  { name: "Port of Ozamiz", locode: "PHOZC", region: "Mindanao", coords: [8.1408, 123.8436] },
  { name: "Port of Dapitan (Pulauan Port)", locode: "PHDAP", region: "Mindanao", coords: [8.6542, 123.4217] },
  { name: "Port of Nasipit", locode: "PHNAS", region: "Mindanao", coords: [8.9833, 125.3333] }
];
