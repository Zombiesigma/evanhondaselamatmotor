"use client";

import { useState, useMemo } from 'react';
import { CreditCalculator } from '@/components/CreditCalculator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Loader2, Bike, Shield, Clock } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query } from 'firebase/firestore';

export default function CreditSimulationPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const bikesQuery = useMemo(() => db ? query(collection(db, 'motorcycles')) : null, [db]);
  const { data: motorcycles, loading } = useCollection(bikesQuery);

  const selectedMotorcycle = useMemo(() => {
    if (!motorcycles || motorcycles.length === 0) return null;
    if (!selectedId) return motorcycles[0];
    return motorcycles.find(m => m.id === selectedId) || motorcycles[0];
  }, [motorcycles, selectedId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!selectedMotorcycle) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#fafafa] px-6 text-center">
        <Bike className="w-10 h-10 text-gray-200 mb-4" />
        <h1 className="text-2xl font-bold">Catalog Empty</h1>
        <p className="text-sm text-gray-500 mt-2">No motorcycles available. Please add models in the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 md:px-6 bg-[#fafafa]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header ringkas */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
          <Calculator className="w-4 h-4" />
          <span className="font-bold uppercase tracking-widest text-[10px]">{t('simulation_title')}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Kolom kiri: Pemilih motor + info singkat */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-4 md:p-6">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                {t('apply_model_label')}
              </Label>
              <Select 
                onValueChange={(id) => setSelectedId(id)}
                defaultValue={selectedMotorcycle.id}
              >
                <SelectTrigger className="h-12 rounded-xl text-sm font-bold border-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100">
                  {motorcycles?.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-sm font-bold py-2">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info statis minimal */}
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1 bg-white border px-3 py-2 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-[#0d74ce]" />
                <span className="font-bold">Approval 24 jam</span>
              </div>
              <div className="flex items-center gap-1 bg-white border px-3 py-2 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <span className="font-bold">Fixed 8.5% p.a</span>
              </div>
            </div>
          </div>

          {/* Kolom kanan: Kalkulator langsung */}
          <div className="bg-white rounded-2xl border p-4 md:p-6 shadow-sm">
            <CreditCalculator 
              initialPrice={selectedMotorcycle.startingPrice} 
              motorcycleName={selectedMotorcycle.name} 
            />
          </div>
        </div>

        {/* Persyaratan hanya sebaris */}
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 pt-2">
          <Shield className="w-3 h-3" />
          Syarat: KTP, KK, Slip Gaji, Rekening Listrik
        </div>
      </div>
    </div>
  );
}
