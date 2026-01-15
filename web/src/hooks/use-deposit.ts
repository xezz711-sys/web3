'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { PBA_LEND_ADDRESS, PBA_LEND_ABI, ERC20_ABI } from '@/config/contracts';

type Step = 'idle' | 'approving' | 'depositing' | 'success' | 'error';

interface UseDepositParams {
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  amount: string;
  decimals: number;
}

export function useDeposit() {
  const { address } = useAccount();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: deposit } = useWriteContract();

  const execute = async ({ loanToken, collateralToken, amount, decimals }: UseDepositParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('idle');
      setError(null);
      
      const amountWei = parseUnits(amount, decimals);

      // Step 1: Approve ERC20 token
      setStep('approving');
      const approveHash = await approve({
        address: loanToken,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PBA_LEND_ADDRESS, amountWei],
      });
      console.log('Approve tx:', approveHash);

      // Step 2: Deposit to lending pool
      setStep('depositing');
      const depositHash = await deposit({
        address: PBA_LEND_ADDRESS,
        abi: PBA_LEND_ABI,
        functionName: 'deposit',
        args: [loanToken, collateralToken, amountWei],
      });
      console.log('Deposit tx:', depositHash);

      setStep('success');
      return depositHash;
    } catch (err: any) {
      setStep('error');
      setError(err.message || 'Transaction failed');
      console.error('Deposit error:', err);
    }
  };

  return {
    execute,
    step,
    error,
    isLoading: step === 'approving' || step === 'depositing',
    isSuccess: step === 'success',
  };
}
