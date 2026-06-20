
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Info, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { LeasingRow } from '@/app/lib/motorcycles';

interface CreditCalculatorProps {
  initialPrice?: number;
  motorcycleName?: string;
  hideHeader?: boolean;
  leasingTable?: LeasingRow[];
}

export function CreditCalculator({ initialPrice = 19425000, motorcycleName, hideHeader, leasingTable }: CreditCalculatorProps) {
  const { t, language } = useLanguage();
  const [price, setPrice] = useState(initialPrice);
  const [dpAmountInput, setDpAmountInput] = useState(0);
  const [tenure, setTenure] = useState(35);
  
  useEffect(() => {
    setPrice(initialPrice);
    // Initialize DP with minimum if table exists
    if (leasingTable && leasingTable.length > 0) {
      setDpAmountInput(leasingTable[0].dp);
    } else {
      setDpAmountInput(Math.round(initialPrice * 0.15));
    }
  }, [initialPrice, leasingTable]);

  const dpPercentage = Math.round((dpAmountInput / price) * 100);

  // Official Pricing Logic
  const officialInstallment = useMemo(() => {
    if (!leasingTable || leasingTable.length === 0) return null;
    
    // Find closest DP in table
    const sortedTable = [...leasingTable].sort((a, b) => Math.abs(a.dp - dpAmountInput) - Math.abs(b.dp - dpAmountInput));
    const closestRow = sortedTable[0];
    
    return closestRow.installments[tenure.toString()] || null;
  }, [leasingTable, dpAmountInput, tenure]);

  // Formula Fallback Logic
  const estimatedInstallment = useMemo(() => {
    const loanAmount = price - dpAmountInput;
    const interestRate = 25; // Average flat rate
    const insuranceAndAdminLoad = loanAmount * 0.05;
    const totalInterest = (loanAmount * (interestRate / 100)) * (tenure / 12);
    return Math.round((loanAmount + totalInterest + insuranceAndAdminLoad) / tenure);
  }, [price, dpAmountInput, tenure]);

  const finalInstallment = officialInstallment || estimatedInstallment;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val);

  return (
    <Card className="border-gray-100 bg-white shadow-xl rounded-2xl overflow-hidden">
      {!hideHeader && (
        <CardHeader className="bg-gray-50 border-b border-gray-100 py-6 px-8">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold">{t('calc_title')}</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1">{t('calc_subtitle')} {motorcycleName}</CardDescription>
            </div>
            {officialInstallment && (
              <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                <BadgeCheck className="w-3 h-3" />
                Official Price List
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-8 p-8">
        <div className="space-y-4">
          <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('calc_price')}</Label>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(price)}</div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('calc_dp')} ({dpPercentage}%)</Label>
            <span className="font-bold text-lg">{formatCurrency(dpAmountInput)}</span>
          </div>
          <Slider 
            value={[dpAmountInput]} 
            onValueChange={(v) => setDpAmountInput(v[0])} 
            min={Math.round(price * 0.1)} 
            max={Math.round(price * 0.7)} 
            step={500000}
            className="py-2"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase">
            <span>Min 10%</span>
            <span>Max 70%</span>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('calc_tenure')}</Label>
          <div className="grid grid-cols-5 gap-2">
            {[11, 17, 23, 29, 35].map((tVal) => (
              <button 
                key={tVal}
                className={`h-10 rounded-lg border text-xs font-bold transition-all ${tenure === tVal ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}
                onClick={() => setTenure(tVal)}
              >
                {tVal}x
              </button>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 bg-[#fafafa] -mx-8 -mb-8 p-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('calc_installment')}</p>
            <h3 className="text-4xl font-bold text-black">{formatCurrency(finalInstallment)}</h3>
            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-gray-400 uppercase">
               <Info className="h-3 w-3 text-[#0d74ce]" />
               <span>{officialInstallment ? 'Berdasarkan Price List Resmi' : t('calc_fixed_rate')}</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
