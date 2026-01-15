'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HistoryTransaction {
  hash: string;
  type: 'deposit' | 'borrow' | 'repay' | 'withdraw' | 'approve' | 'create_market' | 'deploy' | 'transfer' | 'other';
  timestamp: string;
  status: 'success' | 'failed';
  to: string;
  from: string;
  value: string;
  method: string;
  block: string;
}

export function useTransactionHistory(address: string | undefined) {
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!address) {
      console.log('[Transaction History] No address provided, skipping fetch');
      setTransactions([]);
      return;
    }

    console.log('[Transaction History] Fetching for address:', address);
    setLoading(true);
    try {
      // Use our internal API route to avoid CORS
      const response = await fetch(`/api/transactions?address=${address}`);
      const data = await response.json();
      console.log('[Transaction History] API Response:', data);
      
      if (data.transactions && Array.isArray(data.transactions)) {
        console.log('[Transaction History] Found', data.transactions.length, 'transactions');
        setTransactions(data.transactions);
      } else {
        console.log('[Transaction History] No transactions in response');
      }
    } catch (error) {
      console.error('[Transaction History] Error fetching:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    // Delay to allow blockchain to index the transaction
    setTimeout(() => {
      fetchHistory();
    }, 3000);
  }, [fetchHistory]);

  return { transactions, loading, refetch };
}
