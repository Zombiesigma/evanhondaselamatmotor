
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

  // Form Initial States
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

  // Memoized Queries
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
        toast({ title: "Operation Success", description: `Application status updated to ${status}.` });
      })
      .catch(async (err) => {
        const error = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: { status } });
        errorEmitter.emit('permission-error', error);
      });
  };

  const deleteRecord = (col: string, id: string) => {
    if (!db) return;
    if (confirm('Permanently delete this entry? This action cannot be undone.')) {
      const docRef = doc(db, col, id);
      deleteDoc(docRef)
        .then(() => {
          toast({ title: "Record Deleted", description: "Entries removed from secure database." });
        })
        .catch(async (err) => {
          const error = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
          errorEmitter.emit('permission-error', error);
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
          currentMotor = {
            name: name,
            category: 'Matic',
            image: 'motor-beat',
            description_id: `Honda ${name} terbaru dengan performa handal.`,
            description_en: `The latest Honda ${name} with reliable performance.`,
            variants: [{ name: 'Standard', price: 0, color: 'Default' }],
            leasingTable: [] as LeasingRow[],
            specs: {
              engineType: '4-Langkah, SOHC, eSP',
              displacement: '110cc',
              fuelSystem: 'Injeksi (PGM-FI)'
            },
            createdAt: serverTimestamp()
          };
        } else if (line.includes('HARGA KENDARAAN') || line.includes('HARGA KEINDARAAN')) {
          const price = parseInt(line.replace(/[^0-9]/g, ''));
          if (currentMotor) {
            currentMotor.startingPrice = price;
            currentMotor.variants[0].price = price;
          }
        } else if (currentMotor && /^[0-9.]+\s+[0-9.]+\s+[0-9.]+/.test(line)) {
          // It's a leasing row: DP 11 17 23 29 35
          const parts = line.split(/\s+/).map(p => parseInt(p.replace(/[^0-9]/g, '')));
          if (parts.length >= 6) {
            currentMotor.leasingTable.push({
              dp: parts[0],
              installments: {
                "11": parts[1],
                "17": parts[2],
                "23": parts[3],
                "29": parts[4],
                "35": parts[5]
              }
            });
          }
        }
      }
      if (currentMotor) motorList.push(currentMotor);

      // Save to Firestore
      for (const motor of motorList) {
        await addDoc(collection(db, 'motorcycles'), motor);
      }

      toast({ title: "Import Success", description: `${motorList.length} motorcycles imported successfully.` });
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
      variants: (bike.variants || []).map((v: any) => ({
        name: v.name || '',
        price: v.price?.toString() || '',
        color: v.color || ''
      })) || [{ name: 'Standard', price: '', color: 'Black' }],
      gallery: bike.gallery || []
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
      mapUrl: dealer.mapUrl || ''
    });
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

      // 1. Upload Main Image if changed
      if (selectedFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(selectedFile);
        });
        const base64 = await base64Promise;
        finalImageUrl = await uploadToGithub(selectedFile.name, base64, folderName);
      }

      // 2. Upload New Gallery Files
      if (galleryFiles.length > 0) {
        const uploadedGallery = await Promise.all(
          galleryFiles.map(async (file) => {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
            });
            const base64 = await base64Promise;
            return uploadToGithub(file.name, base64, folderName);
          })
        );
        finalGallery = [...finalGallery, ...uploadedGallery];
      }

      // 3. LOGIC: Purge Placeholder if we have ANY real photos now
      // If finalImageUrl is still a placeholder ID AND we have a real URL in the gallery, promote it.
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
        variants: bikeForm.variants.map(v => ({ 
          name: v.name || 'Standard', 
          price: Number(v.price) || 0, 
          color: v.color || 'Default'
        })),
        specs: {
          engineType: bikeForm.engineType || '',
          boreStroke: bikeForm.boreStroke || '',
          displacement: bikeForm.displacement || '',
          compressionRatio: bikeForm.compressionRatio || '',
          maxPower: bikeForm.maxPower || '',
          maxTorque: bikeForm.maxTorque || '',
          clutchType: bikeForm.clutchType || '',
          starterType: bikeForm.starterType || '',
          sparkPlug: bikeForm.sparkPlug || '',
          fuelSystem: bikeForm.fuelSystem || '',
          transmissionType: bikeForm.transmissionType || '',
          ignitionSystem: bikeForm.ignitionSystem || ''
        },
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        const docRef = doc(db, 'motorcycles', editingId);
        await updateDoc(docRef, motorcycleData).catch(async (err) => {
          const error = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: motorcycleData });
          errorEmitter.emit('permission-error', error);
        });
      } else {
        const colRef = collection(db, 'motorcycles');
        await addDoc(colRef, { ...motorcycleData, createdAt: serverTimestamp() }).catch(async (err) => {
          const error = new FirestorePermissionError({ path: 'motorcycles', operation: 'create', requestResourceData: motorcycleData });
          errorEmitter.emit('permission-error', error);
        });
      }
      
      setIsAddOpen(false);
      setEditingId(null);
      setBikeForm(initialBikeState);
      setSelectedFile(null);
      setGalleryFiles([]);
      toast({ title: "Registry Updated", description: "The motorcycle catalog has been refreshed." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deployment Error", description: e.message });
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
        updatedAt: serverTimestamp() 
      };
      
      if (editingId) {
        const docRef = doc(db, 'dealers', editingId);
        updateDoc(docRef, dealerData).catch(async (err) => {
          const error = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dealerData });
          errorEmitter.emit('permission-error', error);
        });
      } else {
        const colRef = collection(db, 'dealers');
        addDoc(colRef, { ...dealerData, createdAt: serverTimestamp() }).catch(async (err) => {
          const error = new FirestorePermissionError({ path: 'dealers', operation: 'create', requestResourceData: dealerData });
          errorEmitter.emit('permission-error', error);
        });
      }
      
      setIsAddOpen(false);
      setEditingId(null);
      setDealerForm(initialDealerState);
      toast({ title: "Node Updated", description: "Dealer network has been synced." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const removeGalleryImage = (idx: number) => {
    const newGallery = [...bikeForm.gallery];
    newGallery.splice(idx, 1);
    setBikeForm({ ...bikeForm, gallery: newGallery });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans text-[#171717]">
      {/* Sidebar - Precision Engineered */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-10 sticky top-0 h-screen hidden lg:flex">
        <div className="mb-16">
          <h1 className="text-sm font-bold tracking-[0.3em] text-black flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white text-[11px] shadow-2xl">EV</div>
            CMND CENTER
          </h1>
        </div>
        <nav className="flex-1 space-y-3">
          <SidebarBtn active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Users className="w-4 h-4" />} label="Inbound Leads" />
          <SidebarBtn active={activeTab === 'motorcycles'} onClick={() => setActiveTab('motorcycles')} icon={<Bike className="w-4 h-4" />} label="Asset Catalog" />
          <SidebarBtn active={activeTab === 'dealers'} onClick={() => setActiveTab('dealers')} icon={<MapPin className="w-4 h-4" />} label="Network Nodes" />
        </nav>
        <div className="pt-10 border-t border-gray-100">
          <Button variant="ghost" className="w-full justify-start rounded-2xl gap-4 text-gray-400 hover:text-red-500 hover:bg-red-50 h-14 text-[10px] font-bold uppercase tracking-[0.2em] transition-all" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Terminate Session
          </Button>
        </div>
      </aside>

      {/* Main Command View */}
      <main className="flex-1 p-10 lg:p-20 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="space-y-6 animate-expo-entry">
              <h2 className="text-6xl md:text-8xl font-bold tracking-expo-display text-black">
                {activeTab === 'applications' ? 'Queue' : activeTab === 'motorcycles' ? 'Inventory' : 'Nodes'}
              </h2>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.4em] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Infrastructure Status: Operational
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {activeTab === 'motorcycles' && (
                <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-16 px-8 rounded-2xl border-gray-100 bg-white font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-gray-50">
                      <Database className="w-4 h-4" /> Bulk Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl rounded-[32px] bg-white">
                    <DialogHeader>
                      <DialogTitle>Bulk Data Infrastructure</DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                      <p className="text-sm text-gray-400">Paste your structured price list text here. Our AI will parse the models and leasing tables.</p>
                      <Textarea 
                        value={bulkData} 
                        onChange={(e) => setBulkData(e.target.value)}
                        placeholder="TYPE MOTOR BEAT..."
                        className="min-h-[400px] font-mono text-xs p-6 bg-gray-50"
                      />
                      <Button onClick={parseBulkImport} disabled={uploading || !bulkData} className="w-full h-16 bg-black text-white rounded-2xl font-bold uppercase tracking-widest shadow-2xl">
                        {uploading ? <Loader2 className="animate-spin h-5 w-5" /> : 'PROCESS INFRASTRUCTURE DATA'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeTab !== 'applications' && (
                <Dialog open={isAddOpen} onOpenChange={(open) => {
                  setIsAddOpen(open);
                  if (!open) {
                    setEditingId(null);
                    setBikeForm(initialBikeState);
                    setDealerForm(initialDealerState);
                    setGalleryFiles([]);
                    setSelectedFile(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-black text-white hover:bg-zinc-800 rounded-2xl h-16 px-10 font-bold text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95">
                      <Plus className="w-5 h-5" /> {activeTab === 'motorcycles' ? 'REGISTER ASSET' : 'ACTIVATE NODE'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-none rounded-[40px] p-0 overflow-hidden max-w-5xl shadow-[0_50px_100px_rgba(0,0,0,0.15)]">
                    <DialogHeader className="p-10 border-b border-gray-50 bg-[#fafafa]">
                      <DialogTitle className="text-3xl font-bold tracking-tight">
                        {editingId ? 'Modify System Entry' : activeTab === 'motorcycles' ? 'Register New Asset' : 'Activate Network Node'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <ScrollArea className="max-h-[75vh] p-10">
                      {activeTab === 'motorcycles' ? (
                        <form onSubmit={handleBikeSubmit} className="space-y-16 pb-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Identity / Model Name</Label>
                              <Input value={bikeForm.name} onChange={(e) => setBikeForm({...bikeForm, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold" placeholder="e.g. CBR250RR" required />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Commercial Category</Label>
                              <select value={bikeForm.category} onChange={(e) => setBikeForm({...bikeForm, category: e.target.value as any})} className="w-full h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold text-sm outline-none">
                                {['Matic', 'Sport', 'Cub', 'Adventure', 'Electric'].map(c => <option key={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">OTR Starting Price (IDR)</Label>
                              <Input type="number" value={bikeForm.startingPrice} onChange={(e) => setBikeForm({...bikeForm, startingPrice: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold" placeholder="19425000" required />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Marketing Narrative (ID)</Label>
                              <Textarea value={bikeForm.description_id} onChange={(e) => setBikeForm({...bikeForm, description_id: e.target.value})} className="min-h-[120px] rounded-2xl bg-gray-50 border-gray-100 p-6 leading-relaxed" />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Marketing Narrative (EN)</Label>
                              <Textarea value={bikeForm.description_en} onChange={(e) => setBikeForm({...bikeForm, description_en: e.target.value})} className="min-h-[120px] rounded-2xl bg-gray-50 border-gray-100 p-6 leading-relaxed" />
                            </div>
                          </div>

                          <div className="space-y-8">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] flex items-center gap-3">
                              <Settings className="w-4 h-4" /> Engineering Specs
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {['engineType', 'boreStroke', 'displacement', 'compressionRatio', 'maxPower', 'maxTorque', 'clutchType', 'starterType', 'sparkPlug', 'fuelSystem', 'transmissionType', 'ignitionSystem'].map((spec) => (
                                <div key={spec} className="space-y-4">
                                  <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">{spec.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                  <Input 
                                    value={(bikeForm as any)[spec] || ''} 
                                    onChange={(e) => setBikeForm({...bikeForm, [spec]: e.target.value})} 
                                    className="h-14 rounded-xl bg-gray-50 border-gray-100 px-5 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-12">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.4em] flex items-center gap-3">
                              <GalleryIcon className="w-4 h-4" /> Visual Infrastructure Management
                            </h3>
                            
                            {/* Current Photos Display */}
                            {bikeForm.gallery.length > 0 && (
                              <div className="space-y-6">
                                <Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">Active Gallery Items (Click X to Purge)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                  {bikeForm.gallery.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                                      <Image src={url} alt="Gallery" fill className="object-cover" />
                                      <button 
                                        type="button"
                                        onClick={() => removeGalleryImage(idx)}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4">
                                <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Update Main High-Res Photo</Label>
                                <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 flex flex-col items-center gap-4 text-center">
                                  <ImageIcon className="w-8 h-8 text-gray-300" />
                                  <Input type="file" className="max-w-xs cursor-pointer text-xs" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                  {bikeForm.image.startsWith('http') && <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Main photo linked to repository</p>}
                                </div>
                              </div>
                              <div className="space-y-4">
                                <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Append New Gallery Photos</Label>
                                <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50 flex flex-col items-center gap-4 text-center">
                                  <GalleryIcon className="w-8 h-8 text-gray-300" />
                                  <Input type="file" multiple className="max-w-xs cursor-pointer text-xs" onChange={(e) => setGalleryFiles([...galleryFiles, ...Array.from(e.target.files || [])])} />
                                </div>
                              </div>
                            </div>
                          </div>

                          <Button disabled={uploading} type="submit" className="w-full h-20 bg-black text-white rounded-[24px] font-bold text-[12px] uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.01]">
                            {uploading ? <Loader2 className="animate-spin h-6 w-6" /> : (editingId ? 'COMMIT SYSTEM UPDATE' : 'DEPLOY ASSET TO CATALOG')}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={handleDealerSubmit} className="space-y-10 pb-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Node Name</Label>
                              <Input value={dealerForm.name} onChange={(e) => setDealerForm({...dealerForm, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold" required />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Territory (City)</Label>
                              <Input value={dealerForm.city} onChange={(e) => setDealerForm({...dealerForm, city: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold" required />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Customer Support Phone</Label>
                              <Input value={dealerForm.phone} onChange={(e) => setDealerForm({...dealerForm, phone: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold" placeholder="e.g. 021-1234567" required />
                            </div>
                            <div className="space-y-4">
                              <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">WhatsApp Endpoint</Label>
                              <Input value={dealerForm.whatsapp} onChange={(e) => setDealerForm({...dealerForm, whatsapp: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold" placeholder="62812345678" required />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Google Maps Embed URL</Label>
                            <Input value={dealerForm.mapUrl} onChange={(e) => setDealerForm({...dealerForm, mapUrl: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-gray-100 px-6 font-bold" placeholder="https://www.google.com/maps/embed?pb=..." required />
                          </div>
                          <div className="space-y-4">
                            <Label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Deployment Address</Label>
                            <Textarea value={dealerForm.address} onChange={(e) => setDealerForm({...dealerForm, address: e.target.value})} className="min-h-[100px] rounded-2xl bg-gray-50 border-gray-100 p-6" required />
                          </div>
                          <Button type="submit" className="w-full h-20 bg-black text-white rounded-[24px] font-bold text-[12px] uppercase tracking-widest shadow-2xl">
                            {editingId ? 'UPDATE NODE COORDINATES' : 'ACTIVATE NEW NETWORK NODE'}
                          </Button>
                        </form>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Table Views */}
          <div className="animate-expo-entry delay-200">
            <Card className="rounded-[40px] border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden p-0 border">
              <Table>
                <TableHeader className="bg-[#fafafa]">
                  <TableRow className="border-gray-50">
                    {activeTab === 'applications' ? (
                      <>
                        <TableHead className="py-8 px-10 text-[10px] uppercase tracking-widest font-bold text-gray-400">Timeline</TableHead>
                        <TableHead className="py-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">Identity</TableHead>
                        <TableHead className="py-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">Asset Requested</TableHead>
                        <TableHead className="py-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">Compliance</TableHead>
                        <TableHead className="text-right py-8 px-10 text-[10px] uppercase tracking-widest font-bold text-gray-400">Operations</TableHead>
                      </>
                    ) : activeTab === 'motorcycles' ? (
                      <>
                        <TableHead className="py-8 px-10 text-[10px] uppercase tracking-widest font-bold text-gray-400">Asset Identity</TableHead>
                        <TableHead className="py-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">Segment</TableHead>
                        <TableHead className="py-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">Valuation</TableHead>
                        <TableHead className="text-right py-8 px-10 text-[10px] uppercase tracking-widest font-bold text-gray-400">Operations</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="py-8 px-10 text-[10px] uppercase tracking-widest font-bold text-gray-400">Territory</TableHead>
                        <TableHead className="py-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">Node Identity</TableHead>
                        <TableHead className="py-8 text-[10px] uppercase tracking-widest font-bold text-gray-400">Endpoints</TableHead>
                        <TableHead className="text-right py-8 px-10 text-[10px] uppercase tracking-widest font-bold text-gray-400">Operations</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === 'applications' ? (
                    appsLoading ? <LoadingRow colSpan={5} /> : applications?.map(app => (
                      <TableRow key={app.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-10 font-mono text-[11px] text-gray-400">{app.createdAt?.toDate().toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          <div className="font-bold text-sm">{app.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{app.phone} • {app.city}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-sm">{app.motorcycleName}</div>
                          <div className="text-[10px] text-gray-400 font-bold">{app.dpPercentage}% DP • {app.tenure}M</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "rounded-lg px-4 py-1 font-bold text-[9px] uppercase tracking-widest",
                            app.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                            app.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          )}>{app.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right px-10 space-x-3">
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-green-600 hover:bg-green-50 rounded-xl" onClick={() => updateAppStatus(app.id, 'approved')}><CheckCircle2 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => updateAppStatus(app.id, 'rejected')}><XCircle className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-300 hover:text-black rounded-xl" onClick={() => deleteRecord('creditApplications', app.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : activeTab === 'motorcycles' ? (
                    bikesLoading ? <LoadingRow colSpan={4} /> : motorcycles?.map(bike => (
                      <TableRow key={bike.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-10 font-bold text-sm">{bike.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold rounded-md border-gray-100">{bike.category}</Badge></TableCell>
                        <TableCell className="font-mono font-bold text-sm">Rp {bike.startingPrice?.toLocaleString() || '0'}</TableCell>
                        <TableCell className="text-right px-10 space-x-3">
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-300 hover:text-black rounded-xl" onClick={() => openEditBike(bike)}><Edit3 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-300 hover:text-red-500 rounded-xl" onClick={() => deleteRecord('motorcycles', bike.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    dealersLoading ? <LoadingRow colSpan={4} /> : dealers?.map(dealer => (
                      <TableRow key={dealer.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-10 font-bold uppercase tracking-widest text-[10px] text-gray-400">{dealer.city}</TableCell>
                        <TableCell className="font-bold text-sm">{dealer.name}</TableCell>
                        <TableCell className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono"><Phone className="w-3 h-3" /> {dealer.phone}</div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono"><MessageSquare className="w-3 h-3" /> +{dealer.whatsapp}</div>
                        </TableCell>
                        <TableCell className="text-right px-10 space-x-3">
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-300 hover:text-black rounded-xl" onClick={() => openEditDealer(dealer)}><Edit3 className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-300 hover:text-red-500 rounded-xl" onClick={() => deleteRecord('dealers', dealer.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarBtn({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} className={cn(
      "w-full justify-start rounded-2xl gap-5 h-14 font-bold text-[11px] transition-all uppercase tracking-widest",
      active ? "bg-black text-white shadow-2xl shadow-black/10" : "text-gray-400 hover:bg-gray-50 hover:text-black"
    )}>
      {icon} {label}
    </Button>
  );
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-32">
        <Loader2 className="animate-spin mx-auto h-8 w-8 text-gray-100" />
      </TableCell>
    </TableRow>
  );
}
