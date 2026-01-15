'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Faucet', href: '/faucet' },
  ];

  return (
    <header className="border-b border-neutral-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-emerald-500 glow-emerald-text">PBA</span>
            <span className="text-white">Lend</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  );
}
