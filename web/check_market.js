// Script to check contract owner and market status
const { createPublicClient, http } = require('viem');
const { sepolia } = require('viem/chains');

const PBA_LEND_ADDRESS = '0x328F98201Eb9cAe1b63e2103D64582025cfa4980';

// Token addresses from frontend
const USDC = '0x55E071C211fA197CFF0633b19B0270C8dfaD8761';
const WETH = '0x4FC9b63D8F9625d048c890d67FA64C33443F8bc8';

const abi = [
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getMarketData',
    inputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' }
    ],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'isActive', type: 'bool' },
        { name: 'interestRate', type: 'uint256' },
        { name: 'LTV', type: 'uint256' },
        { name: 'oracle', type: 'address' },
        { name: 'totalDepositShares', type: 'uint256' },
        { name: 'totalDepositAssets', type: 'uint256' },
        { name: 'totalBorrowShares', type: 'uint256' },
        { name: 'totalBorrowAssets', type: 'uint256' },
        { name: 'lastAccrueTime', type: 'uint256' }
      ]
    }],
    stateMutability: 'view'
  }
];

async function main() {
  // Using Ankr's free Sepolia RPC
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://rpc.ankr.com/eth_sepolia'),
  });

  // Check owner
  console.log('Checking contract owner...');
  try {
    const owner = await publicClient.readContract({
      address: PBA_LEND_ADDRESS,
      abi,
      functionName: 'owner',
    });
    console.log('Contract owner:', owner);
    console.log('Your wallet: 0x099F9845262efe02Db42472992dbE5dA3a952B7d');
    console.log('Is owner?', owner.toLowerCase() === '0x099F9845262efe02Db42472992dbE5dA3a952B7d'.toLowerCase());
  } catch (e) {
    console.log('Error getting owner:', e.shortMessage || e.message);
  }

  // Check if USDC/WETH market exists
  console.log('\nChecking USDC/WETH market...');
  try {
    const marketData = await publicClient.readContract({
      address: PBA_LEND_ADDRESS,
      abi,
      functionName: 'getMarketData',
      args: [USDC, WETH],
    });
    console.log('Market isActive:', marketData.isActive);
    console.log('Market oracle:', marketData.oracle);
    console.log('Total Deposit Assets:', marketData.totalDepositAssets.toString());
    console.log('Total Borrow Assets:', marketData.totalBorrowAssets.toString());
  } catch (e) {
    console.log('Error checking market:', e.shortMessage || e.message);
  }
}

main().catch(console.error);
