
"use client";

import { use, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CreditCalculator } from '@/components/CreditCalculator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, Plus, ShieldCheck, Loader2, ChevronRight, Palette, CheckCircle2, Zap } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="animate-spin h-20 w-20 text-black/5" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-3 h-3 bg-black rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300">Syncing Specifications...</p>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-12 px-6">
        <div className="space-y-4 text-center">
           <h2 className="text-5xl font-bold tracking-tight">System Node Missing</h2>
           <p className="text-gray-400 font-medium">The requested asset identifier does not exist in our registry.</p>
        </div>
        <Button asChild variant="outline" className="px-12 h-16 rounded-2xl font-bold border-gray-100 text-black shadow-xl">
          <Link href="/motor">Return to Inventory</Link>
        </Button>
      </div>
    );
  }

  const activeVariant = bike.variants && bike.variants[activeVariantIndex] 
    ? bike.variants[activeVariantIndex] 
    : { name: 'Standard', price: bike.startingPrice || 0, color: 'Base' };

  // Logic: Only use placeholders if no real URLs are available in image or gallery
  const mainImgIsPlaceholder = !bike.image?.startsWith('http');
  const galleryUrls = (bike.gallery || []).filter((url: string) => url.startsWith('http'));
  
  const finalGallery = useMemo(() => {
    let images: string[] = [];
    
    if (bike.image?.startsWith('http')) {
      images.push(bike.image);
    }
    
    images = [...images, ...galleryUrls];
    
    // If we have NO real images at all, use the placeholder logic
    if (images.length === 0) {
      const placeholder = PlaceHolderImages.find(img => img.id === bike.image)?.imageUrl || PlaceHolderImages[0].imageUrl;
      images.push(placeholder);
    }
    
    return images;
  }, [bike.image, galleryUrls]);

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
    <div className="min-h-screen bg-white text-[#171717] selection:bg-black selection:text-white">
      {/* Cinematic Asset Focus */}
      <section className="relative sky-gradient-wash pt-32 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 animate-expo-entry">
            <Link href="/motor" className="inline-flex items-center gap-4 text-[11px] font-bold text-black hover:text-[#0d74ce] uppercase tracking-[0.3em] bg-white/50 backdrop-blur-xl px-8 py-3 rounded-2xl border border-gray-100 shadow-xl transition-all hover:scale-[1.05]">
              <ChevronLeft className="h-4 w-4" /> {t('detail_back')}
            </Link>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-24 items-start">
            <div className="space-y-12 animate-expo-entry">
              <div className="space-y-6">
                <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[#0d74ce] flex items-center gap-3">
                   <Zap className="w-3 h-3 fill-current" />
                   {bike.category} INFRASTRUCTURE
                </span>
                <h1 className="text-7xl md:text-9xl font-bold tracking-expo-display leading-[0.8] text-[#171717]">
                  {bike.name}
                </h1>
              </div>
              
              <div className="space-y-8 border-l-4 border-black pl-10">
                <p className="text-xl md:text-3xl text-gray-500 max-w-lg leading-relaxed font-medium italic">
                  {description || t('hero_subtitle')}
                </p>
                <div className="flex items-center gap-4">
                   <div className="h-px w-12 bg-black"></div>
                   <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      EDITION: {activeVariant.color}
                   </div>
                </div>
              </div>

              <div className="pt-12 flex flex-col sm:flex-row gap-8">
                 <Button className="bg-black text-white hover:bg-zinc-800 h-24 px-16 rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.2)] text-2xl font-bold flex-1 transition-all hover:scale-[1.03] active:scale-95" asChild>
                   <Link href="/ajukan-kredit">{t('nav_acquire')}</Link>
                 </Button>
                 <div className="flex-1 p-8 bg-white border border-gray-100 rounded-[28px] shadow-xl flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">OTR ESTIMATION</span>
                    <span className="text-4xl font-bold tracking-tight">{formatCurrency(activeVariant.price)}</span>
                 </div>
              </div>
            </div>
            
            <div className="space-y-10 animate-scale-entry">
               <div className="relative aspect-[16/11] bg-[#fdfdfd] rounded-[60px] shadow-[0_60px_120px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-50 p-4 group">
                  <Image 
                    src={finalGallery[activeImageIndex] || finalGallery[0]} 
                    alt={bike.name} 
                    fill 
                    className="object-cover rounded-[50px] transition-all duration-1000 group-hover:scale-105"
                    priority
                  />
               </div>

               <div className="flex gap-6 overflow-x-auto pb-6 px-4 no-scrollbar">
                  {finalGallery.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "relative w-32 aspect-square rounded-[24px] overflow-hidden border-2 transition-all shrink-0 hover:scale-110",
                        activeImageIndex === idx ? 'border-black scale-110 shadow-2xl' : 'border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
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

      {/* Technical Blueprints */}
      <section className="bg-[#fafafa] border-y border-gray-100 py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
            <div className="lg:col-span-8 space-y-32">
              <div className="space-y-20">
                <div className="flex flex-col gap-4">
                  <h2 className="text-5xl font-bold tracking-tight">{t('detail_technical')}</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-1bg-black rounded-full"></div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5em]">SYSTEM BLUEPRINT</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-[50px] overflow-hidden shadow-2xl">
                  {bike.specs ? Object.entries(bike.specs).map(([key, val]) => {
                    const label = specLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
                    if (!val) return null;
                    return (
                      <div key={key} className="bg-white p-14 group hover:bg-gray-50/50 transition-all border-r border-b border-gray-50">
                        <p className="font-mono text-[11px] text-gray-300 uppercase tracking-[0.4em] mb-6 font-bold group-hover:text-black transition-colors">
                          {label}
                        </p>
                        <p className="text-2xl font-bold text-black tracking-tight leading-snug">
                          {val as any}
                        </p>
                      </div>
                    );
                  }) : (
                    <div className="bg-white p-20 col-span-2 text-center text-gray-300 font-bold uppercase tracking-[0.3em] text-sm italic">
                      Specifications currently syncing from system core...
                    </div>
                  )}
                </div>
              </div>

              {features.length > 0 && (
                <div className="space-y-20">
                  <h2 className="text-5xl font-bold tracking-tight">{t('detail_features')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-12 bg-white border border-gray-50 rounded-[40px] hover:shadow-[0_40px_100px_rgba(0,0,0,0.08)] transition-all group hover:-translate-y-2">
                        <span className="font-bold text-black text-2xl tracking-tight">{feature}</span>
                        <div className="w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center text-gray-200 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                          <Plus className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-16">
                <div className="p-14 bg-white border border-gray-50 rounded-[50px] shadow-[0_50px_100px_rgba(0,0,0,0.08)] space-y-16">
                  <div className="space-y-8">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5em]">{t('detail_configuration')}</p>
                    <div className="space-y-4">
                       <h3 className="text-5xl font-bold tracking-tight">{activeVariant.name}</h3>
                       <div className="flex items-center gap-4">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-gray-500">{activeVariant.color} Limited</span>
                       </div>
                    </div>
                    <p className="text-5xl font-bold text-[#0d74ce] tracking-tight">{formatCurrency(activeVariant.price)}</p>
                  </div>
                  
                  {bike.variants && bike.variants.length > 1 && (
                    <div className="space-y-4">
                      {bike.variants.map((v: any, idx: number) => (
                        <button 
                          key={v.name} 
                          onClick={() => setActiveVariantIndex(idx)}
                          className={cn(
                            "w-full text-left p-8 border-2 rounded-[28px] transition-all flex justify-between items-center group",
                            activeVariantIndex === idx ? 'border-black bg-gray-50/50 shadow-2xl' : 'border-gray-50 hover:border-gray-200'
                          )}
                        >
                          <div className="space-y-2">
                            <span className="font-bold text-lg block">{v.name}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{v.color} EDITION</span>
                          </div>
                          <ChevronRight className={cn("h-6 w-6 transition-all", activeVariantIndex === idx ? "text-black translate-x-2" : "text-gray-100")} />
                        </button>
                      ))}
                    </div>
                  )}

                  <Button className="w-full h-24 bg-black text-white rounded-[32px] font-bold text-2xl shadow-2xl transition-all hover:scale-[1.02]" asChild>
                    <Link href="/ajukan-kredit">{t('detail_apply')}</Link>
                  </Button>

                  <div className="pt-12 border-t border-gray-50 flex items-center gap-6 text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em]">
                    <div className="w-14 h-14 rounded-[24px] bg-blue-50 flex items-center justify-center text-[#0d74ce]">
                       <ShieldCheck className="h-7 w-7" />
                    </div>
                    <span>HONDA OFFICIAL<br/>PLATINUM WARRANTY</span>
                  </div>
                </div>

                <CreditCalculator 
                  initialPrice={activeVariant.price} 
                  motorcycleName={`${bike.name} ${activeVariant.name}`} 
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
