"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MotorcycleCard } from "@/components/MotorcycleCard";
import { AIAssistant } from "@/components/AIAssistant";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, limit } from "firebase/firestore";

export default function Home() {
  const { t } = useLanguage();
  const db = useFirestore();

  const lineupQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'motorcycles'), limit(3));
  }, [db]);

  const { data: motorcycles, loading } = useCollection(lineupQuery);

  const featuredBikes = useMemo(() => {
    if (!motorcycles) return [];
    return motorcycles;
  }, [motorcycles]);

  return (
    <div className="bg-white text-[#171717] selection:bg-black selection:text-white overflow-x-hidden">
      <main>
        {/* ========== HERO SECTION - CONDENSED ========== */}
        <section className="relative sky-gradient-wash pt-24 pb-12 px-6 min-h-[70vh] flex flex-col items-center justify-center">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-expo-entry">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0d74ce] text-[10px] font-bold uppercase tracking-widest">
               <span className="w-1.5 h-1.5 rounded-full bg-[#0d74ce] animate-pulse"></span>
               {t('hero_badge')}
             </div>
             <h1 className="text-5xl md:text-7xl font-bold tracking-expo-display leading-[1] text-[#171717]">
               {t('hero_title')}
             </h1>
             <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed font-medium">
               {t('hero_subtitle')}
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
               <Button size="lg" className="bg-black text-white hover:bg-zinc-800 h-14 px-10 rounded-xl text-base font-bold shadow-xl" asChild>
                 <Link href="/motor">{t('hero_explore')}</Link>
               </Button>
               <Button variant="outline" size="lg" className="h-14 px-10 rounded-xl bg-white border-gray-100 text-base font-bold hover:bg-gray-50 transition-all" asChild>
                 <Link href="/ajukan-kredit">{t('hero_start')}</Link>
               </Button>
             </div>
          </div>

          <div className="mt-12 relative w-full max-w-6xl mx-auto animate-expo-entry delay-200">
             <div className="relative aspect-[21/9] w-full bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 p-2">
                <Image 
                  src="https://picsum.photos/seed/honda-studio-mockup/1400/600" 
                  alt="Honda Experience" 
                  fill 
                  className="object-cover rounded-[24px]"
                  priority
                  data-ai-hint="honda motorcycle clean studio"
                />
             </div>
          </div>
        </section>

        {/* ========== LINEUP SHOWCASE - TIGHTER ========== */}
        <section className="section-spacing px-6">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{t('lineup_title')}</h2>
                <p className="text-gray-500 text-lg max-w-md font-medium leading-relaxed">
                  {t('lineup_subtitle')}
                </p>
              </div>
              <Link href="/motor" className="text-[#0d74ce] text-base font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
                {t('lineup_view_all')} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-gray-200" />
              </div>
            ) : featuredBikes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredBikes.map((bike: any) => (
                  <MotorcycleCard key={bike.id} bike={bike} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-300 font-bold uppercase tracking-widest text-[10px] border border-dashed rounded-3xl">
                No motorcycles registered in lineup
              </div>
            )}
          </div>
        </section>

        {/* ========== AI ASSISTANT SECTION - COMPACT ========== */}
        <section className="bg-[#fafafa] section-spacing px-6 border-y border-gray-100">
          <div className="max-w-7xl mx-auto">
             <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                <div className="space-y-6">
                   <div className="space-y-4">
                     <span className="text-[10px] font-bold text-[#0d74ce] uppercase tracking-widest">{t('ai_badge')}</span>
                     <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-none">{t('ai_title')}</h2>
                   </div>
                   <p className="text-lg text-gray-500 leading-relaxed border-l-4 border-black pl-6 font-medium italic">
                     {t('ai_subtitle')}
                   </p>
                </div>
                <div className="bg-white border border-gray-100 p-8 md:p-12 rounded-[32px] shadow-xl">
                   <AIAssistant />
                </div>
             </div>
          </div>
        </section>

        {/* ========== CONTACT CTA - TIGHTER ========== */}
        <section className="section-spacing px-6 text-center bg-white">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{t('contact_cta_title')}</h2>
            <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed font-medium">
              {t('contact_cta_subtitle')}
            </p>
            <div className="pt-4 flex flex-col items-center gap-6">
               <Button size="lg" className="bg-black text-white hover:bg-zinc-800 h-16 px-12 rounded-2xl w-full max-w-sm shadow-xl text-lg font-bold transition-all hover:scale-[1.02]" asChild>
                 <a href="https://wa.me/6281112345678">{t('contact_cta_button')}</a>
               </Button>
               <Link href="/dealer" className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-2">
                 {t('contact_cta_locate')} <ArrowRight className="h-4 w-4" />
               </Link>
            </div>
          </div>
        </section>
      </main>

      <a
        href="https://wa.me/6281112345678"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[120] w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95 group"
      >
        <Phone className="w-5 h-5 fill-current group-hover:rotate-12 transition-transform" />
      </a>
    </div>
  );
}
