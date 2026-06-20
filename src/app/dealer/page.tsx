"use client";

import { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, MessageSquare, ArrowRight, Loader2, Globe } from 'lucide-react';
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
    <div className="min-h-screen bg-white">
      {/* Header - Unified with Brand Identity */}
      <section className="sky-gradient-wash pt-48 pb-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16 animate-expo-entry">
          <div className="space-y-8 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#0d74ce] text-[11px] font-bold uppercase tracking-widest">
               <Globe className="w-3.5 h-3.5" />
               Network Infrastructure
            </div>
            <h1 className="text-7xl md:text-9xl font-bold tracking-expo-display leading-[0.85]">{t('dealer_title')}</h1>
            <p className="text-xl md:text-3xl text-gray-500 leading-relaxed font-medium max-w-2xl">
              {t('dealer_subtitle')}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 max-w-5xl">
            <div className="relative flex-[2]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input 
                placeholder={t('dealer_search')}
                className="flex w-full pl-16 h-20 rounded-[28px] border-gray-100 bg-white shadow-2xl shadow-black/5 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#0d74ce]/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-20 rounded-[28px] border-gray-100 bg-white shadow-2xl shadow-black/5 text-xl font-bold">
                  <SelectValue placeholder={t('dealer_all_cities')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {cities.map(c => (
                    <SelectItem key={c} value={c} className="text-lg font-bold py-3">{c === 'All' ? t('dealer_all_cities') : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Node Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-8 text-gray-100">
              <Loader2 className="w-20 h-20 animate-spin" />
              <p className="font-bold tracking-[0.4em] uppercase text-[10px] text-gray-300">Syncing Network Nodes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {filteredDealers.map((dealer) => (
                <Card key={dealer.id} className="border-none shadow-[0_50px_100px_rgba(0,0,0,0.06)] rounded-[48px] overflow-hidden flex flex-col animate-expo-entry hover:scale-[1.01] transition-all duration-700 bg-white">
                  <div className="w-full h-[400px] relative bg-gray-50 border-b border-gray-50 group">
                    {dealer.mapUrl ? (
                      <iframe 
                        src={dealer.mapUrl} 
                        className="absolute inset-0 w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-1000 opacity-80 group-hover:opacity-100"
                        loading="lazy"
                      ></iframe>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-gray-300">
                        <MapPin className="w-16 h-16 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Map Data Pending</span>
                      </div>
                    )}
                    <div className="absolute top-8 left-8">
                       <Badge className="bg-white/80 backdrop-blur-xl text-black border-none px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl">
                         {dealer.city} Node
                       </Badge>
                    </div>
                  </div>
                  <CardContent className="p-12 md:p-16 space-y-12 flex flex-col justify-center">
                    <div className="space-y-6">
                      <h3 className="text-4xl md:text-5xl font-bold tracking-tight">{dealer.name}</h3>
                      <div className="flex items-start gap-4 text-gray-500 text-lg leading-relaxed font-medium">
                        <MapPin className="h-6 w-6 shrink-0 text-[#0d74ce] mt-1" />
                        <span>{dealer.address}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-5 p-6 bg-[#fafafa] rounded-3xl border border-gray-100 group hover:border-[#0d74ce] transition-all">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/5 text-gray-400 group-hover:text-[#0d74ce] transition-colors">
                          <Phone className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Support</span>
                          <a href={`tel:${dealer.phone}`} className="text-lg font-bold text-black">{dealer.phone || 'N/A'}</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 p-6 bg-[#fafafa] rounded-3xl border border-gray-100 group hover:border-green-500 transition-all">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/5 text-gray-400 group-hover:text-green-500 transition-colors">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp</span>
                          <a href={`https://wa.me/${dealer.whatsapp}`} className="text-lg font-bold text-black">+{dealer.whatsapp}</a>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full h-20 bg-black text-white hover:bg-zinc-800 rounded-3xl shadow-2xl shadow-black/10 transition-all hover:scale-[1.02]" asChild>
                      <a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-10 text-xl font-bold">
                        <span>{t('dealer_contact')}</span>
                        <ArrowRight className="h-7 w-7" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredDealers.length === 0 && (
            <div className="text-center py-60 space-y-10 animate-in fade-in zoom-in duration-700">
              <div className="w-32 h-32 bg-[#fafafa] rounded-full flex items-center justify-center mx-auto text-gray-200 shadow-inner">
                <Search className="h-16 w-16" />
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-bold tracking-tight">{t('catalog_no_results')}</h3>
                <p className="text-gray-400 text-xl font-medium">No official nodes found in this territory.</p>
              </div>
              <Button onClick={() => { setSearch(''); setSelectedCity('All'); }} variant="outline" className="rounded-2xl px-16 h-16 border-gray-100 font-bold text-black shadow-xl">
                {t('catalog_reset')}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
