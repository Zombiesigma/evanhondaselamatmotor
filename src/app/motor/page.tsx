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

  const motorcyclesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'motorcycles'));
  }, [db]);

  const { data: motorcycles, loading } = useCollection(motorcyclesQuery);

  const filteredAndSortedBikes = useMemo(() => {
    if (!motorcycles) return [];
    const filtered = motorcycles.filter(bike => {
      const nameMatch = bike.name?.toLowerCase().includes(search.toLowerCase());
      const categoryMatch = category === 'All' || bike.category === category;
      const price = bike.startingPrice || 0;
      const priceMatch = price >= priceRange[0] && price <= priceRange[1];
      return nameMatch && categoryMatch && priceMatch;
    });
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
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-screen pt-16 pb-4 px-3 md:px-6 bg-white">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header minimal */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('catalog_title')}</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{t('catalog_subtitle')}</p>
          </div>
        </div>

        {/* Search + Filter compact */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('catalog_search_placeholder')}
              className="pl-9 h-10 rounded-lg border-gray-100 bg-gray-50 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg border-gray-100 bg-white shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="space-y-8 p-6 bg-white">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold">{t('catalog_filter')}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('catalog_category')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {['All', 'Matic', 'Sport', 'Cub', 'Electric', 'Adventure'].map((cat) => (
                    <Button
                      key={cat}
                      variant={category === cat ? 'default' : 'outline'}
                      className={cn(
                        "rounded-lg h-10 text-xs font-bold",
                        category === cat ? "bg-black text-white" : "text-black border-gray-100"
                      )}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('catalog_price_range')}</label>
                <div className="pt-2 px-2">
                  <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={200000000} step={1000000} />
                </div>
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span>{formatCurrency(priceRange[0])}</span>
                  <span>{formatCurrency(priceRange[1])}</span>
                </div>
              </div>
              <div className="space-y-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('catalog_sort')}</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="h-10 rounded-lg border-gray-100 bg-gray-50 text-sm">
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

        {/* Grid 2 kolom di mobile */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-[10px] font-bold tracking-widest uppercase">Loading...</p>
          </div>
        ) : filteredAndSortedBikes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedBikes.map((bike: any) => (
              <MotorcycleCard key={bike.id} bike={bike} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <Search className="h-8 w-8 text-gray-200 mx-auto" />
            <p className="text-sm font-bold">{t('catalog_no_results')}</p>
            <Button
              onClick={() => { setSearch(''); setCategory('All'); setPriceRange([0, 200000000]); }}
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
