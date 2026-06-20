"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { 
  collection, query, orderBy, doc, updateDoc, deleteDoc, 
  addDoc, serverTimestamp 
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
  Palette, Images as GalleryIcon, ExternalLink, Phone, MessageSquare, Database
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
    gallery: [] as string[]
  };
  
  const [bikeForm, setBikeForm] = useState(initialBikeState);
  const [bulkData, setBulkData] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const initialDealerState = { 
    name: '', 
    city: '', 
    address: '', 
    phone: '',
    whatsapp: '',
    mapUrl: ''
  };
  const [dealerForm, setDealerForm] = useState(initialDealerState);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const appsQuery = useMemo(() => db ? query(collection(db, 'creditApplications'), orderBy('createdAt', 'desc')) : null, [db]);
  const bikesQuery = useMemo(() => db ? query(collection(db, 'motorcycles'), orderBy('createdAt', 'desc')) : null, [db]);
  const dealersQuery = useMemo(() => db ? query(collection(db, 'dealers'), orderBy('city', 'asc')) : null, [db]);

  const { data: applications, loading: appsLoading } = useCollection(appsQuery);
  const { data: motorcycles, loading: bikesLoading } = useCollection(bikesQuery);
  const { data: dealers, loading: dealersLoading } = useCollection(dealersQuery);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-black h-8 w-8" /></div>;

  const handleLogout = () => {
    signOut(getAuth());
    router.push('/login');
  };

  const updateAppStatus = (id: string, status: string) => {
    if (!db) return;
    const docRef = doc(db, 'creditApplications', id);
    updateDoc(docRef, { status })
      .then(() => {
        toast({ title: "Updated", description: `Application ${status}.` });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { status } }));
      });
  };

  const deleteRecord = (col: string, id: string) => {
    if (!db) return;
    if (confirm('Delete this entry?')) {
      const docRef = doc(db, col, id);
      deleteDoc(docRef)
        .then(() => toast({ title: "Deleted" }))
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
        });
    }
  };

  const parseBulkImport = async () => {
    if (!bulkData || !db) return;
    setUploading(true);
    try {
      const lines = bulkData.split('\n');
      let currentMotor: any = null;
      let motorList: any[] = [];
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        if (line.includes('TYPE MOTOR') || line.startsWith('TYPE MIOTOR')) {
          if (currentMotor) motorList.push(currentMotor);
          const name = line.replace(/TYPE MI?OTOR/g, '').trim();
          currentMotor = { name: name, category: 'Matic', image: 'motor-beat', description_id: `Honda ${name}`, description_en: `Honda ${name}`, variants: [{ name: 'Standard', price: 0, color: 'Default' }], leasingTable: [] as LeasingRow[], specs: { engineType: '4-Langkah, SOHC, eSP', displacement: '110cc', fuelSystem: 'Injeksi (PGM-FI)' }, createdAt: serverTimestamp() };
        } else if (line.includes('HARGA KENDARAAN') || line.includes('HARGA KEINDARAAN')) {
          const price = parseInt(line.replace(/[^0-9]/g, ''));
          if (currentMotor) { currentMotor.startingPrice = price; currentMotor.variants[0].price = price; }
        } else if (currentMotor && /^[0-9.]+\s+[0-9.]+\s+[0-9.]+/.test(line)) {
          const parts = line.split(/\s+/).map(p => parseInt(p.replace(/[^0-9]/g, '')));
          if (parts.length >= 6) { currentMotor.leasingTable.push({ dp: parts[0], installments: { "11": parts[1], "17": parts[2], "23": parts[3], "29": parts[4], "35": parts[5] } }); }
        }
      }
      if (currentMotor) motorList.push(currentMotor);
      for (const motor of motorList) { await addDoc(collection(db, 'motorcycles'), motor); }
      toast({ title: "Import Success" });
      setIsBulkOpen(false);
      setBulkData('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Error", description: e.message });
    } finally {
      setUploading(false);
    }
  };

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
      variants: (bike.variants || []).map((v: any) => ({ name: v.name || '', price: v.price?.toString() || '', color: v.color || '' })) || [{ name: 'Standard', price: '', color: 'Black' }],
      gallery: bike.gallery || []
    });
    setIsAddOpen(true);
  };

  const openEditDealer = (dealer: any) => {
    setEditingId(dealer.id);
    setDealerForm({ name: dealer.name || '', city: dealer.city || '', address: dealer.address || '', phone: dealer.phone || '', whatsapp: dealer.whatsapp || '', mapUrl: dealer.mapUrl || '' });
    setIsAddOpen(true);
  };

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
        const uploadedGallery = await Promise.all(galleryFiles.map(async (file) => {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          return uploadToGithub(file.name, await base64Promise, folderName);
        }));
        finalGallery = [...finalGallery, ...uploadedGallery];
      }
      if (!finalImageUrl.startsWith('http') && finalGallery.length > 0) finalImageUrl = finalGallery[0];

      const motorcycleData = {
        name: bikeForm.name, category: bikeForm.category, startingPrice: Number(bikeForm.startingPrice) || 0,
        image: finalImageUrl, gallery: finalGallery, description_id: bikeForm.description_id, description_en: bikeForm.description_en,
        variants: bikeForm.variants.map(v => ({ name: v.name || 'Standard', price: Number(v.price) || 0, color: v.color || 'Default' })),
        specs: { engineType: bikeForm.engineType, boreStroke: bikeForm.boreStroke, displacement: bikeForm.displacement, compressionRatio: bikeForm.compressionRatio, maxPower: bikeForm.maxPower, maxTorque: bikeForm.maxTorque, clutchType: bikeForm.clutchType, starterType: bikeForm.starterType, sparkPlug: bikeForm.sparkPlug, fuelSystem: bikeForm.fuelSystem, transmissionType: bikeForm.transmissionType, ignitionSystem: bikeForm.ignitionSystem },
        updatedAt: serverTimestamp()
      };

      if (editingId) await updateDoc(doc(db, 'motorcycles', editingId), motorcycleData);
      else await addDoc(collection(db, 'motorcycles'), { ...motorcycleData, createdAt: serverTimestamp() });
      
      setIsAddOpen(false); setEditingId(null); setBikeForm(initialBikeState); setSelectedFile(null); setGalleryFiles([]);
      toast({ title: "Catalog Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDealerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      const dealerData = { ...dealerForm, updatedAt: serverTimestamp() };
      if (editingId) await updateDoc(doc(db, 'dealers', editingId), dealerData);
      else await addDoc(collection(db, 'dealers'), { ...dealerData, createdAt: serverTimestamp() });
      setIsAddOpen(false); setEditingId(null); setDealerForm(initialDealerState);
      toast({ title: "Node Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans text-[#171717]">
      {/* Sidebar - More Compact */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-screen hidden lg:flex">
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

      {/* Main Command View - Tighter Padding */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
                {activeTab === 'applications' ? 'Queue' : activeTab === 'motorcycles' ? 'Inventory' : 'Nodes'}
              </h2>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Operational
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
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Model Name</Label>
                              <Input value={bikeForm.name} onChange={(e) => setBikeForm({...bikeForm, name: e.target.value})} className="h-10 rounded-xl bg-gray-50" required />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Category</Label>
                              <select value={bikeForm.category} onChange={(e) => setBikeForm({...bikeForm, category: e.target.value as any})} className="w-full h-10 rounded-xl bg-gray-50 border-gray-100 px-4 text-xs outline-none">
                                {['Matic', 'Sport', 'Cub', 'Adventure', 'Electric'].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Starting Price</Label>
                              <Input type="number" value={bikeForm.startingPrice} onChange={(e) => setBikeForm({...bikeForm, startingPrice: e.target.value})} className="h-10 rounded-xl bg-gray-50" required />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Desc (ID)</Label><Textarea value={bikeForm.description_id} onChange={(e) => setBikeForm({...bikeForm, description_id: e.target.value})} className="min-h-[80px] rounded-xl bg-gray-50 text-xs" /></div>
                            <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Desc (EN)</Label><Textarea value={bikeForm.description_en} onChange={(e) => setBikeForm({...bikeForm, description_en: e.target.value})} className="min-h-[80px] rounded-xl bg-gray-50 text-xs" /></div>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Specs</h3>
                            <div className="grid grid-cols-3 gap-4">
                              {['engineType', 'boreStroke', 'displacement', 'compressionRatio', 'maxPower', 'maxTorque', 'clutchType', 'starterType', 'sparkPlug', 'fuelSystem', 'transmissionType', 'ignitionSystem'].map((spec) => (
                                <div key={spec} className="space-y-1">
                                  <Label className="text-[8px] uppercase font-bold text-gray-300">{spec.replace(/([A-Z])/g, ' $1')}</Label>
                                  <Input value={(bikeForm as any)[spec] || ''} onChange={(e) => setBikeForm({...bikeForm, [spec]: e.target.value})} className="h-9 rounded-lg bg-gray-50 text-xs px-3" />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-6">
                             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><GalleryIcon className="w-3.5 h-3.5" /> Visuals</h3>
                             <div className="grid grid-cols-2 gap-6">
                               <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3">
                                 <ImageIcon className="w-6 h-6 text-gray-300" />
                                 <Input type="file" className="text-[9px]" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                               </div>
                               <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3">
                                 <GalleryIcon className="w-6 h-6 text-gray-300" />
                                 <Input type="file" multiple className="text-[9px]" onChange={(e) => setGalleryFiles([...galleryFiles, ...Array.from(e.target.files || [])])} />
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
                            <Input value={dealerForm.name} onChange={(e) => setDealerForm({...dealerForm, name: e.target.value})} placeholder="Node Name" required className="h-10 rounded-xl" />
                            <Input value={dealerForm.city} onChange={(e) => setDealerForm({...dealerForm, city: e.target.value})} placeholder="Territory" required className="h-10 rounded-xl" />
                            <Input value={dealerForm.phone} onChange={(e) => setDealerForm({...dealerForm, phone: e.target.value})} placeholder="Phone" required className="h-10 rounded-xl" />
                            <Input value={dealerForm.whatsapp} onChange={(e) => setDealerForm({...dealerForm, whatsapp: e.target.value})} placeholder="WA (e.g. 628...)" required className="h-10 rounded-xl" />
                          </div>
                          <Input value={dealerForm.mapUrl} onChange={(e) => setDealerForm({...dealerForm, mapUrl: e.target.value})} placeholder="Maps URL" className="h-10 rounded-xl" />
                          <Textarea value={dealerForm.address} onChange={(e) => setDealerForm({...dealerForm, address: e.target.value})} placeholder="Address" className="h-20 rounded-xl" />
                          <Button type="submit" className="w-full h-14 bg-black text-white rounded-2xl font-bold uppercase text-[10px]">SYNC NODE</Button>
                        </form>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Table Views - Optimized Density */}
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
                {activeTab === 'applications' ? (
                  applications?.map(app => (
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
                  ))
                ) : activeTab === 'motorcycles' ? (
                  motorcycles?.map(bike => (
                    <TableRow key={bike.id} className="border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="px-6 font-bold text-xs">{bike.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[8px] rounded-md">{bike.category}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">Rp {bike.startingPrice?.toLocaleString()}</TableCell>
                      <TableCell className="text-right px-6 space-x-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-black" onClick={() => openEditBike(bike)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-red-500" onClick={() => deleteRecord('motorcycles', bike.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  dealers?.map(dealer => (
                    <TableRow key={dealer.id} className="border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="px-6"><div className="font-bold text-xs">{dealer.name}</div><div className="text-[9px] text-gray-400 font-bold uppercase">{dealer.city}</div></TableCell>
                      <TableCell className="space-y-0.5"><div className="text-[10px] text-gray-400 font-mono">+{dealer.whatsapp}</div></TableCell>
                      <TableCell className="text-right px-6 space-x-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-black" onClick={() => openEditDealer(dealer)}><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-300 hover:text-red-500" onClick={() => deleteRecord('dealers', dealer.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}

function SidebarBtn({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn(
      "w-full justify-start rounded-xl gap-3 h-10 font-bold text-[10px] transition-all uppercase tracking-wider",
      active ? "bg-black text-white shadow-md" : "text-gray-400 hover:bg-gray-50 hover:text-black"
    )}>
      {icon} {label}
    </Button>
  );
}
