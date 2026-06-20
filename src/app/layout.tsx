import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/app/context/LanguageContext';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Evan Honda Selamat Motor | Official Experience',
  description: 'Explore Honda motorcycle lineup, simulate your credit payments, and get AI-powered recommendations for your next ride.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-white text-[#171717] min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster />
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="bg-white py-16 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <h3 className="font-bold text-lg tracking-tight">EVAN HONDA</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Authorized Honda Experience Platform.<br/>One Heart for every journey.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-xs uppercase tracking-wider mb-6 text-gray-400">Quick Links</h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="/motor" className="hover:text-black transition-colors">Catalog</a></li>
            <li><a href="/simulasi-kredit" className="hover:text-black transition-colors">Credit Simulator</a></li>
            <li><a href="/dealer" className="hover:text-black transition-colors">Find Dealer</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-xs uppercase tracking-wider mb-6 text-gray-400">Services</h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="#" className="hover:text-black transition-colors">Service Booking</a></li>
            <li><a href="#" className="hover:text-black transition-colors">Spare Parts</a></li>
            <li><a href="#" className="hover:text-black transition-colors">Trade-In</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-xs uppercase tracking-wider mb-6 text-gray-400">Contact</h4>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>Email: info@evanhonda.com</li>
            <li>Phone: 1-500-989</li>
            <li>WA: +62 811 1234 5678</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-gray-50 text-center">
        <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">
          © {new Date().getFullYear()} EVAN HONDA SELAMAT MOTOR. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
