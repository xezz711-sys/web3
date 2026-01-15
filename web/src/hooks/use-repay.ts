'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { PBA_LEND_ADDRESS, PBA_LEND_ABI, ERC20_ABI } from '@/config/contracts';

type Step = 'idle' | 'approving' | 'repaying' | 'success' | 'error';

interface UseRepayParams {
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  amount: string;
  decimals: number;
}

export function useRepay() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: repay } = useWriteContract();

  const execute = async ({ loanToken, collateralToken, amount, decimals }: UseRepayParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('idle');
      setError(null);

      const amountWei = parseUnits(amount, decimals);

      // Step 1: Approve loan token for repayment
      setStep('approving');
      const approveHash = await approve({
        address: loanToken,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PBA_LEND_ADDRESS, amountWei],
      });
      console.log('Approve repay tx:', approveHash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // Step 2: Repay loan
      setStep('repaying');
      const repayHash = await repay({
        address: PBA_LEND_ADDRESS,
        abi: PBA_LEND_ABI,
        functionName: 'repay',
        args: [loanToken, collateralToken, amountWei],
      });
      console.log('Repay tx:', repayHash);

      setStep('success');
      return repayHash;
    } catch (err: any) {
      setStep('error');
      setError(err.message || 'Transaction failed');
      console.error('Repay error:', err);
      throw err;
    }
  };

  return {
    execute,
    step,
    error,
    isLoading: step === 'approving' || step === 'repaying',
    isSuccess: step === 'success',
  };
}
