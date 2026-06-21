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
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ... (semua state dan hooks yang sudah ada tetap sama)
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
      .then(() => toast({ title: "Updated", description: `Application ${status}.` }))
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
    // ... (fungsi bulk import tetap sama)
  };

  const openEditBike = (bike: any) => {
    // ... (fungsi tetap)
  };

  const openEditDealer = (dealer: any) => {
    // ... (fungsi tetap)
  };

  const handleBikeSubmit = async (e: React.FormEvent) => {
    // ... (fungsi tetap)
  };

  const handleDealerSubmit = async (e: React.FormEvent) => {
    // ... (fungsi tetap)
  };

  // --- MOBILE RENDER ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col">
        {/* Header mobile */}
        <div className="bg-white border-b border-gray-100 px-3 py-3 flex items-center justify-between">
          <h1 className="text-[10px] font-bold tracking-[0.2em] flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center text-white text-[8px]">EV</div>
            CMND CENTER
          </h1>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav tabs horizontal */}
        <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-1 overflow-x-auto">
          <MobileTab active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} icon={<Users className="w-3 h-3" />} label="Leads" />
          <MobileTab active={activeTab === 'motorcycles'} onClick={() => setActiveTab('motorcycles')} icon={<Bike className="w-3 h-3" />} label="Inventory" />
          <MobileTab active={activeTab === 'dealers'} onClick={() => setActiveTab('dealers')} icon={<MapPin className="w-3 h-3" />} label="Nodes" />
        </div>

        {/* Konten utama */}
        <div className="flex-1 p-3 space-y-4">
          {/* Header aksi */}
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
                          {/* Form bike compact */}
                          <div className="space-y-3">
                            <Input value={bikeForm.name} onChange={(e) => setBikeForm({...bikeForm, name: e.target.value})} placeholder="Model name" className="h-9 rounded-lg text-xs" required />
                            <select value={bikeForm.category} onChange={(e) => setBikeForm({...bikeForm, category: e.target.value as any})} className="w-full h-9 rounded-lg bg-gray-50 border px-3 text-xs">
                              {['Matic', 'Sport', 'Cub', 'Adventure', 'Electric'].map(c => <option key={c}>{c}</option>)}
                            </select>
                            <Input type="number" value={bikeForm.startingPrice} onChange={(e) => setBikeForm({...bikeForm, startingPrice: e.target.value})} placeholder="Price" className="h-9 rounded-lg text-xs" required />
                            <Textarea value={bikeForm.description_id} onChange={(e) => setBikeForm({...bikeForm, description_id: e.target.value})} placeholder="Desc ID" className="min-h-[60px] rounded-lg text-xs" />
                            <Textarea value={bikeForm.description_en} onChange={(e) => setBikeForm({...bikeForm, description_en: e.target.value})} placeholder="Desc EN" className="min-h-[60px] rounded-lg text-xs" />
                            {/* Specs ringkas */}
                            <div className="grid grid-cols-2 gap-2">
                              {['engineType', 'displacement', 'maxPower', 'fuelSystem'].map(spec => (
                                <Input key={spec} placeholder={spec.replace(/([A-Z])/g, ' $1')} value={(bikeForm as any)[spec] || ''} onChange={(e) => setBikeForm({...bikeForm, [spec]: e.target.value})} className="h-8 rounded-lg text-[10px]" />
                              ))}
                            </div>
                            {/* Visual */}
                            <div className="flex gap-2">
                              <Input type="file" className="text-[9px] h-9" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                              <Input type="file" multiple className="text-[9px] h-9" onChange={(e) => setGalleryFiles([...galleryFiles, ...Array.from(e.target.files || [])])} />
                            </div>
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

          {/* List kartu mobile */}
          <div className="space-y-2">
            {activeTab === 'applications' && applications?.map(app => (
              <div key={app.id} className="bg-white p-3 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-bold">{app.name}</div>
                    <div className="text-[10px] text-gray-500">{app.phone} • {app.city}</div>
                    <div className="text-[10px] mt-1">{app.motorcycleName} – DP {app.dpPercentage}%</div>
                  </div>
                  <Badge className={cn("text-[8px] px-2 py-0.5", app.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : app.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                    {app.status}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2 justify-end">
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateAppStatus(app.id, 'approved')}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => updateAppStatus(app.id, 'rejected')}><XCircle className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-300 hover:text-black" onClick={() => deleteRecord('creditApplications', app.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
            {activeTab === 'motorcycles' && motorcycles?.map(bike => (
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
            {activeTab === 'dealers' && dealers?.map(dealer => (
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

  // --- DESKTOP RENDER (sebelumnya) ---
  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans text-[#171717]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-screen hidden lg:flex">
        {/* ... sidebar sama seperti sebelumnya ... */}
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

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header + aksi desktop */}
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
                          {/* form desktop lengkap seperti sebelumnya */}
                          {/* ... (biarkan semua field, hanya penyesuaian kelas) ... */}
                          {/* Saya tidak tulis ulang semua, gunakan yang sudah ada */}
                        </form>
                      ) : (
                        <form onSubmit={handleDealerSubmit} className="space-y-6 pb-8">
                          {/* form dealer desktop */}
                        </form>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Table View - Desktop */}
          <Card className="rounded-[24px] border-gray-100 bg-white shadow-sm overflow-hidden p-0 border">
            <Table>
              {/* ... tabel desktop sama persis seperti sebelumnya ... */}
              {/* Saya tidak tulis ulang untuk hemat, tetap sama */}
            </Table>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Komponen tambahan
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

function MobileTab({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
      active ? "bg-black text-white shadow-sm" : "bg-white border text-gray-500"
    )}>
      {icon} {label}
    </button>
  );
}
