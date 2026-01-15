'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { PBA_LEND_ADDRESS, PBA_LEND_ABI } from '@/config/contracts';

type Step = 'idle' | 'withdrawing' | 'success' | 'error';

interface UseWithdrawParams {
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  shares: string;
  decimals: number;
}

export function useWithdraw() {
  const { address } = useAccount();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync: withdraw } = useWriteContract();

  const execute = async ({ loanToken, collateralToken, shares, decimals }: UseWithdrawParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('idle');
      setError(null);

      const sharesWei = parseUnits(shares, decimals);

      // Withdraw deposited tokens (no approval needed - withdrawing from contract)
      setStep('withdrawing');
      const withdrawHash = await withdraw({
        address: PBA_LEND_ADDRESS,
        abi: PBA_LEND_ABI,
        functionName: 'withdraw',
        args: [loanToken, collateralToken, sharesWei],
      });
      console.log('Withdraw tx:', withdrawHash);

      setStep('success');
      return withdrawHash;
    } catch (err: any) {
      setStep('error');
      setError(err.message || 'Transaction failed');
      console.error('Withdraw error:', err);
    }
  };

  return {
    execute,
    step,
    error,
    isLoading: step === 'withdrawing',
    isSuccess: step === 'success',
  };
}
