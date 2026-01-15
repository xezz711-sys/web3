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
    loanDecimals: 18,
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
    collateralDecimals: 18,
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

// Pagination settings
const ITEMS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [historyTxs.length]);

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
    if (!selectedMarket || !amount || parseFloat(amount) <= 0) return;

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
        if (!collateral || parseFloat(collateral) <= 0) {
          setTxStatus('error');
          return;
        }
        hash = await borrow.execute({
          loanToken: selectedMarket.loanToken,
          collateralToken: selectedMarket.collateralToken,
          borrowAmount: amount,
          collateralAmount: collateral,
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

  // Pagination calculations
  const allTransactions = [...sessionTxs.map(tx => ({ ...tx, isSession: true })), ...historyTxs.map(tx => ({ ...tx, isSession: false }))];
  const totalPages = Math.ceil(allTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = allTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
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

      {/* Transaction History - Etherscan Style */}
      {isConnected && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">
                Transaction History
              </h3>
              {historyLoading && <span className="text-sm text-emerald-500 animate-pulse">Loading...</span>}
              {allTransactions.length > 0 && (
                <span className="text-sm text-neutral-500">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, allTransactions.length)} of {allTransactions.length} transactions
                </span>
              )}
            </div>
            <button
              onClick={() => refetchHistory()}
              disabled={historyLoading}
              className="text-sm text-neutral-400 hover:text-emerald-400 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-emerald-500 transition-all disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Etherscan-style Table */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
            {allTransactions.length === 0 && !historyLoading ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-neutral-500 text-lg">No transactions found</p>
                <p className="text-neutral-600 text-sm mt-1">Your transaction history will appear here</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-900/50 text-neutral-400 border-b border-neutral-800">
                        <th className="px-4 py-3 text-left font-medium">Txn Hash</th>
                        <th className="px-4 py-3 text-left font-medium">Method</th>
                        <th className="px-4 py-3 text-left font-medium">To</th>
                        <th className="px-4 py-3 text-left font-medium">Value</th>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((tx: any, idx) => (
                        <tr 
                          key={`tx-${idx}`} 
                          className={`border-b border-neutral-800/50 hover:bg-neutral-900/80 transition-colors ${tx.isSession ? 'bg-emerald-500/5' : ''}`}
                        >
                          {/* Transaction Hash */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {tx.isSession && (
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">NEW</span>
                              )}
                              <a 
                                href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 font-mono text-xs hover:underline"
                              >
                                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                              </a>
                            </div>
                          </td>

                          {/* Method */}
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded text-xs font-medium border ${
                              tx.type === 'deposit' || tx.method === 'Deposit' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              tx.type === 'approve' || tx.method === 'Approve' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                              tx.type === 'borrow' || tx.method === 'Borrow' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                              tx.type === 'repay' || tx.method === 'Repay' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                              tx.type === 'withdraw' || tx.method === 'Withdraw' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                              tx.method === 'Transfer' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                              tx.method === 'Contract Creation' ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' :
                              'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
                            }`}>
                              {tx.method || (tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : 'Unknown')}
                            </span>
                          </td>

                          {/* To Address */}
                          <td className="px-4 py-3.5">
                            {tx.to === 'Contract Creation' ? (
                              <span className="text-pink-400 text-xs font-medium">Contract Creation</span>
                            ) : tx.market ? (
                              <span className="text-neutral-300 text-xs">{tx.market}</span>
                            ) : (
                              <a 
                                href={`https://sepolia.etherscan.io/address/${tx.to}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 font-mono text-xs hover:underline"
                              >
                                {tx.to?.slice(0, 8)}...{tx.to?.slice(-6)}
                              </a>
                            )}
                          </td>

                          {/* Value */}
                          <td className="px-4 py-3.5">
                            <span className="text-white text-xs font-medium">
                              {tx.amount ? tx.amount : (tx.value !== '0' ? `${(parseInt(tx.value) / 1e18).toFixed(4)} ETH` : '0 ETH')}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5">
                            <span className="text-neutral-400 text-xs">
                              {tx.isSession ? (
                                `${tx.timestamp.toLocaleDateString('en-GB')} ${tx.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                              ) : (
                                `${new Date(tx.timestamp).toLocaleDateString('en-GB')} ${new Date(tx.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                              )}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {tx.isSession ? (
                              <span className="text-yellow-500 flex items-center gap-1.5 text-xs">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Pending
                              </span>
                            ) : tx.status === 'success' ? (
                              <span className="text-emerald-500 flex items-center gap-1.5 text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Success
                              </span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1.5 text-xs">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 bg-neutral-900/30 border-t border-neutral-800 flex items-center justify-between">
                    <div className="text-sm text-neutral-500">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* First */}
                      <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        First
                      </button>
                      
                      {/* Prev */}
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        ‹ Prev
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1 mx-2">
                        {getPageNumbers().map((page, idx) => (
                          typeof page === 'number' ? (
                            <button
                              key={idx}
                              onClick={() => goToPage(page)}
                              className={`w-8 h-8 text-xs rounded border transition-colors ${
                                currentPage === page 
                                  ? 'bg-emerald-500 border-emerald-500 text-black font-bold' 
                                  : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                              }`}
                            >
                              {page}
                            </button>
                          ) : (
                            <span key={idx} className="text-neutral-600 px-1">...</span>
                          )
                        ))}
                      </div>

                      {/* Next */}
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Next ›
                      </button>

                      {/* Last */}
                      <button
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs rounded border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}
              </>
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
