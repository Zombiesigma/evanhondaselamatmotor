
"use client";

import { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { MotorcycleCard } from '@/components/MotorcycleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/app/context/LanguageContext';
import { cn } from '@/lib/utils';

export default function CatalogPage() {
  const { t, language } = useLanguage();
  const db = useFirestore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 200000000]);
  const [sortBy, setSortBy] = useState<'low' | 'high'>('low');

  // Simple query without orderBy to avoid index issues
  const motorcyclesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'motorcycles'));
  }, [db]);

  const { data: motorcycles, loading } = useCollection(motorcyclesQuery);

  const filteredAndSortedBikes = useMemo(() => {
    if (!motorcycles) return [];
    
    // 1. Filter
    const filtered = motorcycles.filter(bike => {
      const nameMatch = bike.name?.toLowerCase().includes(search.toLowerCase());
      const categoryMatch = category === 'All' || bike.category === category;
      const price = bike.startingPrice || 0;
      const priceMatch = price >= priceRange[0] && price <= priceRange[1];
      return nameMatch && categoryMatch && priceMatch;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      const priceA = a.startingPrice || 0;
      const priceB = b.startingPrice || 0;
      return sortBy === 'low' ? priceA - priceB : priceB - priceA;
    });
  }, [motorcycles, search, category, priceRange, sortBy]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val);

  return (
    <div className="min-h-screen py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-expo-entry">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">{t('catalog_title')}</h1>
            <p className="text-gray-500 text-xl max-w-2xl">{t('catalog_subtitle')}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder={t('catalog_search_placeholder')} 
                className="pl-12 h-14 rounded-xl border-gray-100 bg-gray-50/50 text-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-14 rounded-xl px-8 gap-3 border-gray-100 bg-white font-bold text-black">
                  <Filter className="h-5 w-5" /> {t('catalog_filter')}
                </Button>
              </SheetTrigger>
              <SheetContent className="space-y-10 p-10 bg-white">
                <SheetHeader>
                  <SheetTitle className="text-3xl font-bold tracking-tight">{t('catalog_filter')}</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('catalog_category')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['All', 'Matic', 'Sport', 'Cub', 'Electric', 'Adventure'].map((cat) => (
                      <Button
                        key={cat}
                        variant={category === cat ? 'default' : 'outline'}
                        className={cn(
                          "rounded-xl h-12 font-bold transition-all", 
                          category === cat ? "bg-black text-white shadow-xl shadow-black/10" : "text-black border-gray-100"
                        )}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('catalog_price_range')}</label>
                  <div className="pt-4 px-2">
                    <Slider 
                      value={priceRange} 
                      onValueChange={setPriceRange} 
                      min={0} 
                      max={200000000} 
                      step={1000000}
                    />
                  </div>
                  <div className="flex justify-between text-sm font-mono font-bold text-black">
                    <span>{formatCurrency(priceRange[0])}</span>
                    <span>{formatCurrency(priceRange[1])}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('catalog_sort')}</label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="h-14 rounded-xl border-gray-100 bg-gray-50/50 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('catalog_sort_low')}</SelectItem>
                      <SelectItem value="high">{t('catalog_sort_high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="font-bold tracking-widest uppercase text-xs">Loading Catalog...</p>
          </div>
        ) : filteredAndSortedBikes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-expo-entry">
            {filteredAndSortedBikes.map((bike: any) => (
              <MotorcycleCard key={bike.id} bike={bike} />
            ))}
          </div>
        ) : (
          <div className="py-40 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
              <Search className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold tracking-tight">{t('catalog_no_results')}</h3>
              <p className="text-gray-400 text-lg">{t('catalog_subtitle')}</p>
            </div>
            <Button 
              onClick={() => { setSearch(''); setCategory('All'); setPriceRange([0, 200000000]); }} 
              className="bg-black text-white h-14 px-12 rounded-xl font-bold shadow-xl shadow-black/10"
            >
              {t('catalog_reset')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
