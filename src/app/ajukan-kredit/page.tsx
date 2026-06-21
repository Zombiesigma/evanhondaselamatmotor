"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, User, Phone, MapPin, Mail, Bike, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
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
    dp: '20',
    tenure: '35',
  });

  const bikesQuery = useMemo(() => db ? query(collection(db, 'motorcycles'), orderBy('name', 'asc')) : null, [db]);
  const { data: motorcycles, loading: bikesLoading } = useCollection(bikesQuery);

  // Validasi step 1
  const isStep1Valid = formData.motorcycleId.trim() !== '' && Number(formData.dp) >= 15 && Number(formData.dp) <= 50;

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.motorcycleId) {
        toast({ variant: "destructive", title: "Pilih Motor", description: "Silakan pilih unit motor terlebih dahulu." });
        return;
      }
      if (Number(formData.dp) < 15 || Number(formData.dp) > 50) {
        toast({ variant: "destructive", title: "DP Tidak Valid", description: "Uang muka minimal 15% dan maksimal 50%." });
        return;
      }
      setStep(2);
    }
  };

  const validateStep2 = () => {
    if (!formData.name.trim()) { toast({ variant: "destructive", title: "Nama wajib diisi" }); return false; }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      toast({ variant: "destructive", title: "Nomor telepon minimal 10 digit" }); return false;
    }
    if (!formData.city.trim()) { toast({ variant: "destructive", title: "Kota wajib diisi" }); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    if (!db) return;

    setLoading(true);
    const selectedMotorcycle = motorcycles?.find(m => m.id === formData.motorcycleId);

    const submissionData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      city: formData.city.trim(),
      motorcycleId: formData.motorcycleId,
      motorcycleName: (selectedMotorcycle as any)?.name || formData.motorcycleId,
      dpPercentage: Number(formData.dp),
      tenure: Number(formData.tenure),
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'creditApplications'), submissionData);
      setLoading(false);
      setStep(3);
      toast({
        title: t('apply_success_title') || 'Pengajuan Berhasil!',
        description: t('apply_success_msg') || 'Tim kami akan segera menghubungi Anda.',
      });
    } catch (error: any) {
      setLoading(false);
      const permissionError = new FirestorePermissionError({
        path: 'creditApplications',
        operation: 'create',
        requestResourceData: submissionData,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  };

  // ---- MOBILE & DESKTOP DIFFERENTIATION ----
  return (
    <div className="min-h-screen pt-16 pb-4 px-3 md:px-6 bg-[#fafafa]">
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <div className="text-center md:space-y-2">
          <h1 className="text-xl md:text-5xl font-bold tracking-tight">{t('apply_title')}</h1>
          <p className="text-[10px] md:text-base text-gray-500">{t('apply_subtitle')}</p>
        </div>

        {/* Stepper mini */}
        <div className="flex items-center justify-center gap-2 md:gap-6">
          {[1,2,3].map((num) => (
            <div key={num} className="flex items-center gap-2 md:gap-6">
              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center font-bold text-xs md:text-lg transition-all ${
                step >= num ? 'bg-black text-white shadow-md md:shadow-xl scale-105' : 'bg-white border text-gray-300'
              }`}>
                {num}
              </div>
              {num < 3 && <div className={`h-1 md:h-1.5 w-8 md:w-16 rounded-full ${step > num ? 'bg-black' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        {/* Card utama */}
        <Card className="shadow-md md:shadow-2xl border-none rounded-2xl md:rounded-[40px] overflow-hidden">
          <CardContent className="p-4 md:p-12 space-y-5 md:space-y-10">

            {/* STEP 1: Pilih Motor */}
            {step === 1 && (
              <div className="space-y-5 md:space-y-8">
                <h3 className="text-base md:text-3xl font-bold flex items-center gap-2"><Bike className="h-5 w-5 md:h-8 md:w-8 text-[#0d74ce]" /> {t('apply_step_unit')}</h3>
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{t('apply_model_label')}</Label>
                    <Select
                      disabled={bikesLoading}
                      value={formData.motorcycleId}
                      onValueChange={(v) => setFormData({...formData, motorcycleId: v})}
                    >
                      <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl border-gray-100 text-sm md:text-lg font-bold bg-gray-50/50">
                        <SelectValue placeholder={bikesLoading ? 'Loading...' : t('apply_model_label')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl md:rounded-2xl border-gray-100">
                        {motorcycles?.length === 0 && <SelectItem value="-" disabled>Belum ada motor</SelectItem>}
                        {motorcycles?.map(m => (
                          <SelectItem key={m.id} value={m.id} className="text-sm md:text-lg font-bold py-2 md:py-3">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{t('calc_dp')} (%)</Label>
                      <Input
                        type="number"
                        min="15" max="50"
                        value={formData.dp}
                        onChange={(e) => setFormData({...formData, dp: e.target.value})}
                        className="h-12 md:h-16 rounded-xl md:rounded-2xl border-gray-100 text-sm md:text-lg font-bold bg-gray-50/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{t('calc_tenure')}</Label>
                      <Select
                        value={formData.tenure}
                        onValueChange={(v) => setFormData({...formData, tenure: v})}
                      >
                        <SelectTrigger className="h-12 md:h-16 rounded-xl md:rounded-2xl border-gray-100 text-sm md:text-lg font-bold bg-gray-50/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl md:rounded-2xl border-gray-100">
                          {[11, 17, 23, 29, 35].map(m => (
                            <SelectItem key={m} value={m.toString()} className="text-sm md:text-lg font-bold py-2 md:py-3">
                              {m} {language === 'id' ? 'Bulan' : 'Months'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleNextStep}
                  disabled={!isStep1Valid}
                  className="w-full h-12 md:h-16 text-sm md:text-xl font-bold bg-black text-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                  {t('apply_next')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: Data Pribadi */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-8">
                <h3 className="text-base md:text-3xl font-bold flex items-center gap-2"><User className="h-5 w-5 md:h-8 md:w-8 text-[#0d74ce]" /> {t('apply_step_personal')}</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <div className="col-span-2 md:col-span-1 space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase">{t('apply_name_label')}</Label>
                    <Input required placeholder="Nama lengkap" className="h-10 md:h-14 rounded-lg md:rounded-xl text-sm border-gray-100 bg-gray-50" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase">{t('apply_phone_label')}</Label>
                    <Input required placeholder="0812xxxxxx" className="h-10 md:h-14 rounded-lg md:rounded-xl text-sm border-gray-100 bg-gray-50" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase">Email</Label>
                    <Input type="email" placeholder="email@anda.com" className="h-10 md:h-14 rounded-lg md:rounded-xl text-sm border-gray-100 bg-gray-50" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="col-span-2 md:col-span-1 space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase">{t('apply_city_label')}</Label>
                    <Input required placeholder="Kota" className="h-10 md:h-14 rounded-lg md:rounded-xl text-sm border-gray-100 bg-gray-50" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                  </div>
                </div>

                <div className="flex gap-3 md:gap-6 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10 md:h-14 rounded-lg md:rounded-xl border-gray-100 flex-1 text-xs md:text-sm font-bold">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
                  </Button>
                  <Button type="submit" disabled={loading} className="h-10 md:h-14 text-sm md:text-lg font-bold bg-black text-white rounded-lg md:rounded-xl flex-[2] shadow-md hover:scale-[1.01] transition-all">
                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : t('apply_submit')}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3: Sukses */}
            {step === 3 && (
              <div className="text-center py-8 md:py-12 space-y-4 md:space-y-8">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-green-50 text-green-500 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 md:w-14 md:h-14" />
                </div>
                <div>
                  <h2 className="text-xl md:text-4xl font-bold">{t('apply_success_title')}</h2>
                  <p className="text-sm md:text-xl text-gray-500 mt-2">{t('apply_success_msg')}</p>
                </div>
                <div className="bg-gray-50 p-4 md:p-8 rounded-2xl md:rounded-3xl max-w-xs mx-auto text-left border">
                  <p className="text-[10px] font-bold uppercase text-gray-400">{t('apply_status_label')}</p>
                  <div className="flex items-center gap-2 text-sm md:text-xl font-bold mt-1">
                    <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 animate-pulse" />
                    {t('apply_status_val')}
                  </div>
                </div>
                <Button asChild variant="outline" className="rounded-xl md:rounded-2xl px-8 md:px-12 h-10 md:h-14 text-xs md:text-base font-bold border-gray-200 shadow-sm">
                  <Link href="/">Kembali ke Beranda</Link>
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
