'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { useDeposit } from '@/hooks/use-deposit';
import { useBorrow } from '@/hooks/use-borrow';
import { useRepay } from '@/hooks/use-repay';
import { useWithdraw } from '@/hooks/use-withdraw';
import { useWithdrawCollateral } from '@/hooks/use-withdraw-collateral';
import { useTransactionHistory, HistoryTransaction } from '@/hooks/use-transaction-history';

// Deployed Sepolia Addresses
const MARKETS = [
  {
    id: 'usdc-weth',
    loanToken: '0x55E071C211fA197CFF0633b19B0270C8dfaD8761' as `0x${string}`,
    loanSymbol: 'USDC',
    loanDecimals: 6,
    collateralToken: '0x4FC9b63D8F9625d048c890d67FA64C33443F8bc8' as `0x${string}`,
    collateralSymbol: 'WETH',
    collateralDecimals: 18,
    apy: '5.00',
    ltv: '80',
  },
  {
    id: 'dai-wbtc',
    loanToken: '0x02D33F3D69A26350277A3CE934F61daDB72A400C' as `0x${string}`,
    loanSymbol: 'DAI',
    loanDecimals: 18,
    collateralToken: '0x9A8A5686E94dC48E6a1823DdE4eCdBdbD19ea8fA' as `0x${string}`,
    collateralSymbol: 'WBTC',
    collateralDecimals: 8,
    apy: '4.50',
    ltv: '75',
  },
];

type Tab = 'deposit' | 'borrow' | 'repay' | 'withdraw';

interface Transaction {
  hash: string;
  type: Tab;
  market: string;
  amount: string;
  timestamp: Date;
}

