// Contract address - DEPLOYED ON SEPOLIA
export const PBA_LEND_ADDRESS = '0x328F98201Eb9cAe1b63e2103D64582025cfa4980' as const;

// GraphQL endpoint for Ponder indexer
export const GRAPHQL_ENDPOINT = 'http://localhost:42069/graphql';

// Chain configuration
export const CHAIN_ID = 11155111; // Sepolia

// Contract ABI
export const PBA_LEND_ABI = [
  {
    type: 'function',
    name: 'createMarket',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'interestRate', type: 'uint256' },
      { name: 'LTV', type: 'uint256' },
      { name: 'oracle', type: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'borrow',
    inputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'collateralAmount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'repay',
    inputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'shares', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'withdrawCollateral',
    inputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'getMarketData',
    inputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' }
    ],
    outputs: [
      {
        name: '',
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
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserData',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'depositShares', type: 'uint256' },
          { name: 'borrowShares', type: 'uint256' },
          { name: 'collateralAssets', type: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'MarketCreated',
    inputs: [
      { name: 'loanToken', type: 'address', indexed: true },
      { name: 'collateralToken', type: 'address', indexed: true },
      { name: 'interestRate', type: 'uint256', indexed: false },
      { name: 'LTV', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Deposit',
    inputs: [
      { name: 'loanToken', type: 'address', indexed: true },
      { name: 'collateralToken', type: 'address', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Borrow',
    inputs: [
      { name: 'loanToken', type: 'address', indexed: true },
      { name: 'collateralToken', type: 'address', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false },
      { name: 'collateralAmount', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Repay',
    inputs: [
      { name: 'loanToken', type: 'address', indexed: true },
      { name: 'collateralToken', type: 'address', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'shares', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Withdraw',
    inputs: [
      { name: 'loanToken', type: 'address', indexed: true },
      { name: 'collateralToken', type: 'address', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'WithdrawCollateral',
    inputs: [
      { name: 'loanToken', type: 'address', indexed: true },
      { name: 'collateralToken', type: 'address', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
] as const;

// ERC20 ABI for approve and allowance
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  }
] as const;
