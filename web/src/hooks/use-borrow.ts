'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { PBA_LEND_ADDRESS, PBA_LEND_ABI, ERC20_ABI } from '@/config/contracts';

type Step = 'idle' | 'approving' | 'borrowing' | 'success' | 'error';

interface UseBorrowParams {
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  borrowAmount: string;
  collateralAmount: string;
  loanDecimals: number;
  collateralDecimals: number;
}

export function useBorrow() {
  const { address } = useAccount();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: borrow } = useWriteContract();

  const execute = async ({
    loanToken,
    collateralToken,
    borrowAmount,
    collateralAmount,
    loanDecimals,
    collateralDecimals,
  }: UseBorrowParams) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setStep('idle');
      setError(null);

      const borrowAmountWei = parseUnits(borrowAmount, loanDecimals);
      const collateralAmountWei = parseUnits(collateralAmount, collateralDecimals);

      // Step 1: Approve collateral token
      setStep('approving');
      const approveHash = await approve({
        address: collateralToken,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PBA_LEND_ADDRESS, collateralAmountWei],
      });
      console.log('Approve collateral tx:', approveHash);

      // Step 2: Borrow from lending pool
      setStep('borrowing');
      const borrowHash = await borrow({
        address: PBA_LEND_ADDRESS,
        abi: PBA_LEND_ABI,
        functionName: 'borrow',
        args: [loanToken, collateralToken, borrowAmountWei, collateralAmountWei],
      });
      console.log('Borrow tx:', borrowHash);

      setStep('success');
      return borrowHash;
    } catch (err: any) {
      setStep('error');
      setError(err.message || 'Transaction failed');
      console.error('Borrow error:', err);
    }
  };

  return {
    execute,
    step,
    error,
    isLoading: step === 'approving' || step === 'borrowing',
    isSuccess: step === 'success',
  };
}
