
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, User, Phone, MapPin, Mail, Bike, Loader2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function CreditApplicationPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const db = useFirestore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    motorcycleId: '',
    dp: '15',
    tenure: '35'
  });

  const bikesQuery = useMemo(() => db ? query(collection(db, 'motorcycles'), orderBy('name', 'asc')) : null, [db]);
  const { data: motorcycles, loading: bikesLoading } = useCollection(bikesQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setLoading(true);
    const selectedMotorcycle = motorcycles?.find(m => m.id === formData.motorcycleId);

    const submissionData = {
      ...formData,
      motorcycleName: (selectedMotorcycle as any)?.name || formData.motorcycleId,
      dpPercentage: Number(formData.dp),
      tenure: Number(formData.tenure),
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'creditApplications'), submissionData)
      .then(() => {
        setLoading(false);
        setStep(3);
        toast({
          title: t('apply_success_title'),
          description: t('apply_success_msg'),
        });
      })
      .catch(async (error) => {
        setLoading(false);
        const permissionError = new FirestorePermissionError({
          path: 'creditApplications',
          operation: 'create',
          requestResourceData: submissionData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-[#fafafa]">
      <div className="max-w-3xl mx-auto space-y-12 pt-24 pb-20">
        <div className="text-center space-y-6 animate-expo-entry">
          <h1 className="text-6xl md:text-8xl font-bold tracking-expo-display text-[#171717]">{t('apply_title')}</h1>
          <p className="text-xl text-gray-500 max-w-lg mx-auto leading-relaxed font-medium">{t('apply_subtitle')}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-6 animate-expo-entry">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${step >= 1 ? 'bg-black text-white shadow-2xl shadow-black/20 scale-110' : 'bg-white border-2 text-gray-300'}`}>1</div>
          <div className={`h-1.5 w-16 rounded-full transition-all ${step >= 2 ? 'bg-black' : 'bg-gray-100'}`}></div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${step >= 2 ? 'bg-black text-white shadow-2xl shadow-black/20 scale-110' : 'bg-white border-2 text-gray-300'}`}>2</div>
          <div className={`h-1.5 w-16 rounded-full transition-all ${step >= 3 ? 'bg-black' : 'bg-gray-100'}`}></div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all ${step >= 3 ? 'bg-black text-white shadow-2xl shadow-black/20 scale-110' : 'bg-white border-2 text-gray-300'}`}>3</div>
        </div>

        <Card className="shadow-[0_40px_100px_rgba(0,0,0,0.08)] border-none overflow-hidden rounded-[40px] animate-expo-entry">
          <CardContent className="p-10 md:p-16">
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="space-y-8">
                  <h3 className="text-3xl font-bold flex items-center gap-4"><Bike className="h-8 w-8 text-[#0d74ce]" /> {t('apply_step_unit')}</h3>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('apply_model_label')}</Label>
                      <Select 
                        disabled={bikesLoading}
                        value={formData.motorcycleId} 
                        onValueChange={(v) => setFormData({...formData, motorcycleId: v})}
                      >
                        <SelectTrigger className="h-16 rounded-2xl border-gray-100 text-lg font-bold bg-gray-50/50 hover:bg-white transition-all">
                          <SelectValue placeholder={bikesLoading ? 'Loading models...' : t('apply_model_label')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100">
                          {motorcycles?.map(m => (
                            <SelectItem key={m.id} value={m.id} className="text-lg font-bold py-3">{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('calc_dp')} (%)</Label>
                        <Input 
                          type="number" 
                          value={formData.dp} 
                          onChange={(e) => setFormData({...formData, dp: e.target.value})}
                          className="h-16 rounded-2xl border-gray-100 text-xl font-bold bg-gray-50/50 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('calc_tenure')}</Label>
                        <Select 
                          value={formData.tenure} 
                          onValueChange={(v) => setFormData({...formData, tenure: v})}
                        >
                          <SelectTrigger className="h-16 rounded-2xl border-gray-100 text-lg font-bold bg-gray-50/50 hover:bg-white transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-gray-100">
                            {[11, 17, 23, 29, 35].map(m => (
                              <SelectItem key={m} value={m.toString()} className="text-lg font-bold py-3">
                                {m} {language === 'id' ? 'Bulan' : 'Months'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!formData.motorcycleId}
                  className="w-full h-16 text-xl font-bold bg-black text-white hover:bg-zinc-800 rounded-2xl shadow-2xl shadow-black/20 transition-all hover:scale-[1.02]"
                >
                  {t('apply_next')}
                </Button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-500">
                <div className="space-y-8">
                  <h3 className="text-3xl font-bold flex items-center gap-4"><User className="h-8 w-8 text-[#0d74ce]" /> {t('apply_step_personal')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('apply_name_label')}</Label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
                        <Input 
                          required
                          placeholder="..."
                          className="pl-14 h-16 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-lg font-bold"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('apply_phone_label')}</Label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
                        <Input 
                          required
                          placeholder="0812..."
                          className="pl-14 h-16 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-lg font-bold"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
                        <Input 
                          type="email"
                          placeholder="email@anda.com"
                          className="pl-14 h-16 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-lg font-bold"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('apply_city_label')}</Label>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
                        <Input 
                          required
                          placeholder="..."
                          className="pl-14 h-16 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white text-lg font-bold"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-16 rounded-2xl border-gray-100 flex-1 text-lg font-bold">
                    <ArrowLeft className="h-5 w-5 mr-3" /> Kembali
                  </Button>
                  <Button type="submit" disabled={loading} className="h-16 text-xl font-bold bg-black text-white hover:bg-zinc-800 rounded-2xl shadow-2xl shadow-black/20 flex-[2] transition-all hover:scale-[1.02]">
                    {loading ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : t('apply_submit')}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-16 space-y-10 animate-in zoom-in duration-500">
                <div className="w-32 h-32 bg-green-50 text-green-500 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle2 className="w-20 h-20" />
                </div>
                <div className="space-y-6">
                  <h2 className="text-5xl font-bold tracking-tight">{t('apply_success_title')}</h2>
                  <p className="text-2xl text-gray-500 max-w-lg mx-auto font-medium leading-relaxed">
                    {t('apply_success_msg')}
                  </p>
                </div>
                <div className="bg-gray-50 p-10 rounded-3xl max-w-md mx-auto space-y-6 text-left border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('apply_status_label')}</p>
                  <div className="flex items-center gap-4 text-black font-bold text-2xl">
                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                    {t('apply_status_val')}
                  </div>
                </div>
                <div className="pt-10">
                  <Button asChild variant="outline" className="rounded-2xl px-16 h-16 border-gray-200 text-lg font-bold shadow-xl shadow-black/5">
                    <Link href="/">Kembali ke Beranda</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
