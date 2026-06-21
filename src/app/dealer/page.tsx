"use client";

import { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DealerPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');

  const dealerQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'dealers'), orderBy('city', 'asc'));
  }, [db]);

  const { data: dealers, loading } = useCollection(dealerQuery);

  const cities = useMemo(() => {
    if (!dealers) return ['All'];
    return ['All', ...Array.from(new Set(dealers.map(d => d.city)))].sort();
  }, [dealers]);

  const filteredDealers = useMemo(() => {
    if (!dealers) return [];
    return dealers.filter(d => {
      const nameMatch = d.name?.toLowerCase().includes(search.toLowerCase());
      const addrMatch = d.address?.toLowerCase().includes(search.toLowerCase());
      const cityMatch = d.city?.toLowerCase().includes(search.toLowerCase());
      const matchesSearch = nameMatch || addrMatch || cityMatch;
      const matchesCity = selectedCity === 'All' || d.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [dealers, search, selectedCity]);

  return (
    <div className="min-h-screen bg-white pt-16 pb-4 px-3 md:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header ringkas */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{t('dealer_title')}</h1>
          <p className="text-[10px] text-gray-500 leading-tight">{t('dealer_subtitle')}</p>
        </div>

        {/* Search & Filter compact */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('dealer_search')}
              className="pl-9 h-10 rounded-lg border-gray-100 bg-gray-50 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="h-10 w-[130px] rounded-lg border-gray-100 bg-gray-50 text-sm font-bold">
              <SelectValue placeholder={t('dealer_all_cities')} />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {cities.map(c => (
                <SelectItem key={c} value={c} className="text-sm font-bold py-2">
                  {c === 'All' ? t('dealer_all_cities') : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dealer list */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-[10px] font-bold tracking-widest uppercase">Syncing...</p>
          </div>
        ) : filteredDealers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
            {filteredDealers.map((dealer) => (
              <div key={dealer.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                {/* Map mini */}
                <div className="relative aspect-[16/9] bg-gray-50">
                  {dealer.mapUrl ? (
                    <iframe
                      src={dealer.mapUrl}
                      className="absolute inset-0 w-full h-full border-0 grayscale opacity-80"
                      loading="lazy"
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                      <MapPin className="w-8 h-8" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-white/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    {dealer.city}
                  </Badge>
                </div>

                {/* Info dealer */}
                <div className="p-3 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold">{dealer.name}</h3>
                    <p className="text-[10px] text-gray-500 flex items-start gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-[#0d74ce]" />
                      {dealer.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${dealer.phone}`}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-bold"
                    >
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {dealer.phone || 'N/A'}
                    </a>
                    <a
                      href={`https://wa.me/${dealer.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-bold"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                      WhatsApp
                    </a>
                  </div>

                  <Button
                    className="w-full h-9 bg-black text-white rounded-lg text-xs font-bold shadow-sm"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${dealer.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      {t('dealer_contact')} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <Search className="h-8 w-8 text-gray-200 mx-auto" />
            <p className="text-sm font-bold">{t('catalog_no_results')}</p>
            <Button
              onClick={() => { setSearch(''); setSelectedCity('All'); }}
              className="bg-black text-white h-9 px-6 rounded-lg text-xs font-bold"
            >
              {t('catalog_reset')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
