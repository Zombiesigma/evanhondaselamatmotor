
"use client";

import { useState, useMemo } from 'react';
import { CreditCalculator } from '@/components/CreditCalculator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, Info, ShieldCheck, Loader2, Bike } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export default function CreditSimulationPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch motorcycles dynamically from Firestore
  const bikesQuery = useMemo(() => db ? query(collection(db, 'motorcycles')) : null, [db]);
  const { data: motorcycles, loading } = useCollection(bikesQuery);

  // Determine which motorcycle is currently being simulated
  const selectedMotorcycle = useMemo(() => {
    if (!motorcycles || motorcycles.length === 0) return null;
    if (!selectedId) return motorcycles[0];
    return motorcycles.find(m => m.id === selectedId) || motorcycles[0];
  }, [motorcycles, selectedId]);

  if (loading) {
    return (
      <div className="min-h-screen py-32 flex flex-col items-center justify-center gap-6 bg-[#fafafa]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-200" />
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">Syncing Financial Data...</p>
      </div>
    );
  }

  if (!selectedMotorcycle) {
    return (
      <div className="min-h-screen py-32 flex flex-col items-center justify-center gap-6 bg-[#fafafa] px-6 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
          <Bike className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Catalog Empty</h1>
        <p className="text-gray-500 max-w-md">No motorcycles found in the registry. Please add models in the admin panel to enable credit simulation.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-32 px-6 bg-[#fafafa]">
      <div className="max-w-6xl mx-auto space-y-16 pt-12">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left Side: Info & Selection */}
          <div className="flex-1 space-y-12 animate-expo-entry">
            <div className="space-y-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-black shadow-xl shadow-black/5 border border-gray-100">
                <Calculator className="w-6 h-6" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">{t('simulation_title')}</h1>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                {t('simulation_subtitle')} <span className="text-black font-bold">{selectedMotorcycle.name}</span>
              </p>
            </div>

            <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.06)] overflow-hidden rounded-[40px] bg-white">
              <CardContent className="p-10 md:p-14 space-y-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">{t('apply_model_label')}</Label>
                  <Select 
                    onValueChange={(id) => setSelectedId(id)}
                    defaultValue={selectedMotorcycle.id}
                  >
                    <SelectTrigger className="h-16 rounded-2xl text-lg font-bold border-gray-100 bg-gray-50/50 hover:bg-white transition-all">
                      <SelectValue placeholder={t('apply_model_label')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-gray-100">
                      {motorcycles?.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-lg font-bold py-3">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-8 bg-blue-50/50 rounded-3xl flex gap-6 text-sm border border-blue-50">
                  <Info className="w-6 h-6 text-[#0d74ce] shrink-0" />
                  <p className="text-[#0d74ce] font-medium leading-relaxed">{t('simulation_info')}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 rounded-3xl border border-gray-50 bg-gray-50/30 space-y-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Fixed Interest</p>
                    <p className="text-3xl font-bold text-black tracking-tight">8.5% <span className="text-xs text-gray-300 font-medium">P.A</span></p>
                  </div>
                  <div className="p-8 rounded-3xl border border-gray-50 bg-gray-50/30 space-y-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Fast Approval</p>
                    <p className="text-3xl font-bold text-black tracking-tight">24 <span className="text-xs text-gray-300 font-medium">HOURS</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8 p-6">
              <h3 className="text-2xl font-bold flex items-center gap-4">
                <ShieldCheck className="text-green-500 h-8 w-8" /> 
                {t('simulation_requirements')}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['FC KTP Pemohon & Pasangan', 'FC Kartu Keluarga', 'Bukti Penghasilan (Slip Gaji)', 'PBB / Rekening Listrik'].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-gray-500 font-medium bg-white p-5 rounded-2xl border border-gray-50 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-[#0d74ce] shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Side: Calculator */}
          <div className="w-full lg:w-[480px] animate-scale-entry">
            <div className="sticky top-28">
              <CreditCalculator 
                initialPrice={selectedMotorcycle.startingPrice} 
                motorcycleName={selectedMotorcycle.name} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
