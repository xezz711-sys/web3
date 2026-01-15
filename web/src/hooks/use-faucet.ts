import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

// ABI for mint function
const MINT_ABI = [
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      { "name": "to", "type": "address", "internalType": "address" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

export function useFaucet() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mint = async (tokenAddress: `0x${string}`, toAddress: `0x${string}`, amount: string, decimals: number = 18) => {
    writeContract({
      address: tokenAddress,
      abi: MINT_ABI,
      functionName: 'mint',
      args: [toAddress, parseUnits(amount, decimals)],
    });
  };

  return {
    mint,
    hash,
    isLoading: isPending || isConfirming,
    isSuccess,
    error
  };
}
