import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PBALend - DeFi Lending Protocol',
  description: 'Next Gen DeFi Lending with dual-token markets and oracle integration',
  icons: {
    icon: 'https://i.ibb.co.com/DPj1txVn/Columbina.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex flex-col">
        {/* Mobile Warning Overlay */}
        <div className="md:hidden fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mb-6 border border-neutral-800">
             <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Desktop Experience Required</h2>
          <p className="text-neutral-500">
            PBALend is currently optimized for desktop use only. Please access this application from a computer for the best experience.
          </p>
        </div>

        <Providers>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