export default function Home() {
  const { isConnected, address } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState<typeof MARKETS[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('deposit');
  const [amount, setAmount] = useState('');
  const [collateral, setCollateral] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [sessionTxs, setSessionTxs] = useState<Transaction[]>([]);

  const deposit = useDeposit();
  const borrow = useBorrow();
  const repay = useRepay();
  const withdraw = useWithdraw();
  
  // Fetch blockchain history with refetch capability
  const { transactions: historyTxs, loading: historyLoading, refetch: refetchHistory } = useTransactionHistory(address);

  // Auto-remove session transactions that are now in blockchain history (deduplicate)
  useEffect(() => {
    if (historyTxs.length > 0 && sessionTxs.length > 0) {
      const confirmedHashes = new Set(historyTxs.map(tx => tx.hash.toLowerCase()));
      setSessionTxs(prev => prev.filter(tx => !confirmedHashes.has(tx.hash.toLowerCase())));
    }
  }, [historyTxs]);

  const openModal = (market: typeof MARKETS[0]) => {
    setSelectedMarket(market);
    setModalOpen(true);
    setAmount('');
    setCollateral('');
    setTxStatus('idle');
    setTxHash('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMarket(null);
  };

  const addTransaction = (hash: string, type: Tab, market: string, amount: string) => {
    setSessionTxs(prev => [{
      hash,
      type,
      market,
      amount,
      timestamp: new Date(),
    }, ...prev]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarket || !amount) return;

    setTxStatus('pending');

    try {
      let hash: `0x${string}` | undefined;
      const marketName = `${selectedMarket.loanSymbol}/${selectedMarket.collateralSymbol}`;

      if (tab === 'deposit') {
        hash = await deposit.execute({
          loanToken: selectedMarket.loanToken,
          collateralToken: selectedMarket.collateralToken,
          amount,
          decimals: selectedMarket.loanDecimals,
        });
      } else if (tab === 'borrow') {
        hash = await borrow.execute({
          loanToken: selectedMarket.loanToken,
          collateralToken: selectedMarket.collateralToken,
          borrowAmount: amount,
          collateralAmount: collateral || '0',
          loanDecimals: selectedMarket.loanDecimals,
          collateralDecimals: selectedMarket.collateralDecimals,
        });
      } else if (tab === 'repay') {
        hash = await repay.execute({
          loanToken: selectedMarket.loanToken,
          collateralToken: selectedMarket.collateralToken,
          amount,
          decimals: selectedMarket.loanDecimals,
        });
      } else if (tab === 'withdraw') {
        hash = await withdraw.execute({
          loanToken: selectedMarket.loanToken,
          collateralToken: selectedMarket.collateralToken,
          shares: amount,
          decimals: selectedMarket.loanDecimals,
        });
      }

      if (hash) {
        setTxHash(hash);
        setTxStatus('success');
        addTransaction(hash, tab, marketName, `${amount} ${selectedMarket.loanSymbol}`);
        setAmount('');
        setCollateral('');
        // Auto-refresh blockchain history after successful transaction
        refetchHistory();
      }
    } catch (err) {
      console.error(err);
      setTxStatus('error');
    }
  };

  const isLoading = deposit.isLoading || borrow.isLoading || repay.isLoading || withdraw.isLoading;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeColor = (type: Tab) => {
    switch (type) {
      case 'deposit': return 'text-emerald-500';
      case 'borrow': return 'text-blue-500';
      case 'repay': return 'text-orange-500';
      case 'withdraw': return 'text-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-emerald-500 glow-emerald-text">PBA</span>
            <span className="text-white">Lend</span>
          </h1>
          <ConnectButton />
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
            DeFi Lending Protocol
          </h2>
          <p className="text-neutral-500 text-lg">
            Deposit assets to earn yield. Borrow against collateral.
          </p>
        </div>
      </section>

      {/* Markets */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-6">
          Markets
        </h3>

        <div className="space-y-4">
          {MARKETS.map((market) => (
            <div
              key={market.id}
              onClick={() => openModal(market)}
              className="card rounded-xl p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-black glow-emerald-soft">
                      {market.loanSymbol}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-neutral-700">
                      {market.collateralSymbol}
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {market.loanSymbol} / {market.collateralSymbol}
                    </p>
                    <p className="text-neutral-600 text-sm">Lending Pool</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-neutral-600 text-xs uppercase">APY</p>
                    <p className="text-emerald-500 font-bold text-lg">+{market.apy}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-600 text-xs uppercase">LTV</p>
                    <p className="text-white font-bold text-lg">{market.ltv}%</p>
                  </div>
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      {isConnected && (
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-widest">
              Transaction History
              {historyLoading && <span className="ml-2 text-emerald-500 animate-pulse">Loading...</span>}
            </h3>
            <button
              onClick={() => refetchHistory()}
              disabled={historyLoading}
              className="text-sm text-neutral-400 hover:text-emerald-400 flex items-center gap-1 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="card rounded-xl overflow-hidden">
            {historyTxs.length === 0 && sessionTxs.length === 0 && !historyLoading ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-neutral-500">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b border-neutral-800">
                      <th className="px-4 py-3 font-medium">Txn Hash</th>
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium">To</th>
                      <th className="px-4 py-3 font-medium">Value</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {/* Session Transactions - Recent transactions from this session */}
                    {sessionTxs.map((tx, idx) => (
                      <tr key={`session-${idx}`} className="hover:bg-neutral-900/50 transition-colors bg-emerald-500/5 border-l-2 border-l-emerald-500">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">NEW</span>
                            <span className="text-white font-mono text-xs">
                              {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' :
                            tx.type === 'borrow' ? 'bg-orange-500/20 text-orange-400' :
                            tx.type === 'repay' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-400 text-xs">
                          {tx.market}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {tx.amount}
                        </td>
                        <td className="px-4 py-3 text-neutral-400">
                          {tx.timestamp.toLocaleDateString('id-ID')} {formatTime(tx.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-yellow-500 flex items-center gap-1">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Confirming
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Blockchain History - Confirmed transactions */}
                    {historyTxs.map((tx, idx) => (
                      <tr key={`history-${idx}`} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-white font-mono text-xs">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' :
                            tx.type === 'approve' ? 'bg-purple-500/20 text-purple-400' :
                            tx.type === 'deploy' ? 'bg-blue-500/20 text-blue-400' :
                            tx.type === 'create_market' ? 'bg-cyan-500/20 text-cyan-400' :
                            tx.type === 'borrow' ? 'bg-orange-500/20 text-orange-400' :
                            tx.type === 'repay' ? 'bg-blue-500/20 text-blue-400' :
                            tx.type === 'withdraw' ? 'bg-red-500/20 text-red-400' :
                            'bg-neutral-500/20 text-neutral-400'
                          }`}>
                            {tx.method || tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-400 text-xs">
                          {tx.to === 'Contract Creation' ? (
                            <span className="text-blue-400">Contract Creation</span>
                          ) : (
                            `${tx.to.slice(0, 8)}...${tx.to.slice(-6)}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {tx.value !== '0' ? `${(parseInt(tx.value) / 1e18).toFixed(6)} ETH` : '0 ETH'}
                        </td>
                        <td className="px-4 py-3 text-neutral-400">
                          {new Date(tx.timestamp).toLocaleDateString('id-ID')} {new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          {tx.status === 'success' ? (
                            <span className="text-emerald-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Success
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Positions */}
      {isConnected && (
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-6">
            Your Positions
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-white font-semibold">Lend Positions</span>
              </div>
              <div className="bg-neutral-900/50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-500 text-sm">USDC / WETH</span>
                  <span className="text-emerald-500 text-sm font-medium">+5.00%</span>
                </div>
                <p className="text-white font-mono text-lg">1,000.00 USDC</p>
              </div>
            </div>

            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <span className="text-white font-semibold">Borrow Positions</span>
              </div>
              <div className="bg-neutral-900/50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-neutral-500 text-sm">DAI / WBTC</span>
                  <span className="text-red-500 text-sm font-medium">-4.50%</span>
                </div>
                <p className="text-white font-mono text-lg">500.00 DAI</p>
                <p className="text-neutral-500 text-sm mt-1">Collateral: 0.02 WBTC</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal */}
      {modalOpen && selectedMarket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop absolute inset-0" onClick={closeModal} />
          
          <div className="relative bg-black border border-neutral-800 rounded-2xl w-full max-w-md glow-emerald">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-900">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-black">
                    {selectedMarket.loanSymbol}
                  </div>
                  <span className="text-white font-bold text-lg">
                    {selectedMarket.loanSymbol} / {selectedMarket.collateralSymbol}
                  </span>
                </div>
                <button onClick={closeModal} className="text-neutral-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg">
                {(['deposit', 'borrow', 'repay', 'withdraw'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setTxStatus('idle'); }}
                    className={`flex-1 py-2 text-sm rounded-md capitalize transition-all ${
                      tab === t ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Amount Input */}
              <div>
                <label className="block text-sm text-neutral-500 mb-2">
                  {tab === 'withdraw' ? 'Shares' : 'Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-dark w-full rounded-lg px-4 py-3 text-lg font-mono pr-20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                    {selectedMarket.loanSymbol}
                  </span>
                </div>
              </div>

              {/* Collateral Input (Borrow only) */}
              {tab === 'borrow' && (
                <div>
                  <label className="block text-sm text-neutral-500 mb-2">Collateral</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={collateral}
                      onChange={(e) => setCollateral(e.target.value)}
                      placeholder="0.00"
                      className="input-dark w-full rounded-lg px-4 py-3 text-lg font-mono pr-20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                      {selectedMarket.collateralSymbol}
                    </span>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {txStatus === 'success' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-500 font-medium text-sm">Transaction successful!</p>
                  {txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 text-xs underline mt-1 block"
                    >
                      View on Etherscan →
                    </a>
                  )}
                </div>
              )}

              {txStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-500 font-medium text-sm">Transaction failed. Please try again.</p>
                </div>
              )}

              {/* Submit Button */}
              {!isConnected ? (
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !amount || txStatus === 'pending'}
                  className="btn-primary w-full py-4 rounded-lg text-lg capitalize"
                >
                  {isLoading || txStatus === 'pending' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    tab
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
