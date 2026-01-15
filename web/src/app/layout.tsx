import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'PBALend - DeFi Lending Protocol',
  description: 'Next Gen DeFi Lending with dual-token markets and oracle integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
