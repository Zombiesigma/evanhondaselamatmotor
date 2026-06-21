"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore } from '@/firebase';
import {
  collection, query, orderBy, doc, updateDoc, deleteDoc,
  addDoc, serverTimestamp,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Users, Bike, MapPin, LogOut, CheckCircle2,
  Clock, XCircle, Trash2, Plus, Search,
  ArrowRight, Loader2, Save, X, Info, Edit3, Settings, Upload, Image as ImageIcon,
  Palette, Images as GalleryIcon, ExternalLink, Phone, MessageSquare, Database,
} from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { uploadToGithub } from '@/app/actions/github-actions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { LeasingRow } from '@/app/lib/motorcycles';
import Image from 'next/image';

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('applications');
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // State motor
  const initialBikeState = {
    name: '',
    category: 'Matic',
    startingPrice: '',
    image: '',
    description_id: '',
    description_en: '',
    engineType: '',
    boreStroke: '',
    displacement: '',
    compressionRatio: '',
    maxPower: '',
    maxTorque: '',
    clutchType: '',
    starterType: '',
    sparkPlug: '',
    fuelSystem: '',
    transmissionType: '',
    ignitionSystem: '',
    variants: [{ name: 'Standard', price: '', color: 'Black' }],
    gallery: [] as string[],
  };
  const [bikeForm, setBikeForm] = useState(initialBikeState);
  const [bulkData, setBulkData] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // State dealer
  const initialDealerState = {
    name: '',
    city: '',
    address: '',
    phone: '',
    whatsapp: '',
    mapUrl: '',
  };
  const [dealerForm, setDealerForm] = useState(initialDealerState);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // Query Firestore
  const appsQuery = useMemo(
    () => (db ? query(collection(db, 'creditApplications'), orderBy('createdAt', 'desc')) : null),
    [db],
  );
  const bikesQuery = useMemo(
    () => (db ? query(collection(db, 'motorcycles'), orderBy('createdAt', 'desc')) : null),
    [db],
  );
  const dealersQuery = useMemo(
    () => (db ? query(collection(db, 'dealers'), orderBy('city', 'asc')) : null),
    [db],
  );

  const { data: applications, loading: appsLoading } = useCollection(appsQuery);
  const { data: motorcycles, loading: bikesLoading } = useCollection(bikesQuery);
  const { data: dealers, loading: dealersLoading } = useCollection(dealersQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black h-8 w-8" />
      </div>
    );

  const handleLogout = () => {
    signOut(getAuth());
    router.push('/login');
  };

  const updateAppStatus = (id: string, status: string) => {
    if (!db) return;
    const docRef = doc(db, 'creditApplications', id);
    updateDoc(docRef, { status })
      .then(() => toast({ title: 'Updated', description: `Application ${status}.` }))
      .catch(async (err) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: { status },
          }),
        );
      });
  };

  const deleteRecord = (col: string, id: string) => {
    if (!db) return;
    if (confirm('Delete this entry?')) {
      const docRef = doc(db, col, id);
      deleteDoc(docRef)
        .then(() => toast({ title: 'Deleted' }))
        .catch(async (err) => {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({ path: docRef.path, operation: 'delete' }),
          );
        });
    }
  };

  // Bulk import sederhana
  const parseBulkImport = async () => {
    if (!bulkData || !db) return;
    setUploading(true);
    try {
      const lines = bulkData.split('\n');
      let currentMotor: any = null;
      const motorList: any[] = [];
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        if (line.includes('TYPE MOTOR') || line.startsWith('TYPE MIOTOR')) {
          if (currentMotor) motorList.push(currentMotor);
          const name = line.replace(/TYPE MI?OTOR/g, '').trim();
          currentMotor = {
            name,
            category: 'Matic',
            startingPrice: 0,
            image: 'motor-beat',
            description_id: `Honda ${name}`,
            description_en: `Honda ${name}`,
            variants: [{ name: 'Standard', price: 0, color: 'Default' }],
            leasingTable: [] as LeasingRow[],
            specs: { engineType: '4-Langkah, SOHC, eSP', displacement: '110cc', fuelSystem: 'Injeksi (PGM-FI)' },
            createdAt: serverTimestamp(),
          };
        } else if (line.includes('HARGA KENDARAAN') || line.includes('HARGA KEINDARAAN')) {
          const price = parseInt(line.replace(/[^0-9]/g, ''));
          if (currentMotor) {
            currentMotor.startingPrice = price;
            currentMotor.variants[0].price = price;
          }
        } else if (currentMotor && /^[0-9.]+\s+[0-9.]+\s+[0-9.]+/.test(line)) {
          const parts = line.split(/\s+/).map((p) => parseInt(p.replace(/[^0-9]/g, '')));
          if (parts.length >= 6) {
            currentMotor.leasingTable.push({
              dp: parts[0],
              installments: { '11': parts[1], '17': parts[2], '23': parts[3], '29': parts[4], '35': parts[5] },
            });
          }
        }
      }
      if (currentMotor) motorList.push(currentMotor);
      for (const motor of motorList) {
        await addDoc(collection(db, 'motorcycles'), motor);
      }
      toast({ title: 'Import Success' });
      setIsBulkOpen(false);
      setBulkData('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Import Error', description: e.message });
    } finally {
      setUploading(false);
    }
  };

  // Buka edit motor (isi form)
  const openEditBike = (bike: any) => {
    setEditingId(bike.id);
    setBikeForm({
      name: bike.name || '',
      category: bike.category || 'Matic',
      startingPrice: bike.startingPrice?.toString() || '',
      image: bike.image || '',
      description_id: bike.description_id || '',
      description_en: bike.description_en || '',
      engineType: bike.specs?.engineType || '',
      boreStroke: bike.specs?.boreStroke || '',
      displacement: bike.specs?.displacement || '',
      compressionRatio: bike.specs?.compressionRatio || '',
      maxPower: bike.specs?.maxPower || '',
      maxTorque: bike.specs?.maxTorque || '',
      clutchType: bike.specs?.clutchType || '',
      starterType: bike.specs?.starterType || '',
      sparkPlug: bike.specs?.sparkPlug || '',
      fuelSystem: bike.specs?.fuelSystem || '',
      transmissionType: bike.specs?.transmissionType || '',
      ignitionSystem: bike.specs?.ignitionSystem || '',
      variants: (bike.variants || []).map((v: any) => ({
        name: v.name || '',
        price: v.price?.toString() || '',
        color: v.color || '',
      })) || [{ name: 'Standard', price: '', color: 'Black' }],
      gallery: bike.gallery || [],
    });
    setIsAddOpen(true);
  };

  const openEditDealer = (dealer: any) => {
    setEditingId(dealer.id);
    setDealerForm({
      name: dealer.name || '',
      city: dealer.city || '',
      address: dealer.address || '',
      phone: dealer.phone || '',
      whatsapp: dealer.whatsapp || '',
      mapUrl: dealer.mapUrl || '',
    });
    setIsAddOpen(true);
  };

  // Handle submit motor
  const handleBikeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setUploading(true);
    let finalImageUrl = bikeForm.image;
    let finalGallery = [...bikeForm.gallery];
    try {
      const folderName = bikeForm.name.toLowerCase().replace(/\s+/g, '-');
      if (selectedFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(selectedFile);
        });
        finalImageUrl = await uploadToGithub(selectedFile.name, await base64Promise, folderName);
      }
      if (galleryFiles.length > 0) {
        const uploadedGallery = await Promise.all(
          galleryFiles.map(async (file) => {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
            });
            return uploadToGithub(file.name, await base64Promise, folderName);
          }),
        );
        finalGallery = [...finalGallery, ...uploadedGallery];
      }
      if (!finalImageUrl.startsWith('http') && finalGallery.length > 0) {
        finalImageUrl = finalGallery[0];
      }

      const motorcycleData = {
        name: bikeForm.name,
        category: bikeForm.category,
        startingPrice: Number(bikeForm.startingPrice) || 0,
        image: finalImageUrl,
        gallery: finalGallery,
        description_id: bikeForm.description_id,
        description_en: bikeForm.description_en,
        variants: bikeForm.variants.map((v) => ({
          name: v.name || 'Standard',
          price: Number(v.price) || 0,
          color: v.color || 'Default',
        })),
        specs: {
          engineType: bikeForm.engineType,
          boreStroke: bikeForm.boreStroke,
          displacement: bikeForm.displacement,
          compressionRatio: bikeForm.compressionRatio,
          maxPower: bikeForm.maxPower,
          maxTorque: bikeForm.maxTorque,
          clutchType: bikeForm.clutchType,
          starterType: bikeForm.starterType,
          sparkPlug: bikeForm.sparkPlug,
          fuelSystem: bikeForm.fuelSystem,
          transmissionType: bikeForm.transmissionType,
          ignitionSystem: bikeForm.ignitionSystem,
        },
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'motorcycles', editingId), motorcycleData);
      } else {
        await addDoc(collection(db, 'motorcycles'), {
          ...motorcycleData,
          createdAt: serverTimestamp(),
        });
      }

      setIsAddOpen(false);
      setEditingId(null);
      setBikeForm(initialBikeState);
      setSelectedFile(null);
      setGalleryFiles([]);
      toast({ title: 'Catalog Updated' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDealerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      const dealerData = {
        ...dealerForm,
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, 'dealers', editingId), dealerData);
      } else {
        await addDoc(collection(db, 'dealers'), {
          ...dealerData,
          createdAt: serverTimestamp(),
        });
      }
      setIsAddOpen(false);
      setEditingId(null);
      setDealerForm(initialDealerState);
      toast({ title: 'Node Updated' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  // Fungsi untuk menambah varian
  const addVariant = () => {
    setBikeForm({
      ...bikeForm,
      variants: [...bikeForm.variants, { name: '', price: '', color: '' }],
    });
  };

  const removeVariant = (index: number) => {
    const newVariants = bikeForm.variants.filter((_, i) => i !== index);
    setBikeForm({ ...bikeForm, variants: newVariants.length ? newVariants : [{ name: 'Standard', price: '', color: 'Black' }] });
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...bikeForm.variants];
    (newVariants[index] as any)[field] = value;
    setBikeForm({ ...bikeForm, variants: newVariants });
  };

  // ---------- MOBILE RENDER ----------
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col">
        <div className="bg-white border-b border-gray-100 px-3 py-3 flex items-center justify-between">
          <h1 className="text-[10px] font-bold tracking-[0.2em] flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center text-white text-[8px]">EV</div>
            CMND CENTER
          </h1>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-1 overflow-x-auto">
          <MobileTab active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Users className="w-3 h-3" />} label="Leads" />
          <MobileTab active={activeTab === 'motorcycles'} onClick={() => setActiveTab('motorcycles')} icon={<Bike className="w-3 h-3" />} label="Inventory" />
          <MobileTab active={activeTab === 'dealers'} onClick={() => setActiveTab('dealers')} icon={<MapPin className="w-3 h-3" />} label="Nodes" />
        </div>

        <div className="flex-1 p-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-black">
              {activeTab === 'applications' ? 'Inbound Leads' : activeTab === 'motorcycles' ? 'Inventory' : 'Dealer Nodes'}
            </div>
            <div className="flex gap-2">
              {activeTab === 'motorcycles' && (
                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-[9px] rounded-lg gap-1">
                      <Database className="w-3 h-3" /> Bulk
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-full mx-2 rounded-2xl bg-white">
                    <DialogHeader><DialogTitle className="text-base">Bulk Import</DialogTitle></DialogHeader>
                    <div className="p-2 space-y-3">
                      <Textarea value={bulkData} onChange={(e) => setBulkData(e.target.value)} placeholder="TYPE MOTOR..." className="min-h-[200px] text-[10px] p-3 bg-gray-50" />
                      <Button onClick={parseBulkImport} disabled={uploading} className="w-full h-10 bg-black text-white rounded-xl text-[10px] font-bold uppercase">Process</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {activeTab !== 'applications' && (
                <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setEditingId(null); setBikeForm(initialBikeState); setDealerForm(initialDealerState); setGalleryFiles([]); setSelectedFile(null); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 px-3 text-[9px] rounded-lg bg-black text-white gap-1">
                      <Plus className="w-3 h-3" /> {activeTab === 'motorcycles' ? 'Asset' : 'Node'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-none rounded-2xl p-0 max-w-full mx-2 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-4 border-b border-gray-50 bg-[#fafafa]">
                      <DialogTitle className="text-base font-bold">{editingId ? 'Modify' : 'New'} {activeTab === 'motorcycles' ? 'Asset' : 'Node'}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[80vh] p-4">
                      {activeTab === 'motorcycles' ? (
                        <form onSubmit={handleBikeSubmit} className="space-y-6 pb-4">
                          <Input value={bikeForm.name} onChange={(e) => setBikeForm({...bikeForm, name: e.target.value})} placeholder="Model name" className="h-9 rounded-lg text-xs" required />
                          <select value={bikeForm.category} onChange={(e) => setBikeForm({...bikeForm, category: e.target.value})} className="w-full h-9 rounded-lg bg-gray-50 border px-3 text-xs">
                            {['Matic', 'Sport', 'Cub', 'Adventure', 'Electric'].map(c => <option key={c}>{c}</option>)}
                          </select>
                          <Input type="number" value={bikeForm.startingPrice} onChange={(e) => setBikeForm({...bikeForm, startingPrice: e.target.value})} placeholder="Price" className="h-9 rounded-lg text-xs" required />
                          <Textarea value={bikeForm.description_id} onChange={(e) => setBikeForm({...bikeForm, description_id: e.target.value})} placeholder="Desc ID" className="min-h-[60px] rounded-lg text-xs" />
                          <Textarea value={bikeForm.description_en} onChange={(e) => setBikeForm({...bikeForm, description_en: e.target.value})} placeholder="Desc EN" className="min-h-[60px] rounded-lg text-xs" />
                          <div className="grid grid-cols-2 gap-2">
                            {['engineType', 'displacement', 'maxPower', 'fuelSystem'].map(spec => (
                              <Input key={spec} placeholder={spec.replace(/([A-Z])/g, ' $1')} value={(bikeForm as any)[spec] || ''} onChange={(e) => setBikeForm({...bikeForm, [spec]: e.target.value})} className="h-8 rounded-lg text-[10px]" />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input type="file" className="text-[9px] h-9" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                            <Input type="file" multiple className="text-[9px] h-9" onChange={(e) => setGalleryFiles([...galleryFiles, ...Array.from(e.target.files || [])])} />
                          </div>
                          <Button disabled={uploading} type="submit" className="w-full h-10 bg-black text-white rounded-xl text-xs font-bold uppercase">
                            {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : 'COMMIT'}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={handleDealerSubmit} className="space-y-4 pb-4">
                          <Input value={dealerForm.name} onChange={(e) => setDealerForm({...dealerForm, name: e.target.value})} placeholder="Name" required className="h-9 rounded-lg text-xs" />
                          <Input value={dealerForm.city} onChange={(e) => setDealerForm({...dealerForm, city: e.target.value})} placeholder="City" className="h-9 rounded-lg text-xs" />
                          <Input value={dealerForm.phone} onChange={(e) => setDealerForm({...dealerForm, phone: e.target.value})} placeholder="Phone" className="h-9 rounded-lg text-xs" />
                          <Input value={dealerForm.whatsapp} onChange={(e) => setDealerForm({...dealerForm, whatsapp: e.target.value})} placeholder="WA (628...)" className="h-9 rounded-lg text-xs" />
                          <Input value={dealerForm.mapUrl} onChange={(e) => setDealerForm({...dealerForm, mapUrl: e.target.value})} placeholder="Maps URL" className="h-9 rounded-lg text-xs" />
                          <Textarea value={dealerForm.address} onChange={(e) => setDealerForm({...dealerForm, address: e.target.value})} placeholder="Address" className="h-16 rounded-lg text-xs" />
                          <Button type="submit" className="w-full h-10 bg-black text-white rounded-xl text-xs font-bold uppercase">SYNC NODE</Button>
                        </form>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {activeTab === 'applications' && applications?.map((app: any) => (
              <div key={app.id} className="bg-white p-3 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold">{app.name}</div>
                    <div className="text-[10px] text-gray-500">{app.phone} • {app.city}</div>
                    <div className="text-[10px] mt-1">{app.motorcycleName} – DP {app.dpPercentage}%</div>
                  </div>
                  <Badge className={cn("text-[8px] px-2 py-0.5", app.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : app.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>{app.status}</Badge>
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateAppStatus(app.id, 'approved')}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => updateAppStatus(app.id, 'rejected')}><XCircle className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-300 hover:text-black" onClick={() => deleteRecord('creditApplications', app.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
            {activeTab === 'motorcycles' && motorcycles?.map((bike: any) => (
              <div key={bike.id} className="bg-white p-3 rounded-xl border shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold">{bike.name}</div>
                  <div className="text-[10px] text-gray-500">{bike.category} • Rp {bike.startingPrice?.toLocaleString()}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-black" onClick={() => openEditBike(bike)}><Edit3 className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => deleteRecord('motorcycles', bike.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
            {activeTab === 'dealers' && dealers?.map((dealer: any) => (
              <div key={dealer.id} className="bg-white p-3 rounded-xl border shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold">{dealer.name}</div>
                  <div className="text-[10px] text-gray-500">{dealer.city} • +{dealer.whatsapp}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-black" onClick={() => openEditDealer(dealer)}><Edit3 className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => deleteRecord('dealers', dealer.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- DESKTOP RENDER ----------
  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans text-[#171717]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-screen">
        <div className="mb-10">
          <h1 className="text-[10px] font-bold tracking-[0.2em] text-black flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-[10px]">EV</div>
            CMND CENTER
          </h1>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarBtn active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Users className="w-3.5 h-3.5" />} label="Inbound Leads" />
          <SidebarBtn active={activeTab === 'motorcycles'} onClick={() => setActiveTab('motorcycles')} icon={<Bike className="w-3.5 h-3.5" />} label="Inventory" />
          <SidebarBtn active={activeTab === 'dealers'} onClick={() => setActiveTab('dealers')} icon={<MapPin className="w-3.5 h-3.5" />} label="Nodes" />
        </nav>
        <div className="pt-6 border-t border-gray-100">
          <Button variant="ghost" className="w-full justify-start rounded-xl gap-3 text-gray-400 hover:text-red-500 h-10 text-[9px] font-bold uppercase tracking-widest" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" /> Terminate
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
                {activeTab === 'applications' ? 'Queue' : activeTab === 'motorcycles' ? 'Inventory' : 'Nodes'}
              </h2>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Operational
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'motorcycles' && (
                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 px-5 rounded-xl border-gray-100 bg-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-sm">
                      <Database className="w-3.5 h-3.5" /> Bulk
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-3xl bg-white">
                    <DialogHeader><DialogTitle>Bulk Import</DialogTitle></DialogHeader>
                    <div className="p-4 space-y-4">
                      <Textarea value={bulkData} onChange={(e) => setBulkData(e.target.value)} placeholder="TYPE MOTOR..." className="min-h-[300px] font-mono text-[10px] p-4 bg-gray-50" />
                      <Button onClick={parseBulkImport} disabled={uploading} className="w-full h-12 bg-black text-white rounded-xl font-bold uppercase text-[10px]">PROCESS DATA</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeTab !== 'applications' && (
                <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setEditingId(null); setBikeForm(initialBikeState); setDealerForm(initialDealerState); setGalleryFiles([]); setSelectedFile(null); } }}>
                  <DialogTrigger asChild>
                    <Button className="bg-black text-white hover:bg-zinc-800 rounded-xl h-12 px-6 font-bold text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all">
                      <Plus className="w-4 h-4" /> {activeTab === 'motorcycles' ? 'ASSET' : 'NODE'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-none rounded-[32px] p-0 overflow-hidden max-w-4xl shadow-2xl">
                    <DialogHeader className="p-6 border-b border-gray-50 bg-[#fafafa]">
                      <DialogTitle className="text-xl font-bold">{editingId ? 'Modify' : 'New'} {activeTab === 'motorcycles' ? 'Asset' : 'Node'}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] p-8">
                      {activeTab === 'motorcycles' ? (
                        <form onSubmit={handleBikeSubmit} className="space-y-10 pb-8">
                          {/* Nama, kategori, harga */}
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Model Name</Label>
                              <Input value={bikeForm.name} onChange={(e) => setBikeForm({...bikeForm, name: e.target.value})} className="h-10 rounded-xl bg-gray-50" required />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Category</Label>
                              <select value={bikeForm.category} onChange={(e) => setBikeForm({...bikeForm, category: e.target.value})} className="w-full h-10 rounded-xl bg-gray-50 border-gray-100 px-4 text-xs outline-none">
                                {['Matic', 'Sport', 'Cub', 'Adventure', 'Electric'].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Starting Price</Label>
                              <Input type="number" value={bikeForm.startingPrice} onChange={(e) => setBikeForm({...bikeForm, startingPrice: e.target.value})} className="h-10 rounded-xl bg-gray-50" required />
                            </div>
                          </div>

                          {/* Deskripsi */}
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Desc (ID)</Label><Textarea value={bikeForm.description_id} onChange={(e) => setBikeForm({...bikeForm, description_id: e.target.value})} className="min-h-[80px] rounded-xl bg-gray-50 text-xs" /></div>
                            <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Desc (EN)</Label><Textarea value={bikeForm.description_en} onChange={(e) => setBikeForm({...bikeForm, description_en: e.target.value})} className="min-h-[80px] rounded-xl bg-gray-50 text-xs" /></div>
                          </div>

                          {/* Spesifikasi */}
                          <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Technical Specs</h3>
                            <div className="grid grid-cols-3 gap-4">
                              {['engineType', 'boreStroke', 'displacement', 'compressionRatio', 'maxPower', 'maxTorque', 'clutchType', 'starterType', 'sparkPlug', 'fuelSystem', 'transmissionType', 'ignitionSystem'].map((spec) => (
                                <div key={spec} className="space-y-1">
                                  <Label className="text-[8px] uppercase font-bold text-gray-300">{spec.replace(/([A-Z])/g, ' $1')}</Label>
                                  <Input value={(bikeForm as any)[spec] || ''} onChange={(e) => setBikeForm({...bikeForm, [spec]: e.target.value})} className="h-9 rounded-lg bg-gray-50 text-xs px-3" />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Varian */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Variants</h3>
                              <Button type="button" variant="outline" size="sm" className="h-8 text-[9px] rounded-lg" onClick={addVariant}>
                                <Plus className="w-3 h-3 mr-1" /> Add Variant
                              </Button>
                            </div>
                            {bikeForm.variants.map((variant, idx) => (
                              <div key={idx} className="flex gap-3 items-center border rounded-xl p-3 bg-gray-50/50">
                                <Input placeholder="Name" value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} className="h-9 text-xs flex-1" />
                                <Input placeholder="Price" type="number" value={variant.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} className="h-9 text-xs w-24" />
                                <Input placeholder="Color" value={variant.color} onChange={(e) => updateVariant(idx, 'color', e.target.value)} className="h-9 text-xs w-24" />
                                {bikeForm.variants.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeVariant(idx)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Visual */}
                          <div className="space-y-6">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5" /> Visual Assets</h3>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3">
                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                <Input type="file" className="text-[9px]" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                <span className="text-[8px] text-gray-400">Main image</span>
                              </div>
                              <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3">
                                <GalleryIcon className="w-6 h-6 text-gray-300" />
                                <Input type="file" multiple className="text-[9px]" onChange={(e) => setGalleryFiles([...galleryFiles, ...Array.from(e.target.files || [])])} />
                                <span className="text-[8px] text-gray-400">Gallery (multiple)</span>
                              </div>
                            </div>
                          </div>

                          <Button disabled={uploading} type="submit" className="w-full h-14 bg-black text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest">
                            {uploading ? <Loader2 className="animate-spin h-5 w-5" /> : 'COMMIT CHANGES'}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={handleDealerSubmit} className="space-y-6 pb-8">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Node Name</Label>
                              <Input value={dealerForm.name} onChange={(e) => setDealerForm({...dealerForm, name: e.target.value})} required className="h-10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Territory</Label>
                              <Input value={dealerForm.city} onChange={(e) => setDealerForm({...dealerForm, city: e.target.value})} required className="h-10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Phone</Label>
                              <Input value={dealerForm.phone} onChange={(e) => setDealerForm({...dealerForm, phone: e.target.value})} required className="h-10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">WhatsApp</Label>
                              <Input value={dealerForm.whatsapp} onChange={(e) => setDealerForm({...dealerForm, whatsapp: e.target.value})} placeholder="628..." required className="h-10 rounded-xl" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Maps URL</Label>
                            <Input value={dealerForm.mapUrl} onChange={(e) => setDealerForm({...dealerForm, mapUrl: e.target.value})} className="h-10 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Address</Label>
                            <Textarea value={dealerForm.address} onChange={(e) => setDealerForm({...dealerForm, address: e.target.value})} className="h-20 rounded-xl" />
                          </div>
                          <Button type="submit" className="w-full h-14 bg-black text-white rounded-2xl font-bold uppercase text-[10px]">SYNC NODE</Button>
                        </form>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Tabel Desktop */}
          <Card className="rounded-[24px] border-gray-100 bg-white shadow-sm overflow-hidden p-0 border">
            <Table>
              <TableHeader className="bg-[#fafafa]">
                <TableRow className="border-gray-50">
                  {activeTab === 'applications' ? (
                    <>
                      <TableHead className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-gray-400">Identity</TableHead>
                      <TableHead className="py-4 text-[9px] uppercase tracking-widest font-bold text-gray-400">Request</TableHead>
                      <TableHead className="py-4 text-[9px] uppercase tracking-widest font-bold text-gray-400">Status</TableHead>
                      <TableHead className="text-right py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-gray-400">Operations</TableHead>
                    </>
                  ) : activeTab === 'motorcycles' ? (
                    <>
                      <TableHead className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-gray-400">Asset</TableHead>
                      <TableHead className="py-4 text-[9px] uppercase tracking-widest font-bold text-gray-400">Segment</TableHead>
                      <TableHead className="py-4 text-[9px] uppercase tracking-widest font-bold text-gray-400">Valuation</TableHead>
                      <TableHead className="text-right py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-gray-400">Operations</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-gray-400">Identity</TableHead>
                      <TableHead className="py-4 text-[9px] uppercase tracking-widest font-bold text-gray-400">Endpoints</TableHead>
                      <TableHead className="text-right py-4 px-6 text-[9px] uppercase tracking-widest font-bold text-gray-400">Operations</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab === 'applications' &&
                  applications?.map((app: any) => (
                    <TableRow key={app.id} className="border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="px-6">
                        <div className="font-bold text-xs">{app.name}</div>
                        <div className="text-[9px] text-gray-400 font-bold">{app.phone} • {app.city}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-[11px]">{app.motorcycleName}</div>
                        <div className="text-[9px] text-gray-400">{app.dpPercentage}% DP</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-md px-2 py-0.5 text-[8px] uppercase tracking-wider", app.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : app.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>{app.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right px-6 space-x-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateAppStatus(app.id, 'approved')}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => updateAppStatus(app.id, 'rejected')}><XCircle className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-black" onClick={() => deleteRecord('creditApplications', app.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {activeTab === 'motorcycles' &&
                  motorcycles?.map((bike: any) => (
                    <TableRow key={bike.id} className="border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="px-6 font-bold text-xs">{bike.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[8px] rounded-md">{bike.category}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">Rp {bike.startingPrice?.toLocaleString()}</TableCell>
                      <TableCell className="text-right px-6 space-x-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-black" onClick={() => openEditBike(bike)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-red-500" onClick={() => deleteRecord('motorcycles', bike.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {activeTab === 'dealers' &&
                  dealers?.map((dealer: any) => (
                    <TableRow key={dealer.id} className="border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="px-6"><div className="font-bold text-xs">{dealer.name}</div><div className="text-[9px] text-gray-400 font-bold uppercase">{dealer.city}</div></TableCell>
                      <TableCell className="space-y-0.5"><div className="text-[10px] text-gray-400 font-mono">+{dealer.whatsapp}</div></TableCell>
                      <TableCell className="text-right px-6 space-x-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-black" onClick={() => openEditDealer(dealer)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-red-500" onClick={() => deleteRecord('dealers', dealer.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Komponen tambahan
function SidebarBtn({ active, icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full justify-start rounded-xl gap-3 h-10 font-bold text-[10px] transition-all uppercase tracking-wider",
        active ? "bg-black text-white shadow-md" : "text-gray-400 hover:bg-gray-50 hover:text-black"
      )}
    >
      {icon} {label}
    </Button>
  );
}

function MobileTab({ active, icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
        active ? "bg-black text-white shadow-sm" : "bg-white border text-gray-500"
      )}
    >
      {icon} {label}
    </button>
  );
}
