import { toFunctionSelector } from 'viem';

const sigs = [
  'deposit(address,address,uint256)',
  'borrow(address,address,uint256,uint256)',
  'repay(address,address,uint256)',
  'withdraw(address,address,uint256)',
  'createMarket(address,address,uint256,uint256,address)',
  'mint(address,uint256)',
  'approve(address,uint256)',
  'transfer(address,uint256)'
];

sigs.forEach(sig => {
  console.log(`${sig}: ${toFunctionSelector(sig)}`);
});
