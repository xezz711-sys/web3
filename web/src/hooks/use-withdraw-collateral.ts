'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { PBA_LEND_ADDRESS, PBA_LEND_ABI } from '@/config/contracts';

type Step = 'idle' | 'withdrawing' | 'success' | 'error';

interface UseWithdrawCollateralParams {
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  amount: string;
  decimals: number;
}

export function useWithdrawCollateral() {
  const { address } = useAccount();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync: withdrawCollateral } = useWriteContract();

  const execute = async ({ loanToken, collateralToken, amount, decimals }: UseWithdrawCollateralParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('idle');
      setError(null);

      const amountWei = parseUnits(amount, decimals);

      // Withdraw collateral (no approval needed - withdrawing from contract)
      setStep('withdrawing');
      const withdrawHash = await withdrawCollateral({
        address: PBA_LEND_ADDRESS,
        abi: PBA_LEND_ABI,
        functionName: 'withdrawCollateral',
        args: [loanToken, collateralToken, amountWei],
      });
      console.log('Withdraw collateral tx:', withdrawHash);

      setStep('success');
      return withdrawHash;
    } catch (err: any) {
      setStep('error');
      setError(err.message || 'Transaction failed');
      console.error('Withdraw collateral error:', err);
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
