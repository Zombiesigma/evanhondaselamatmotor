"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Motorcycle } from '@/app/lib/motorcycles';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLanguage } from '@/app/context/LanguageContext';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MotorcycleCardProps {
  bike: Motorcycle;
}

export function MotorcycleCard({ bike }: MotorcycleCardProps) {
  const { language, t } = useLanguage();
  
  const getImageUrl = () => {
    if (bike.image?.startsWith('http')) return bike.image;
    const galleryUrl = (bike.gallery || []).find(url => url.startsWith('http'));
    if (galleryUrl) return galleryUrl;
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
    <div className="group bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-500 animate-expo-entry hover:-translate-y-1">
      <Link href={`/motor/${bike.id}`} className="block relative aspect-[16/10] overflow-hidden bg-[#fafafa]">
        <Image 
          src={imageUrl} 
          alt={bike.name} 
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          data-ai-hint={imageHint}
        />
        <div className="absolute top-4 left-4">
           <span className="text-[8px] font-bold tracking-widest text-black bg-white/90 backdrop-blur-md px-3 py-1 rounded-full uppercase shadow-lg flex items-center gap-1.5">
             <Zap className="w-2.5 h-2.5 fill-current text-[#0d74ce]" />
             {bike.category}
           </span>
        </div>
      </Link>
      
      <div className="p-6 space-y-4">
        <div className="space-y-1">
           <div className="flex justify-between items-baseline gap-2">
              <h3 className="font-bold text-xl text-black tracking-tight group-hover:text-[#0d74ce] transition-colors">
                {bike.name}
              </h3>
              <span className="text-sm font-bold text-black font-mono">
                {formattedPrice}
              </span>
           </div>
           <p className="font-mono text-[8px] text-gray-300 uppercase tracking-widest font-bold">Infrastructure Grade</p>
        </div>
        
        <p className="text-gray-500 leading-relaxed line-clamp-2 text-sm font-medium italic">
          {description || "Precision performance in every series."}
        </p>

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
           <Link href={`/motor/${bike.id}`} className="text-[10px] font-bold text-black hover:text-[#0d74ce] transition-all uppercase tracking-widest flex items-center gap-1.5">
             {t('learn_more')} <ArrowRight className="h-3.5 w-3.5" />
           </Link>
           <Button variant="ghost" className="h-9 px-4 rounded-lg border border-gray-100 text-[10px] font-bold text-[#0d74ce] hover:bg-[#0d74ce] hover:text-white transition-all" asChild>
             <Link href="/ajukan-kredit">{t('acquire')}</Link>
           </Button>
        </div>
      </div>
    </div>
  );
}
