'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PBALend',
  projectId: 'pbalend-demo', // Get from WalletConnect Cloud for production
  chains: [sepolia],
  ssr: true,
});
