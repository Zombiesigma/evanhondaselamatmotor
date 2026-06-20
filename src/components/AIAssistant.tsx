
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { aiBuyingAssistantRecommendation, AIBuyingAssistantRecommendationOutput } from '@/ai/flows/ai-buying-assistant-recommendation';
import { useLanguage } from '@/app/context/LanguageContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export function AIAssistant() {
  const { t, language } = useLanguage();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [lifestyle, setLifestyle] = useState('');
  const [budget, setBudget] = useState(30000000);
  const [result, setResult] = useState<AIBuyingAssistantRecommendationOutput | null>(null);

  const bikesQuery = useMemo(() => db ? query(collection(db, 'motorcycles'), orderBy('name', 'asc')) : null, [db]);
  const { data: motorcycles } = useCollection(bikesQuery);

  const handleSubmit = async () => {
    if (!lifestyle || !motorcycles) return;
    setLoading(true);
    try {
      const bikes = motorcycles.map(b => ({
        name: b.name,
        type: b.category,
        price: b.startingPrice,
        engineCapacityCc: b.specs ? parseInt(b.specs.capacity) : 110,
        features: language === 'id' ? (b.features_id || []) : (b.features_en || [])
      }));
      
      const res = await aiBuyingAssistantRecommendation({
        lifestyleNeeds: lifestyle,
        budget: budget,
        availableMotorcycles: bikes,
        availableCreditOptions: [
          { leasingProvider: 'FIF Group', minDownPaymentPercentage: 15, maxTenureMonths: 36, minTenureMonths: 12, averageInterestRatePercentage: 8.5 },
          { leasingProvider: 'Adira Finance', minDownPaymentPercentage: 20, maxTenureMonths: 48, minTenureMonths: 12, averageInterestRatePercentage: 9.0 }
        ]
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="w-full text-black">
        {!result ? (
          <div className="space-y-10">
            <div className="space-y-4">
              <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0d74ce]" /> {t('ai_lifestyle_label')}
              </Label>
              <Textarea 
                placeholder={t('ai_lifestyle_placeholder')} 
                className="bg-gray-50 border-gray-100 rounded-2xl focus:border-black focus:ring-1 focus:ring-black px-6 py-5 text-lg font-medium min-h-[160px] shadow-inner transition-all"
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('ai_budget_label')}</Label>
                <Input 
                  type="number" 
                  value={budget} 
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="bg-gray-50 border-gray-100 rounded-2xl h-16 text-2xl font-bold px-6 shadow-inner"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || !lifestyle || !motorcycles} 
                  className="w-full h-16 bg-black text-white hover:bg-zinc-800 rounded-2xl font-bold text-lg shadow-2xl shadow-black/20 transition-all hover:scale-[1.02]"
                >
                  {loading ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : t('ai_generate')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b-2 border-gray-50 pb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0d74ce]"></div> {t('ai_recommended_models')}
                </h3>
                <div className="space-y-8">
                  {result.recommendedMotorcycles.map((m, i) => (
                    <div key={i} className="group p-2 rounded-2xl transition-all">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="font-bold text-2xl tracking-tight">{m.name}</span>
                          <span className="text-sm font-bold text-[#0d74ce] font-mono">{formatCurrency(m.price)}</span>
                        </div>
                        <p className="text-base text-gray-500 leading-relaxed font-medium">{m.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b-2 border-gray-50 pb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div> {t('ai_financial_structure')}
                </h3>
                {result.suggestedCreditPackage && (
                  <div className="bg-gray-50 p-8 rounded-3xl space-y-8 border border-gray-100 shadow-inner">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('calc_dp')}</p>
                        <p className="font-bold text-lg">{formatCurrency(result.suggestedCreditPackage.downPaymentAmount)}</p>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">({result.suggestedCreditPackage.downPaymentPercentage}%)</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('calc_installment')}</p>
                        <p className="font-bold text-2xl text-black tracking-tight">{formatCurrency(result.suggestedCreditPackage.estimatedMonthlyInstallment)}</p>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{result.suggestedCreditPackage.tenureMonths} Months</span>
                      </div>
                    </div>
                    <div className="pt-6 border-t-2 border-gray-200/50">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Partner: {result.suggestedCreditPackage.leasingProvider}</p>
                      <p className="text-sm text-gray-500 italic leading-relaxed font-medium">{result.suggestedCreditPackage.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-[#fafafa] rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-black"></div> {t('ai_analysis')}
              </h4>
              <p className="text-lg leading-relaxed text-gray-700 font-medium">{result.explanation}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1 h-16 rounded-2xl border-gray-100 text-gray-400 font-bold hover:text-black hover:border-black transition-all">
                <RotateCcw className="w-5 h-5 mr-3" /> {t('ai_start_over')}
              </Button>
              <Button className="flex-1 h-16 bg-black text-white hover:bg-zinc-800 rounded-2xl font-bold text-lg shadow-2xl shadow-black/20 transition-all hover:scale-[1.02]" asChild>
                <Link href="/ajukan-kredit">{t('apply_submit')}</Link>
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}
