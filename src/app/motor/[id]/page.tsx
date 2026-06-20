"use client";

import { use, useState, useMemo } from 'react';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-black/10" />
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-300">Syncing Specs...</p>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6 px-6">
        <div className="space-y-2 text-center">
           <h2 className="text-3xl font-bold tracking-tight">System Node Missing</h2>
           <p className="text-gray-400 font-medium">Requested identifier not found.</p>
        </div>
        <Button asChild variant="outline" className="px-8 h-12 rounded-xl font-bold border-gray-100 shadow-lg">
          <Link href="/motor">Return to Inventory</Link>
        </Button>
      </div>
    );
  }

  const activeVariant = bike.variants && bike.variants[activeVariantIndex] 
    ? bike.variants[activeVariantIndex] 
    : { name: 'Standard', price: bike.startingPrice || 0, color: 'Base' };

  const description = language === 'id' ? bike.description_id : bike.description_en;
  const features = language === 'id' ? (bike.features_id || []) : (bike.features_en || []);

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
      maximumFractionDigits: 0 
    }).format(val);

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      {/* Cinematic Asset Focus - Tightened */}
      <section className="relative sky-gradient-wash pt-24 pb-12 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-expo-entry">
            <Link href="/motor" className="inline-flex items-center gap-3 text-[10px] font-bold text-black hover:text-[#0d74ce] uppercase tracking-[0.2em] bg-white/50 backdrop-blur-xl px-6 py-2.5 rounded-xl border border-gray-100 shadow-md transition-all">
              <ChevronLeft className="h-3.5 w-3.5" /> {t('detail_back')}
            </Link>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-expo-entry">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#0d74ce] flex items-center gap-2">
                   <Zap className="w-2.5 h-2.5 fill-current" />
                   {bike.category} SERIES
                </span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-expo-display leading-[0.9] text-[#171717]">
                  {bike.name}
                </h1>
              </div>
              
              <div className="space-y-4 border-l-2 border-black pl-6">
                <p className="text-lg md:text-xl text-gray-500 max-w-md leading-relaxed font-medium italic">
                  {description || t('hero_subtitle')}
                </p>
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                   COLOR: {activeVariant.color}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                 <Button className="bg-black text-white hover:bg-zinc-800 h-16 px-10 rounded-[20px] shadow-lg text-xl font-bold flex-1 transition-all" asChild>
                   <Link href="/ajukan-kredit">{t('nav_acquire')}</Link>
                 </Button>
                 <div className="flex-1 p-4 px-6 bg-white border border-gray-100 rounded-[20px] shadow-md flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">OTR STARTING</span>
                    <span className="text-2xl font-bold tracking-tight">{formatCurrency(activeVariant.price)}</span>
                 </div>
              </div>
            </div>
            
            <div className="space-y-6 animate-scale-entry">
               <div className="relative aspect-[16/11] bg-[#fdfdfd] rounded-[40px] shadow-2xl overflow-hidden border border-gray-50 p-2 group">
                  <Image 
                    src={finalGallery[activeImageIndex] || finalGallery[0]} 
                    alt={bike.name} 
                    fill 
                    className="object-cover rounded-[32px] transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
               </div>

               <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
                  {finalGallery.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "relative w-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                        activeImageIndex === idx ? 'border-black scale-105 shadow-lg' : 'border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                      )}
                    >
                      <Image src={img} alt={`Asset View ${idx}`} fill className="object-cover" />
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Blueprints - CONDENSED */}
      <section className="bg-[#fafafa] border-y border-gray-100 py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-16">
              <div className="space-y-8">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-bold tracking-tight">{t('detail_technical')}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-black rounded-full"></div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.4em]">SYSTEM BLUEPRINT</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-[32px] overflow-hidden shadow-lg">
                  {bike.specs ? Object.entries(bike.specs).map(([key, val]) => {
                    const label = specLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
                    if (!val) return null;
                    return (
                      <div key={key} className="bg-white p-8 group hover:bg-gray-50/50 transition-all border-r border-b border-gray-50">
                        <p className="font-mono text-[9px] text-gray-300 uppercase tracking-[0.3em] mb-2 font-bold group-hover:text-black">
                          {label}
                        </p>
                        <p className="text-xl font-bold text-black tracking-tight leading-snug">
                          {val as any}
                        </p>
                      </div>
                    );
                  }) : (
                    <div className="bg-white p-12 col-span-2 text-center text-gray-300 font-bold uppercase tracking-[0.2em] text-xs">
                      Specs syncing...
                    </div>
                  )}
                </div>
              </div>

              {features.length > 0 && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold tracking-tight">{t('detail_features')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-8 bg-white border border-gray-50 rounded-[28px] hover:shadow-xl transition-all group">
                        <span className="font-bold text-black text-xl tracking-tight">{feature}</span>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-200 group-hover:bg-black group-hover:text-white transition-all">
                          <Plus className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-8">
                <div className="p-8 bg-white border border-gray-50 rounded-[32px] shadow-xl space-y-8">
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.4em]">{t('detail_configuration')}</p>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-bold tracking-tight">{activeVariant.name}</h3>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{activeVariant.color}</span>
                       </div>
                    </div>
                    <p className="text-3xl font-bold text-[#0d74ce] tracking-tight">{formatCurrency(activeVariant.price)}</p>
                  </div>
                  
                  {bike.variants && bike.variants.length > 1 && (
                    <div className="space-y-2">
                      {bike.variants.map((v: any, idx: number) => (
                        <button 
                          key={v.name} 
                          onClick={() => setActiveVariantIndex(idx)}
                          className={cn(
                            "w-full text-left p-4 border-2 rounded-[16px] transition-all flex justify-between items-center group",
                            activeVariantIndex === idx ? 'border-black bg-gray-50/50 shadow-md' : 'border-gray-50 hover:border-gray-200'
                          )}
                        >
                          <div className="space-y-1">
                            <span className="font-bold text-base block">{v.name}</span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{v.color}</span>
                          </div>
                          <ChevronRight className={cn("h-4 w-4 transition-all", activeVariantIndex === idx ? "text-black translate-x-1" : "text-gray-100")} />
                        </button>
                      ))}
                    </div>
                  )}

                  <Button className="w-full h-16 bg-black text-white rounded-[20px] font-bold text-xl shadow-xl transition-all" asChild>
                    <Link href="/ajukan-kredit">{t('detail_apply')}</Link>
                  </Button>

                  <div className="pt-6 border-t border-gray-50 flex items-center gap-4 text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0d74ce]">
                       <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span>HONDA OFFICIAL<br/>WARRANTY INCLUDED</span>
                  </div>
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
