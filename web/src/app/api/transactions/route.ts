import { NextRequest, NextResponse } from 'next/server';

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
          let method = tx.functionName ? tx.functionName.split('(')[0] : 'Transfer';
          
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
          } else if (methodLower.includes('createmarket')) {
            type = 'create_market';
            method = 'Create Market';
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

