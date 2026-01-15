'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useFaucet } from '@/hooks/use-faucet';
import { ERC20_ABI } from '@/config/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Mock Token Configuration
const TOKENS = [
  {
    symbol: 'USDC',
    name: 'USD Coin (Mock)',
    address: '0x55E071C211fA197CFF0633b19B0270C8dfaD8761',
    decimals: 18,
    color: 'bg-blue-500',
    mintAmount: '1000'
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether (Mock)',
    address: '0x4FC9b63D8F9625d048c890d67FA64C33443F8bc8',
    decimals: 18,
    color: 'bg-purple-500',
    mintAmount: '10'
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin (Mock)',
    address: '0x02D33F3D69A26350277A3CE934F61daDB72A400C',
    decimals: 18,
    color: 'bg-yellow-500',
    mintAmount: '1000'
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin (Mock)',
    address: '0x9A8A5686E94dC48E6a1823DdE4eCdBdbD19ea8fA',
    decimals: 18,
    color: 'bg-orange-500',
    mintAmount: '1'
  }
] as const;

export default function FaucetPage() {
  const { isConnected, address } = useAccount();
  const { mint, isLoading, isSuccess, hash } = useFaucet();

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="py-16 px-6 border-b border-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Testnet Faucet
          </h1>
          <p className="text-neutral-500 text-lg">
            Mint free mock tokens to test the PBA Lend protocol on Sepolia testnet.
          </p>
        </div>
      </section>

      {/* Token Grid */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        {!isConnected ? (
          <div className="text-center py-20 bg-neutral-900/50 rounded-xl border border-neutral-800">
            <h3 className="text-xl font-medium text-white mb-4">
              Connect your wallet to access the faucet
            </h3>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {TOKENS.map((token) => (
              <TokenCard 
                key={token.symbol} 
                token={token} 
                userAddress={address}
                onMint={() => mint(token.address, address!, token.mintAmount, token.decimals)}
                isMinting={isLoading}
              />
            ))}
          </div>
        )}

        {/* Transaction Success Message */}
        {isSuccess && hash && (
          <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3">
              <span className="text-emerald-500 bg-emerald-500/20 p-2 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-white font-medium">Tokens Minted Successfully!</p>
                <p className="text-neutral-400 text-sm">Your balance will update shortly.</p>
              </div>
            </div>
            <a 
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium hover:underline"
            >
              View on Etherscan
            </a>
          </div>
        )}
      </section>
    </div>
  );
}

function TokenCard({ token, userAddress, onMint, isMinting }: { 
  token: typeof TOKENS[number], 
  userAddress?: `0x${string}`, 
  onMint: () => void,
  isMinting: boolean
}) {
  // Fetch Balance
  const { data: balance, refetch } = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${token.color} flex items-center justify-center text-white font-bold shadow-lg`}>
            {token.symbol[0]}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{token.name}</h3>
            <p className="text-neutral-500 text-sm font-mono">{token.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Balance</p>
          <p className="text-white font-mono font-medium">
            {balance ? parseFloat(formatUnits(balance, token.decimals)).toLocaleString() : '0.00'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-neutral-900 rounded-lg p-3 mb-6">
        <span className="text-neutral-500 text-xs font-mono truncate max-w-[200px]">
          {token.address}
        </span>
        <button 
          onClick={() => navigator.clipboard.writeText(token.address)}
          className="text-neutral-400 hover:text-white transition-colors"
          title="Copy Address"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <button
        onClick={onMint}
        disabled={isMinting}
        className="w-full py-3 bg-neutral-100 hover:bg-white text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isMinting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Minting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Mint {token.mintAmount} {token.symbol}
          </>
        )}
      </button>
    </div>
  );
}
