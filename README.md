# PBALend - Educational Lending Protocol 📚

A comprehensive smart contract implementation designed to teach fundamental Solidity concepts through a real-world lending protocol example with dual-token markets and oracle integration.

## 🎯 Learning Objectives

This project covers all essential Solidity fundamentals:

### Core Solidity Concepts Demonstrated

1. **Contract Structure & Organization**
   - Clear separation of concerns with organized sections
   - Professional commenting and documentation
   - Import statements and dependencies
   - Inheritance from OpenZeppelin contracts

2. **Data Types & Storage**
   - `struct` - Custom data types (MarketData, UserData)
   - `mapping` - Key-value storage for user accounts and markets
   - `bytes32` - Market key generation using keccak256
   - State variables with proper visibility

3. **Functions & Modifiers**
   - `external`, `internal`, `public`, `view` functions
   - Custom modifiers for access control and validation
   - Function parameters and return values
   - Pausable functionality

4. **Access Control**
   - Owner-only functions using `onlyOwner` modifier
   - User-specific data access patterns
   - Market existence validation

5. **Error Handling**
   - Custom errors (gas-efficient)
   - `revert` statements with meaningful error messages
   - Input validation patterns

6. **Events**
   - Event emission for transaction logging
   - `indexed` parameters for efficient filtering
   - Frontend integration considerations

7. **Mathematical Operations**
   - Interest rate calculations with time-based accrual
   - Share-based accounting system
   - Collateral ratio computations with oracle prices
   - Percentage calculations (100e16 = 100%)

8. **ERC20 Integration**
   - Interface usage with `IERC20` and `IERC20Metadata`
   - Safe token transfers
   - Approval patterns

9. **Security Patterns**
   - Checks-Effects-Interactions pattern
   - Input validation
   - Overflow protection (Solidity 0.8+)
   - Oracle price integration for collateral valuation

## 🏗️ Contract Architecture

### Core Components

#### 1. Market Structure
```solidity
struct MarketData {
    address loanToken;         // The ERC20 token that can be borrowed
    address collateralToken;   // The ERC20 token used as collateral
    bool isActive;             // Market status
    uint256 interestRate;      // Annual interest rate (100e16 = 100%)
    uint256 LTV;               // Loan-to-Value ratio (100e16 = 100%)
    address oracle;            // Price oracle for collateral valuation
    uint256 totalDepositShares; // Total deposit shares outstanding
    uint256 totalDepositAssets; // Total deposit assets
    uint256 totalBorrowShares;  // Total borrow shares outstanding
    uint256 totalBorrowAssets;  // Total borrow assets
    uint256 lastAccrueTime;     // Last interest accrual timestamp
}
```

#### 2. User Account Tracking
```solidity
struct UserData {
    uint256 depositShares;     // User's deposit shares
    uint256 borrowShares;      // User's borrow shares
    uint256 collateralAssets;  // User's collateral amount
}
```

### Key Functions

#### Administrative Functions
- `createMarket()` - Create new dual-token lending markets with oracle integration
- `setMarketStatus()` - Pause/unpause markets
- `pause()` / `unpause()` - Global pause functionality

#### User Functions
- `deposit()` - Deposit loan tokens to earn interest (share-based accounting)
- `depositCollateral()` - Deposit collateral tokens for borrowing
- `borrow()` - Borrow loan tokens against collateral (with health checks)
- `repay()` - Repay borrowed amounts using shares
- `withdraw()` - Withdraw deposited loan tokens (share-based)
- `withdrawCollateral()` - Withdraw collateral tokens (with health checks)
- `flashLoan()` - Execute uncollateralized flash loans

#### View Functions
- `getMarketData()` - Get complete market information
- `getUserData()` - Get user's position in a market
- `marketDatas()` - Public mapping access for market data
- `userDatas()` - Public mapping access for user data

#### Internal Functions
- `_accrueInterest()` - Time-based interest accrual
- `_isHealthy()` - Collateral health check with oracle prices
- `_getMarketKey()` - Generate unique market identifier

## 🚀 Usage Examples

### 1. Deploy and Setup
```solidity
// Deploy the contract
PBALend lendingProtocol = new PBALend();

// Create a market for USDC loans with ETH collateral
// 5% annual interest and 80% LTV ratio
lendingProtocol.createMarket(
    0xA0b86a33E6417c73f3fD7e659F64F91E8b8Bf2f2, // USDC (loan token)
    0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // WETH (collateral token)
    5e16,  // 5% annual interest (5e16 = 5%)
    80e16, // 80% LTV ratio (80e16 = 80%)
    0x1234... // Oracle address for ETH price
);
```

### 2. User Interactions

#### Depositing Loan Tokens (Lending)
```solidity
// User approves and deposits USDC to earn interest
IERC20(usdcAddress).approve(address(lendingProtocol), 1000 * 1e6);
lendingProtocol.deposit(usdcAddress, wethAddress, 1000 * 1e6);
```

#### Depositing Collateral
```solidity
// User deposits ETH as collateral for borrowing
IERC20(wethAddress).approve(address(lendingProtocol), 1 * 1e18);
lendingProtocol.depositCollateral(usdcAddress, wethAddress, 1 * 1e18);
```

#### Borrowing Against Collateral
```solidity
// User borrows USDC against their ETH collateral
// Health check ensures they don't exceed LTV ratio
lendingProtocol.borrow(usdcAddress, wethAddress, 500 * 1e6);
```

#### Repaying Loans
```solidity
// User repays their loan using shares
UserData memory userData = lendingProtocol.getUserData(msg.sender, usdcAddress, wethAddress);
IERC20(usdcAddress).approve(address(lendingProtocol), repayAmount);
lendingProtocol.repay(usdcAddress, wethAddress, userData.borrowShares);
```

