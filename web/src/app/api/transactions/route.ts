import { NextRequest, NextResponse } from 'next/server';
import { toFunctionSelector } from 'viem';

// Function signatures to monitor
const SIGNATURES = {
  'deposit(address,address,uint256)': 'Deposit',
  'borrow(address,address,uint256,uint256)': 'Borrow',
  'repay(address,address,uint256)': 'Repay',
  'withdraw(address,address,uint256)': 'Withdraw',
  'createMarket(address,address,uint256,uint256,address)': 'Create Market',
  'mint(address,uint256)': 'Mint',
  'approve(address,uint256)': 'Approve',
  'transfer(address,uint256)': 'Transfer'
};

// Pre-calculate selectors
const SELECTORS = Object.entries(SIGNATURES).reduce((acc, [sig, name]) => {
  acc[toFunctionSelector(sig)] = name;
  return acc;
}, {} as Record<string, string>);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    // Use Etherscan-compatible API from Blockscout (more reliable)
    const response = await fetch(
      `https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=${address}&page=1&offset=30&sort=desc`,
      { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('[API] Blockscout response status:', data.status, 'message:', data.message);
      
      if (data.status === '1' && data.result && Array.isArray(data.result)) {
        const transactions = data.result.map((tx: any) => {
          let type = 'other';
          
          // Decode method from input data
          let method = 'Transfer'; // Default
          if (tx.input && tx.input.length >= 10) {
            const selector = tx.input.slice(0, 10);
            if (SELECTORS[selector]) {
              method = SELECTORS[selector];
            } else if (tx.functionName) {
              method = tx.functionName.split('(')[0];
            }
          } else if (tx.functionName) {
            method = tx.functionName.split('(')[0];
          }

          const methodLower = method.toLowerCase();
          if (tx.to === '' || tx.to === null) {
            type = 'deploy';
            method = 'Contract Creation';
          } else if (methodLower.includes('deposit')) {
            type = 'deposit';
          } else if (methodLower.includes('borrow')) {
            type = 'borrow';
          } else if (methodLower.includes('repay')) {
            type = 'repay';
          } else if (methodLower.includes('withdraw')) {
            type = 'withdraw';
          } else if (methodLower.includes('approve')) {
            type = 'approve';
          } else if (methodLower.includes('mint')) {
            type = 'transfer'; // Mints often show as transfers in some UIs, but here we want 'Mint' type if possible, or keep logic consistent
            // Actually, if method is 'Mint', type should be 'other' or specific? 
            // The frontend uses 'type' for icon. Let's map 'mint' to 'transfer' (green incoming) or leave 'other'.
            // HistoryTransaction type union: 'deposit' | 'borrow' | 'repay' | 'withdraw' | 'approve' | 'create_market' | 'deploy' | 'transfer' | 'other'
            // Let's treat Mint as 'transfer' for now or add 'mint' to type definition?
            // Existing types don't have 'mint'. 'other' uses default icon.
            // Let's use 'transfer' for Mint for now as it receives tokens.
          } else if (methodLower.includes('create market')) {
            type = 'create_market';
          }
          
          return {
            hash: tx.hash,
            type,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
            status: tx.isError === '0' ? 'success' : 'failed',
            to: tx.to || 'Contract Creation',
            from: tx.from || '',
            value: tx.value || '0',
            method,
            block: tx.blockNumber || '',
          };
        });
        
        console.log('[API] Found', transactions.length, 'transactions');
        return NextResponse.json({ transactions });
      }
      
      // No transactions or API error
      console.log('[API] No transactions found or API error');
      return NextResponse.json({ transactions: [], message: data.message || 'No transactions' });
    }

    // Fallback: return empty if API fails
    console.log('[API] Response not ok:', response.status);
    return NextResponse.json({ transactions: [], error: 'API failed' });
    
  } catch (error) {
    console.error('[API] Transaction fetch error:', error);
    return NextResponse.json({ transactions: [], error: 'Fetch failed' }, { status: 500 });
  }
}

