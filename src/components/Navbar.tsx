
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight, Phone, MessageSquare, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { name: t('nav_catalog'), href: '/motor' },
    { name: t('nav_simulation'), href: '/simulasi-kredit' },
    { name: t('nav_dealer'), href: '/dealer' },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const toggleLang = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  return (
    <nav className="fixed top-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 h-16">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        
        <Link href="/" className="z-[110]" onClick={() => setIsOpen(false)}>
          <span className="font-bold text-lg tracking-tight text-black">
            EVAN HONDA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === item.href ? "text-black" : "text-gray-400 hover:text-black"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          <div className="flex items-center gap-4 border-l border-gray-100 pl-8">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-2 text-xs font-bold hover:text-black transition-colors h-10 px-3 border border-gray-200 rounded-lg"
            >
              <Globe className="h-4 w-4" />
              {language.toUpperCase()}
            </button>
            <Button className="bg-black text-white hover:bg-zinc-800 h-10 px-6 rounded-lg text-xs font-semibold shadow-lg shadow-black/5" asChild>
              <Link href="/ajukan-kredit">{t('nav_acquire')}</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-black z-[110] p-2 -mr-2" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <div className={cn(
        "fixed inset-0 bg-white z-[105] flex flex-col transition-all duration-500 ease-in-out",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="flex-1 flex flex-col pt-32 px-10 pb-10">
          <div className="space-y-6">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Navigation</p>
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center justify-between text-4xl font-bold tracking-tight group transition-all duration-300",
                  "animate-in fade-in slide-in-from-top-6",
                  pathname === item.href ? "text-black" : "text-gray-300 hover:text-black"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {item.name}
                <ArrowRight className={cn("h-6 w-6 transition-transform", pathname === item.href ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-2")} />
              </Link>
            ))}
          </div>

          <div className="mt-12 space-y-4 border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Settings</p>
             <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
               <span className="text-sm font-bold flex items-center gap-3">
                 <Globe className="h-4 w-4" />
                 Language
               </span>
               <button 
                 onClick={toggleLang}
                 className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold"
               >
                 {language.toUpperCase()}
               </button>
             </div>
          </div>

          <div className="mt-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-2 gap-4">
              <a href="tel:1500989" className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-xs font-bold">Call Center</span>
                <span className="text-[10px] text-gray-400">1-500-989</span>
              </a>
              <a href="https://wa.me/6281112345678" className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <span className="text-xs font-bold">WhatsApp</span>
                <span className="text-[10px] text-gray-400">Direct Chat</span>
              </a>
            </div>

            <Button className="w-full h-14 bg-black text-white rounded-xl text-sm font-bold shadow-2xl shadow-black/10" asChild onClick={() => setIsOpen(false)}>
              <Link href="/ajukan-kredit">{t('nav_acquire')}</Link>
            </Button>
            
            <div className="text-center">
              <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">
                © {new Date().getFullYear()} Evan Honda Selamat Motor
              </p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
