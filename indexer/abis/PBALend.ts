export const PBALendAbi = [
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
