"use client";

import { use, useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CreditCalculator } from '@/components/CreditCalculator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, Plus, ShieldCheck, Loader2, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function MotorcycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, language } = useLanguage();
  const db = useFirestore();
  const { id } = use(params);

  const docRef = useMemo(() => id ? doc(db, 'motorcycles', id) : null, [db, id]);
  const { data: bike, loading } = useDoc(docRef);

  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi layar mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const finalGallery = useMemo(() => {
    if (!bike) return [];
    let images: string[] = [];
    if (bike.image?.startsWith('http')) images.push(bike.image);
    const galleryUrls = (bike.gallery || []).filter((url: string) => url?.startsWith('http'));
    images = [...images, ...galleryUrls];
    if (images.length === 0) {
      const placeholder = PlaceHolderImages.find(img => img.id === bike.image)?.imageUrl || PlaceHolderImages[0].imageUrl;
      images.push(placeholder);
    }
    return images;
  }, [bike]);

  const activeVariant = useMemo(() => {
    if (!bike) return { name: 'Standard', price: 0, color: 'Base' };
    return bike.variants && bike.variants[activeVariantIndex]
      ? bike.variants[activeVariantIndex]
      : { name: 'Standard', price: bike.startingPrice || 0, color: 'Base' };
  }, [bike, activeVariantIndex]);

  const description = useMemo(() =>
    bike ? (language === 'id' ? bike.description_id : bike.description_en) : '',
  [bike, language]);

  const features = useMemo(() =>
    bike ? (language === 'id' ? (bike.features_id || []) : (bike.features_en || [])) : [],
  [bike, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin h-8 w-8 text-black/10" />
        <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-gray-300">Syncing Specs...</p>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4 px-6">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold tracking-tight">System Node Missing</h2>
          <p className="text-gray-400 text-xs font-medium">Requested identifier not found.</p>
        </div>
        <Button asChild variant="outline" className="px-6 h-10 rounded-lg font-bold border-gray-100 shadow-sm text-xs">
          <Link href="/motor">Return to Inventory</Link>
        </Button>
      </div>
    );
  }

  const specLabels: Record<string, string> = {
    engineType: language === 'id' ? 'Tipe Mesin' : 'Engine Type',
    boreStroke: language === 'id' ? 'Diameter x Langkah' : 'Bore x Stroke',
    displacement: language === 'id' ? 'Volume Langkah' : 'Displacement',
    compressionRatio: language === 'id' ? 'Perbandingan Kompresi' : 'Compression Ratio',
    maxPower: language === 'id' ? 'Daya Maksimum' : 'Maximum Power',
    maxTorque: language === 'id' ? 'Torsi Maksimum' : 'Maximum Torque',
    clutchType: language === 'id' ? 'Kopling' : 'Clutch Type',
    starterType: language === 'id' ? 'Starter' : 'Starter System',
    sparkPlug: language === 'id' ? 'Busi' : 'Spark Plug',
    fuelSystem: language === 'id' ? 'Sistem Bahan Bakar' : 'Fuel System',
    transmissionType: language === 'id' ? 'Transmisi' : 'Transmission',
    ignitionSystem: language === 'id' ? 'Sistem Pengapian' : 'Ignition System',
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  // ======================= DESKTOP LAYOUT =======================
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-white text-[#171717]">
        {/* Hero Desktop */}
        <section className="pt-24 pb-12 px-8 md:px-12">
          <div className="max-w-7xl mx-auto">
            <Link href="/motor" className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-[#0d74ce] uppercase tracking-widest mb-8">
              <ChevronLeft className="h-4 w-4" /> {t('detail_back')}
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Kiri: Gambar */}
              <div className="space-y-6">
                <div className="relative aspect-[16/10] bg-[#fdfdfd] rounded-3xl overflow-hidden border shadow-xl">
                  <Image 
                    src={finalGallery[activeImageIndex] || finalGallery[0]} 
                    alt={bike.name} 
                    fill 
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {finalGallery.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                        activeImageIndex === idx ? 'border-black scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      <Image src={img} alt={`Asset ${idx}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Kanan: Info */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#0d74ce] flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-current" /> {bike.category} SERIES
                  </span>
                  <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">{bike.name}</h1>
                  <p className="text-lg text-gray-500 leading-relaxed italic max-w-lg">
                    {description || t('hero_subtitle')}
                  </p>
                </div>

                <div className="flex items-stretch gap-4">
                  <div className="flex-1 bg-black text-white rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-300">OTR Price</span>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(activeVariant.price)}</p>
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest text-gray-400">{activeVariant.color}</span>
                  </div>
                  <Button className="bg-white border-2 border-black text-black hover:bg-gray-50 px-8 rounded-2xl font-bold text-lg shadow-md" asChild>
                    <Link href="/ajukan-kredit">{t('nav_acquire')}</Link>
                  </Button>
                </div>

                {bike.variants && bike.variants.length > 1 && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pilihan Varian</p>
                    <div className="space-y-2">
                      {bike.variants.map((v: any, idx: number) => (
                        <button
                          key={v.name}
                          onClick={() => setActiveVariantIndex(idx)}
                          className={cn(
                            "w-full text-left p-4 border-2 rounded-xl flex justify-between items-center font-bold transition-all",
                            activeVariantIndex === idx ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'
                          )}
                        >
                          <span className="text-base">{v.name}</span>
                          <span className="text-sm text-gray-500 uppercase">{v.color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Spesifikasi & Kalkulator Desktop */}
        <section className="bg-[#fafafa] border-y border-gray-100 px-8 md:px-12 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Spesifikasi + Fitur */}
              <div className="lg:col-span-2 space-y-12">
                <div>
                  <h2 className="text-3xl font-bold mb-8">{t('detail_technical')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {bike.specs ? Object.entries(bike.specs).map(([key, val]) => {
                      const label = specLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
                      if (!val) return null;
                      return (
                        <div key={key} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                          <p className="text-base font-bold text-black">{val as any}</p>
                        </div>
                      );
                    }) : (
                      <p className="col-span-full text-center text-gray-300">Specs syncing...</p>
                    )}
                  </div>
                </div>

                {features.length > 0 && (
                  <div>
                    <h2 className="text-3xl font-bold mb-6">{t('detail_features')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                          <span className="font-bold text-lg">{feature}</span>
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                            <Plus className="h-5 w-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Kalkulator Sticky */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
                    <ShieldCheck className="h-5 w-5" />
                    {t('detail_apply')}
                  </div>
                  <CreditCalculator
                    initialPrice={activeVariant.price}
                    motorcycleName={bike.name}
                    leasingTable={bike.leasingTable}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ======================= MOBILE LAYOUT (tidak berubah) =======================
  return (
    <div className="min-h-screen bg-white text-[#171717]">
      {/* Mobile-first compact hero */}
      <section className="pt-16 pb-2 px-3">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Back link kecil */}
          <Link href="/motor" className="inline-flex items-center gap-1 text-[10px] font-bold text-black hover:text-[#0d74ce] uppercase tracking-widest">
            <ChevronLeft className="h-3 w-3" /> {t('detail_back')}
          </Link>

          {/* Gambar utama lebih pendek */}
          <div className="relative aspect-[16/9] bg-[#fdfdfd] rounded-2xl overflow-hidden border shadow-md">
            <Image
              src={finalGallery[activeImageIndex] || finalGallery[0]}
              alt={bike.name}
              fill
              className="object-cover rounded-xl"
              priority
            />
          </div>

          {/* Thumbnail galeri kecil */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {finalGallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={cn(
                  "relative w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0",
                  activeImageIndex === idx ? 'border-black' : 'border-transparent opacity-50'
                )}
              >
                <Image src={img} alt={`Asset ${idx}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Info utama motor */}
      <section className="px-3 pb-6 space-y-5">
        <div className="space-y-1">
          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#0d74ce] flex items-center gap-1">
            <Zap className="w-2 h-2 fill-current" /> {bike.category} SERIES
          </span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{bike.name}</h1>
          <p className="text-xs text-gray-500 leading-snug line-clamp-2 italic">
            {description || t('hero_subtitle')}
          </p>
        </div>

        {/* Harga & Tombol */}
        <div className="flex items-stretch gap-2">
          <div className="flex-1 bg-black text-white rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[7px] font-bold uppercase tracking-widest text-gray-300">OTR</span>
              <p className="text-base font-bold">{formatCurrency(activeVariant.price)}</p>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{activeVariant.color}</span>
          </div>
          <Button className="bg-white border-2 border-black text-black hover:bg-gray-50 h-auto px-4 rounded-xl font-bold text-xs shadow-sm" asChild>
            <Link href="/ajukan-kredit">{t('nav_acquire')}</Link>
          </Button>
        </div>

        {/* Varian */}
        {bike.variants && bike.variants.length > 1 && (
          <div className="space-y-2">
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Varian</p>
            {bike.variants.map((v: any, idx: number) => (
              <button
                key={v.name}
                onClick={() => setActiveVariantIndex(idx)}
                className={cn(
                  "w-full text-left p-2 border rounded-lg flex justify-between items-center text-xs font-bold",
                  activeVariantIndex === idx ? 'border-black bg-gray-50' : 'border-gray-100'
                )}
              >
                <span>{v.name}</span>
                <span className="text-[8px] text-gray-400 uppercase">{v.color}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Spesifikasi & Fitur */}
      <section className="bg-[#fafafa] border-y border-gray-100 px-3 py-5 space-y-5">
        <div className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">{t('detail_technical')}</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {bike.specs ? Object.entries(bike.specs).map(([key, val]) => {
              const label = specLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
              if (!val) return null;
              return (
                <div key={key} className="bg-white p-2 rounded-lg border border-gray-50">
                  <p className="text-[7px] text-gray-400 uppercase tracking-widest font-bold">{label}</p>
                  <p className="text-xs font-bold text-black mt-0.5">{val as any}</p>
                </div>
              );
            }) : (
              <p className="text-[9px] text-gray-300 col-span-2 text-center py-4">Specs syncing...</p>
            )}
          </div>
        </div>

        {features.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-base font-bold tracking-tight">{t('detail_features')}</h2>
            <div className="grid grid-cols-1 gap-1.5">
              {features.map((feature: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-50">
                  <span className="text-xs font-bold">{feature}</span>
                  <div className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center text-gray-300">
                    <Plus className="h-3 w-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Kalkulator & Simulasi */}
      <section className="px-3 py-5 space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('detail_apply')}
        </div>
        <CreditCalculator
          initialPrice={activeVariant.price}
          motorcycleName={bike.name}
          leasingTable={bike.leasingTable}
        />
      </section>
    </div>
  );
}
