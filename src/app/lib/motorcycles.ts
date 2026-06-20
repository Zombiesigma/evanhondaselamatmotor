
// This file defines the core types for motorcycles.
// The actual catalog is managed dynamically through Firestore.

export type Category = 'Matic' | 'Sport' | 'Cub' | 'Adventure' | 'Electric';

export interface Variant {
  name: string;
  price: number;
  color: string;
}

export interface Specification {
  engineType: string;
  boreStroke: string;
  displacement: string;
  compressionRatio: string;
  maxPower: string;
  maxTorque: string;
  clutchType: string;
  starterType: string;
  sparkPlug: string;
  fuelSystem: string;
  transmissionType: string;
  ignitionSystem: string;
}

export interface LeasingRow {
  dp: number;
  installments: {
    [tenure: string]: number;
  };
}

export interface Motorcycle {
  id: string;
  name: string;
  category: Category;
  startingPrice: number;
  image: string;
  gallery?: string[];
  description_id: string;
  description_en: string;
  variants: Variant[];
  specs: Specification;
  features_id: string[];
  features_en: string[];
  leasingTable?: LeasingRow[];
}

export const MOTORCYCLES_FALLBACK: Motorcycle[] = [
  {
    id: 'beat-sporty-cbs',
    name: 'New Beat Sporty CBS',
    category: 'Matic',
    startingPrice: 19425000,
    image: 'motor-beat',
    gallery: [],
    description_id: 'Ringkas, ekonomis, dan stylish untuk komuter harian di kota.',
    description_en: 'Compact, economical, and stylish for daily city commute.',
    variants: [{ name: 'CBS', price: 19425000, color: 'Hard Rock Black' }, { name: 'Deluxe', price: 20200000, color: 'Deluxe Matte Silver' }],
    specs: { 
      engineType: '4 – Langkah, SOHC, eSP', 
      boreStroke: '47.0 x 63.1 mm',
      displacement: '109,5cc',
      compressionRatio: '10,0 : 1',
      maxPower: '6.6 kW (9.0 PS) / 7.500 rpm', 
      maxTorque: '9.2 N.m (0.94 kgf.m) / 6000 rpm', 
      clutchType: 'Otomatis, Sentrifugal, Tipe Kering',
      starterType: 'Elektrik dan Kick Starter',
      sparkPlug: 'NGK MR9C-9N',
      fuelSystem: 'Injeksi (PGM-FI)', 
      transmissionType: 'Otomatis, V-Matic',
      ignitionSystem: 'Full Transisterized'
    },
    features_id: ['Lampu Depan LED', 'Power Charger'],
    features_en: ['LED Headlight', 'Power Charger']
  }
];
