
export interface Dealer {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  mapUrl: string;
}

export const DEALERS: Dealer[] = [
  {
    id: 'honda-selamat-pusat',
    name: 'Honda Selamat Motor Pusat',
    address: 'Jl. Ahmad Yani No. 123, Jakarta Pusat',
    city: 'Jakarta',
    phone: '021-1234567',
    whatsapp: '6281112345678',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.24151761619!2d106.759478!3d-6.2087634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e945e3b8d9%3A0x38618d302910798f!2sJakarta!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'
  },
  {
    id: 'honda-selamat-selatan',
    name: 'Honda Selamat Motor Selatan',
    address: 'Jl. Fatmawati Raya No. 45, Jakarta Selatan',
    city: 'Jakarta',
    phone: '021-7654321',
    whatsapp: '6281112345678',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.24151761619!2d106.759478!3d-6.2087634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e945e3b8d9%3A0x38618d302910798f!2sJakarta!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'
  },
  {
    id: 'honda-selamat-bandung',
    name: 'Honda Selamat Motor Bandung',
    address: 'Jl. Asia Afrika No. 88, Bandung',
    city: 'Bandung',
    phone: '022-1234567',
    whatsapp: '6281112345678',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126748.563478!2d107.619123!3d-6.917464!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6398252477f%3A0x3e18f0580983220!2sBandung!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid'
  }
];
