
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, Loader2, UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth();
  const db = useFirestore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create admin profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: 'admin',
        createdAt: serverTimestamp()
      });

      toast({
        title: "Registration Success",
        description: "Admin account created successfully.",
      });
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full sky-gradient-wash opacity-50 pointer-events-none"></div>
      
      <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl z-10 bg-white/80 backdrop-blur-xl animate-expo-entry">
        <CardHeader className="space-y-4 text-center pb-8 pt-12">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl shadow-black/10">
            <UserPlus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-bold tracking-expo-display">New Admin</CardTitle>
            <CardDescription className="text-gray-400 font-medium">Register for administrative access</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 px-8 pb-12">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                <Input 
                  type="email" 
                  placeholder="admin@honda.com" 
                  className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pl-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 bg-black text-white rounded-2xl font-bold text-lg shadow-xl shadow-black/20 hover:scale-[1.02] transition-all" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Register Admin"}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link href="/login" className="text-sm font-bold text-gray-400 hover:text-black flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
