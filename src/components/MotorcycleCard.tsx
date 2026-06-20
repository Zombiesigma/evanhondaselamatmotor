
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Motorcycle } from '@/app/lib/motorcycles';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/app/context/LanguageContext';
import { ArrowRight, Zap } from 'lucide-react';

interface MotorcycleCardProps {
  bike: Motorcycle;
}

export function MotorcycleCard({ bike }: MotorcycleCardProps) {
  const { language, t } = useLanguage();
  
  // Logic: Prefer a URL from main image or gallery. Fallback to placeholders only if none found.
  const getImageUrl = () => {
    if (bike.image?.startsWith('http')) return bike.image;
    
    // Check gallery for real URLs
    const galleryUrl = (bike.gallery || []).find(url => url.startsWith('http'));
    if (galleryUrl) return galleryUrl;
    
    // Final fallback to placeholder
    return PlaceHolderImages.find(img => img.id === bike.image)?.imageUrl || PlaceHolderImages[0].imageUrl;
  };

  const imageUrl = getImageUrl();
  const imageHint = PlaceHolderImages.find(img => img.id === bike.image)?.imageHint || "motorcycle";
  
  const formattedPrice = new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(bike.startingPrice || 0);

  const description = language === 'id' ? bike.description_id : bike.description_en;

  return (
    <div className="group bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-[0_40px_100px_rgba(0,0,0,0.12)] transition-all duration-700 animate-expo-entry hover:-translate-y-3">
      <Link href={`/motor/${bike.id}`} className="block relative aspect-[16/11] overflow-hidden bg-[#fafafa]">
        <Image 
          src={imageUrl} 
          alt={bike.name} 
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          data-ai-hint={imageHint}
        />
        <div className="absolute top-6 left-6 flex gap-3">
           <span className="text-[10px] font-bold tracking-[0.2em] text-black bg-white/80 backdrop-blur-xl px-5 py-2 rounded-full uppercase shadow-2xl flex items-center gap-2">
             <Zap className="w-3 h-3 fill-current" />
             {bike.category}
           </span>
        </div>
      </Link>
      
      <div className="p-10 space-y-8">
        <div className="space-y-2">
           <div className="flex justify-between items-start gap-4">
              <h3 className="font-bold text-3xl text-black tracking-tight leading-none group-hover:text-[#0d74ce] transition-colors">
                {bike.name}
              </h3>
              <span className="text-lg font-bold text-black font-mono">
                {formattedPrice}
              </span>
           </div>
           <p className="font-mono text-[10px] text-gray-300 uppercase tracking-[0.3em] font-bold">Infrastucture Grade System</p>
        </div>
        
        <p className="text-gray-500 leading-relaxed line-clamp-2 text-base font-medium italic">
          {description || "Discover the precision performance of our latest Honda series."}
        </p>

        <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
           <Link href={`/motor/${bike.id}`} className="text-[11px] font-bold text-black hover:text-[#0d74ce] transition-all uppercase tracking-widest flex items-center gap-2">
             {t('learn_more')} <ArrowRight className="h-4 w-4" />
           </Link>
           <Button variant="ghost" className="h-12 px-6 rounded-xl border border-gray-100 text-xs font-bold text-[#0d74ce] hover:bg-[#0d74ce] hover:text-white transition-all shadow-sm" asChild>
             <Link href="/ajukan-kredit">{t('acquire')}</Link>
           </Button>
        </div>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