#### Flash Loans
```solidity
// Execute a flash loan for arbitrage or liquidation
lendingProtocol.flashLoan(
    usdcAddress,
    10000 * 1e6,
    abi.encodeWithSignature("executeArbitrage()")
);
```

## 🧪 Testing

The project includes comprehensive tests demonstrating:

- Dual-token market creation and management
- Share-based deposit and withdrawal functionality
- Collateral deposit and borrowing with health checks
- Share-based repayment mechanics
- Flash loan functionality
- Oracle price integration
- Error conditions and edge cases
- View function accuracy

### Run Tests
```bash
forge test -v
```

### Test Coverage
- ✅ Dual-token market creation and validation
- ✅ Share-based deposit functionality
- ✅ Collateral deposit and management
- ✅ Borrowing with oracle-based health checks
- ✅ Share-based repayment processing
- ✅ Collateral withdrawal with health validation
- ✅ Time-based interest accrual calculations
- ✅ Flash loan execution
- ✅ Error conditions and edge cases
- ✅ View function accuracy

## 💡 Educational Features

### 1. Documentation Standards
- Comprehensive NatSpec comments
- Clear function descriptions with section organization
- Parameter explanations and return value documentation
- Professional code structure with clear separators

### 2. Code Organization
- Logical section separation with clear headers
- Consistent naming conventions
- Clear variable declarations and struct definitions
- Professional inheritance from OpenZeppelin contracts

### 3. Security Considerations
- Input validation on all user functions
- Access control for administrative functions
- Proper error handling with custom errors
- Safe arithmetic operations
- Oracle price validation for collateral health
- Pausable functionality for emergency stops

### 4. Gas Optimization
- Custom errors instead of string messages
- Efficient storage patterns with bytes32 keys
- Minimal external calls
- Share-based accounting to reduce precision loss

## 🔧 Technical Specifications

### Interest Rate Model
- Time-based interest accrual: `Interest = Principal × Rate × Time / (365 days × 100e16)`
- Rates specified as percentages (100e16 = 100%)
- Interest accrues continuously and is added to both deposit and borrow pools
- Share-based accounting maintains proportional ownership

### Collateral System
- Over-collateralized loans with configurable LTV ratios
- Oracle-based price feeds for collateral valuation
- Real-time health checks using `_isHealthy()` function
- Automatic prevention of under-collateralized positions

### Share-Based Accounting
- Deposit shares represent proportional ownership of the deposit pool
- Borrow shares represent proportional debt in the borrow pool
- Shares maintain precision and handle interest accrual automatically
- First depositor/borrower receives 1:1 share-to-asset ratio

### Market Key System
- Unique market identification using `keccak256(abi.encodePacked(loanToken, collateralToken))`
- Enables multiple markets with same tokens but different configurations
- Efficient storage and lookup patterns

### Precision & Units
- Uses token-specific decimal places (ERC20Metadata integration)
- Percentage calculations (100e16 = 100%)
- Time measured in seconds since Unix epoch
- Oracle price integration for cross-token collateral valuation

## 🎓 Learning Path

### Beginner Level
1. Understand the contract structure and organization
2. Learn about structs, mappings, and bytes32 keys
3. Study the modifier patterns and access control
4. Explore event emission and indexing

### Intermediate Level
1. Analyze the share-based accounting system
2. Understand dual-token market mechanics
3. Study the oracle integration and health checks
4. Learn about ERC20 and ERC20Metadata integration

### Advanced Level
1. Explore gas optimization techniques with custom errors
2. Understand the mathematical models for interest accrual
3. Study the flash loan implementation
4. Learn about market key generation and storage patterns

## 🔮 Extension Ideas

Students can enhance this protocol by adding:

1. **Liquidation Mechanism** - Automatically liquidate under-collateralized positions
2. **Dynamic Interest Rates** - Adjust rates based on utilization and market conditions
3. **Multi-Oracle Support** - Support for multiple price feeds with fallback mechanisms
4. **Governance Token** - Allow token holders to vote on market parameters
5. **Liquidity Mining** - Reward users for providing liquidity to markets
6. **Cross-Market Borrowing** - Allow borrowing against collateral from different markets
7. **Interest Rate Models** - Implement more sophisticated interest rate curves
8. **Liquidation Penalties** - Add penalties for liquidated positions
9. **Market Risk Parameters** - Dynamic LTV adjustments based on volatility
10. **Integration with DEXs** - Direct integration with decentralized exchanges

## 📚 Additional Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/)
- [Foundry Book](https://book.getfoundry.sh/)
- [DeFi Developer Roadmap](https://github.com/OffcierCia/DeFi-Developer-Road-Map)
- [Pyth Network Documentation](https://docs.pyth.network/)
- [Share-Based Accounting Patterns](https://docs.compound.finance/v2/)

## 🔍 Key Features Highlighted

### Dual-Token Markets
- Separate loan and collateral tokens for each market
- Flexible market creation with different token pairs
- Oracle integration for cross-token price feeds

### Share-Based Accounting
- Proportional ownership through shares
- Automatic interest distribution
- Precision maintenance through share calculations

### Oracle Integration
- Real-time price feeds for collateral valuation
- Health check system with LTV enforcement
- Support for different token decimals

### Flash Loans
- Uncollateralized loans for arbitrage and liquidation
- Same-transaction repayment requirement
- Integration with external protocols

---

*This contract is designed for educational purposes. For production use, additional security audits, liquidation mechanisms, and advanced features would be required.*