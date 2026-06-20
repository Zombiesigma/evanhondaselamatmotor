
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
    return query(collection(db, 'motorcycles'), limit(12));
  }, [db]);

  const { data: motorcycles, loading } = useCollection(lineupQuery);

  const featuredBikes = useMemo(() => {
    if (!motorcycles) return [];
    // Just take the first 3 for the home page lineup
    return motorcycles.slice(0, 3);
  }, [motorcycles]);

  return (
    <div className="bg-white text-[#171717] selection:bg-black selection:text-white overflow-x-hidden">
      <main>
        {/* ========== HERO SECTION ========== */}
        <section className="relative sky-gradient-wash pt-40 pb-24 px-6 min-h-[90vh] flex flex-col items-center justify-center">
          <div className="max-w-5xl mx-auto text-center space-y-10 animate-expo-entry">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#0d74ce] text-[11px] font-bold uppercase tracking-widest">
               <span className="w-2 h-2 rounded-full bg-[#0d74ce] animate-pulse"></span>
               {t('hero_badge')}
             </div>
             <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-expo-display leading-[0.95] text-[#171717]">
               {t('hero_title')}
             </h1>
             <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
               {t('hero_subtitle')}
             </p>
             <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
               <Button size="lg" className="bg-black text-white hover:bg-zinc-800 h-16 px-12 rounded-xl text-lg font-bold shadow-2xl shadow-black/10" asChild>
                 <Link href="/motor">{t('hero_explore')}</Link>
               </Button>
               <Button variant="outline" size="lg" className="h-16 px-12 rounded-xl bg-white border-gray-100 text-lg font-bold hover:bg-gray-50 transition-all" asChild>
                 <Link href="/ajukan-kredit">{t('hero_start')}</Link>
               </Button>
             </div>
          </div>

          <div className="mt-24 relative w-full max-w-7xl mx-auto animate-expo-entry delay-300">
             <div className="relative aspect-[21/9] w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 p-3">
                <Image 
                  src="https://picsum.photos/seed/honda-studio-mockup/1600/800" 
                  alt="Honda Experience" 
                  fill 
                  className="object-cover rounded-[32px]"
                  priority
                  data-ai-hint="honda motorcycle clean studio"
                />
             </div>
          </div>
        </section>

        {/* ========== LINEUP SHOWCASE ========== */}
        <section className="section-spacing px-6">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{t('lineup_title')}</h2>
                <p className="text-gray-500 text-xl max-w-md font-medium leading-relaxed">
                  {t('lineup_subtitle')}
                </p>
              </div>
              <Link href="/motor" className="text-[#0d74ce] text-lg font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
                {t('lineup_view_all')} <ArrowRight className="h-6 w-6" />
              </Link>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-gray-200" />
              </div>
            ) : featuredBikes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {featuredBikes.map((bike: any) => (
                  <MotorcycleCard key={bike.id} bike={bike} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs border border-dashed rounded-3xl">
                No motorcycles registered in lineup
              </div>
            )}
          </div>
        </section>

        {/* ========== AI ASSISTANT SECTION ========== */}
        <section className="bg-[#fafafa] section-spacing px-6 border-y border-gray-100">
          <div className="max-w-7xl mx-auto">
             <div className="grid lg:grid-cols-2 gap-20 lg:gap-40 items-center">
                <div className="space-y-10">
                   <div className="space-y-6">
                     <span className="text-[11px] font-bold text-[#0d74ce] uppercase tracking-widest">{t('ai_badge')}</span>
                     <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">{t('ai_title')}</h2>
                   </div>
                   <p className="text-xl text-gray-500 leading-relaxed border-l-4 border-black pl-8 font-medium italic">
                     {t('ai_subtitle')}
                   </p>
                </div>
                <div className="bg-white border border-gray-100 p-10 md:p-16 rounded-[40px] shadow-2xl">
                   <AIAssistant />
                </div>
             </div>
          </div>
        </section>

        {/* ========== CONTACT CTA ========== */}
        <section className="section-spacing px-6 text-center bg-white">
          <div className="max-w-4xl mx-auto space-y-16">
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight">{t('contact_cta_title')}</h2>
            <p className="text-xl text-gray-500 max-w-xl mx-auto leading-relaxed font-medium">
              {t('contact_cta_subtitle')}
            </p>
            <div className="pt-8 flex flex-col items-center gap-8">
               <Button size="lg" className="bg-black text-white hover:bg-zinc-800 h-20 px-16 rounded-2xl w-full max-w-md shadow-2xl shadow-black/20 text-xl font-bold transition-all hover:scale-[1.02]" asChild>
                 <a href="https://wa.me/6281112345678">{t('contact_cta_button')}</a>
               </Button>
               <Link href="/dealer" className="text-base font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-2">
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
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-[120] w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95 group"
      >
        <Phone className="w-6 h-6 fill-current group-hover:rotate-12 transition-transform" />
      </a>
    </div>
  );
}
