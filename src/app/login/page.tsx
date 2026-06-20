
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Lock, Mail, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Login Gagal",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full sky-gradient-wash opacity-50 pointer-events-none"></div>
      
      <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl z-10 bg-white/80 backdrop-blur-xl animate-expo-entry">
        <CardHeader className="space-y-4 text-center pb-8 pt-12">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl shadow-black/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-bold tracking-expo-display">Command Center</CardTitle>
            <CardDescription className="text-gray-400 font-medium">Authorized Personnel Only</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 px-8 pb-12">
          <form onSubmit={handleEmailLogin} className="space-y-5">
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
              {loading ? <Loader2 className="animate-spin" /> : "Sign In to Portal"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100"></span>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-white px-4 text-gray-300">Identity Provider</span>
            </div>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full h-14 rounded-2xl gap-3 border-gray-100 hover:bg-gray-50 font-bold" onClick={handleGoogleLogin}>
              <Chrome className="w-5 h-5" /> Continue with Google
            </Button>
            
            <div className="text-center pt-4">
              <Link href="/register" className="text-sm font-bold text-[#0d74ce] hover:underline flex items-center justify-center gap-2">
                Create Admin Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-8 text-center w-full text-[10px] text-gray-300 font-bold uppercase tracking-widest">
        © {new Date().getFullYear()} EVAN HONDA SELAMAT MOTOR
      </div>
    </div>
  );
}
