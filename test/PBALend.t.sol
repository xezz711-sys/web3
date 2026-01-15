// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {PBALend} from "../src/PBALend.sol";
import {MockToken} from "../src/MockToken.sol";
import {IPythOracle} from "../src/interfaces/IPythOracle.sol";

contract MockOracle is IPythOracle {
    uint256 private _price;
    
    constructor(uint256 initialPrice) {
        _price = initialPrice;
    }
    
    function getPrice() external view returns (uint256) {
        return _price;
    }
    
    function setPrice(uint256 newPrice) external {
        _price = newPrice;
    }
}

contract MockFlashLoanReceiver {
    bool public shouldRepay;
    
    constructor(bool _shouldRepay) {
        shouldRepay = _shouldRepay;
    }
    
    fallback() external payable {
        if (shouldRepay) {
            // Simulate successful repayment
            // The calling contract should handle the actual token transfer
        } else {
            // Simulate failure by reverting
            revert("Flash loan callback failed");
        }
    }
}

contract PBALendBaseTest is Test {
    // Core contracts
    PBALend public pbaLend;
    MockToken public loanToken;
    MockToken public collateralToken;
    MockOracle public oracle;
    
    // Test accounts
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    
    // Test constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 public constant INTEREST_RATE = 10e16; // 10%
    uint256 public constant LTV = 80e16; // 80%
    uint256 public constant ORACLE_PRICE = 2000e18; // $2000 per collateral token
    
    function setUp() public virtual {
        // Set up test accounts
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // Deploy contracts
        pbaLend = new PBALend();
        loanToken = new MockToken("Loan Token", "LOAN", 18);
        collateralToken = new MockToken("Collateral Token", "COLL", 18);
        oracle = new MockOracle(ORACLE_PRICE);
        
        // Mint initial tokens
        loanToken.mint(owner, INITIAL_SUPPLY);
        loanToken.mint(user1, INITIAL_SUPPLY);
        loanToken.mint(user2, INITIAL_SUPPLY);
        loanToken.mint(user3, INITIAL_SUPPLY);
        
        collateralToken.mint(owner, INITIAL_SUPPLY);
        collateralToken.mint(user1, INITIAL_SUPPLY);
        collateralToken.mint(user2, INITIAL_SUPPLY);
        collateralToken.mint(user3, INITIAL_SUPPLY);
        
        // Create a market for testing
        pbaLend.createMarket(
            address(loanToken),
            address(collateralToken),
            INTEREST_RATE,
            LTV,
            address(oracle)
        );
    }
    
    // Helper function to approve tokens for a user
    function approveTokens(address user, uint256 loanAmount, uint256 collateralAmount) internal {
        vm.startPrank(user);
        loanToken.approve(address(pbaLend), loanAmount);
        collateralToken.approve(address(pbaLend), collateralAmount);
        vm.stopPrank();
    }
    
    // Helper function to get market key
    function getMarketKey(address loan, address collateral) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(loan, collateral));
    }
    
    // Helper function to calculate maximum borrow amount based on collateral
    function calculateMaxBorrow(uint256 collateralAmount) internal view returns (uint256) {
        uint256 collateralValue = collateralAmount * ORACLE_PRICE / 1e18;
        return collateralValue * LTV / pbaLend.PERCENTAGE_DENOMINATOR();
    }
}

contract MarketCreationTest is PBALendBaseTest {
    function testCreateMarketSuccess() public {
        MockToken newLoanToken = new MockToken("New Loan", "NLOAN", 18);
        MockToken newCollateralToken = new MockToken("New Collateral", "NCOLL", 18);
        MockOracle newOracle = new MockOracle(1000e18);
        
        vm.expectEmit(true, true, false, true);
        emit PBALend.MarketCreated(address(newLoanToken), address(newCollateralToken), INTEREST_RATE, LTV);
        
        pbaLend.createMarket(
            address(newLoanToken),
            address(newCollateralToken),
            INTEREST_RATE,
            LTV,
            address(newOracle)
        );
        
        PBALend.MarketData memory marketData = pbaLend.getMarketData(address(newLoanToken), address(newCollateralToken));
        assertEq(marketData.loanToken, address(newLoanToken));
        assertEq(marketData.collateralToken, address(newCollateralToken));
        assertTrue(marketData.isActive);
        assertEq(marketData.interestRate, INTEREST_RATE);
        assertEq(marketData.LTV, LTV);
        assertEq(marketData.oracle, address(newOracle));
    }
    
    function testCreateMarketAlreadyExists() public {
        vm.expectRevert(PBALend.MarketAlreadyExists.selector);
        pbaLend.createMarket(
            address(loanToken),
            address(collateralToken),
            INTEREST_RATE,
            LTV,
            address(oracle)
        );
    }
    
    function testCreateMarketInvalidInterestRate() public {
        MockToken newLoanToken = new MockToken("New Loan", "NLOAN", 18);
        MockToken newCollateralToken = new MockToken("New Collateral", "NCOLL", 18);
        
        vm.expectRevert(PBALend.InvalidAmount.selector);
        pbaLend.createMarket(
            address(newLoanToken),
            address(newCollateralToken),
            101e16, // > 100%
            LTV,
            address(oracle)
        );
    }
    
    function testCreateMarketInvalidLTV() public {
        MockToken newLoanToken = new MockToken("New Loan", "NLOAN", 18);
        MockToken newCollateralToken = new MockToken("New Collateral", "NCOLL", 18);
        
        vm.expectRevert(PBALend.InvalidAmount.selector);
        pbaLend.createMarket(
            address(newLoanToken),
            address(newCollateralToken),
            INTEREST_RATE,
            101e16, // > 100%
            address(oracle)
        );
    }
    
    function testCreateMarketOnlyOwner() public {
        MockToken newLoanToken = new MockToken("New Loan", "NLOAN", 18);
        MockToken newCollateralToken = new MockToken("New Collateral", "NCOLL", 18);
        
        vm.prank(user1);
        vm.expectRevert();
        pbaLend.createMarket(
            address(newLoanToken),
            address(newCollateralToken),
            INTEREST_RATE,
            LTV,
            address(oracle)
        );
    }
}

contract DepositTest is PBALendBaseTest {
    function testDepositSuccess() public {
        uint256 depositAmount = 1000e18;
        approveTokens(user1, depositAmount, 0);
        
        uint256 initialBalance = loanToken.balanceOf(user1);
        
        vm.expectEmit(true, true, true, true);
        emit PBALend.Deposit(address(loanToken), address(collateralToken), user1, depositAmount, depositAmount);
        
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), depositAmount);
        
        // Check user data
        PBALend.UserData memory userData = pbaLend.getUserData(user1, address(loanToken), address(collateralToken));
        assertEq(userData.depositShares, depositAmount);
        
        // Check market data
        PBALend.MarketData memory marketData = pbaLend.getMarketData(address(loanToken), address(collateralToken));
        assertEq(marketData.totalDepositShares, depositAmount);
        assertEq(marketData.totalDepositAssets, depositAmount);
        
        // Check token balance
        assertEq(loanToken.balanceOf(user1), initialBalance - depositAmount);
        assertEq(loanToken.balanceOf(address(pbaLend)), depositAmount);
    }
    
    function testDepositMultipleUsers() public {
        uint256 depositAmount1 = 1000e18;
        uint256 depositAmount2 = 500e18;
        
        // First deposit
        approveTokens(user1, depositAmount1, 0);
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), depositAmount1);
        
        // Second deposit
        approveTokens(user2, depositAmount2, 0);
        vm.prank(user2);
        pbaLend.deposit(address(loanToken), address(collateralToken), depositAmount2);
        
        // Check market totals
        PBALend.MarketData memory marketData = pbaLend.getMarketData(address(loanToken), address(collateralToken));
        assertEq(marketData.totalDepositAssets, depositAmount1 + depositAmount2);
    }
    
    function testDepositZeroAmount() public {
        approveTokens(user1, 1000e18, 0);
        
        vm.prank(user1);
        vm.expectRevert(PBALend.InvalidAmount.selector);
        pbaLend.deposit(address(loanToken), address(collateralToken), 0);
    }
    
    function testDepositNonexistentMarket() public {
        MockToken otherToken = new MockToken("Other", "OTHER", 18);
        approveTokens(user1, 1000e18, 0);
        
        vm.prank(user1);
        vm.expectRevert(PBALend.MarketDoesNotExist.selector);
        pbaLend.deposit(address(otherToken), address(collateralToken), 1000e18);
    }
    
    function testDepositWhenPaused() public {
        pbaLend.pause();
        approveTokens(user1, 1000e18, 0);
        
        vm.prank(user1);
        vm.expectRevert();
        pbaLend.deposit(address(loanToken), address(collateralToken), 1000e18);
    }
    
    function testDepositInsufficientApproval() public {
        vm.prank(user1);
        loanToken.approve(address(pbaLend), 500e18);
        
        vm.prank(user1);
        vm.expectRevert();
        pbaLend.deposit(address(loanToken), address(collateralToken), 1000e18);
    }
}

contract BorrowTest is PBALendBaseTest {
    function setUp() public override {
        super.setUp();
        // Setup liquidity for borrowing
        uint256 depositAmount = 10000e18;
        approveTokens(user1, depositAmount, 0);
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), depositAmount);
    }
    
    function testBorrowSuccess() public {
        uint256 collateralAmount = 1e18; // 1 collateral token
        uint256 borrowAmount = calculateMaxBorrow(collateralAmount) / 2; // Borrow 50% of max
        
        approveTokens(user2, 0, collateralAmount);
        
        uint256 initialLoanBalance = loanToken.balanceOf(user2);
        uint256 initialCollateralBalance = collateralToken.balanceOf(user2);
        
        vm.expectEmit(true, true, true, true);
        emit PBALend.Borrow(address(loanToken), address(collateralToken), user2, borrowAmount, borrowAmount, collateralAmount);
        
        vm.prank(user2);
        pbaLend.borrow(address(loanToken), address(collateralToken), borrowAmount, collateralAmount);
        
        // Check user data
        PBALend.UserData memory userData = pbaLend.getUserData(user2, address(loanToken), address(collateralToken));
        assertEq(userData.borrowShares, borrowAmount);
        assertEq(userData.collateralAssets, collateralAmount);
        
        // Check balances
        assertEq(loanToken.balanceOf(user2), initialLoanBalance + borrowAmount);
        assertEq(collateralToken.balanceOf(user2), initialCollateralBalance - collateralAmount);
    }
    
    function testBorrowInsufficientCollateral() public {
        uint256 collateralAmount = 1e18;
        uint256 borrowAmount = calculateMaxBorrow(collateralAmount) + 1; // Slightly over max
        
        approveTokens(user2, 0, collateralAmount);
        
        vm.prank(user2);
        vm.expectRevert(PBALend.InsufficientCollateral.selector);
        pbaLend.borrow(address(loanToken), address(collateralToken), borrowAmount, collateralAmount);
    }
    
    function testBorrowInsufficientLiquidity() public {
        // Try to borrow more than available liquidity
        uint256 collateralAmount = 100e18; // Large collateral
        uint256 borrowAmount = 15000e18; // More than deposited liquidity (10000e18)
        
        approveTokens(user2, 0, collateralAmount);
        
        vm.prank(user2);
        vm.expectRevert(PBALend.InsufficientLiquidity.selector);
        pbaLend.borrow(address(loanToken), address(collateralToken), borrowAmount, collateralAmount);
    }
    
    function testBorrowZeroAmount() public {
        uint256 collateralAmount = 1e18;
        approveTokens(user2, 0, collateralAmount);
        
        vm.prank(user2);
        vm.expectRevert(PBALend.InvalidAmount.selector);
        pbaLend.borrow(address(loanToken), address(collateralToken), 0, collateralAmount);
    }
    
    function testBorrowNonexistentMarket() public {
        MockToken otherToken = new MockToken("Other", "OTHER", 18);
        uint256 collateralAmount = 1e18;
        approveTokens(user2, 0, collateralAmount);
        
        vm.prank(user2);
        vm.expectRevert(PBALend.MarketDoesNotExist.selector);
        pbaLend.borrow(address(otherToken), address(collateralToken), 100e18, collateralAmount);
    }
    
    function testBorrowWhenPaused() public {
        pbaLend.pause();
        uint256 collateralAmount = 1e18;
        uint256 borrowAmount = calculateMaxBorrow(collateralAmount) / 2;
        approveTokens(user2, 0, collateralAmount);
        
        vm.prank(user2);
        vm.expectRevert();
        pbaLend.borrow(address(loanToken), address(collateralToken), borrowAmount, collateralAmount);
    }
    
    function testBorrowWithPriceFluctuation() public {
        uint256 collateralAmount = 1e18;
        uint256 borrowAmount = calculateMaxBorrow(collateralAmount) * 90 / 100; // 90% of max
        
        approveTokens(user2, 0, collateralAmount);
        
        vm.prank(user2);
        pbaLend.borrow(address(loanToken), address(collateralToken), borrowAmount, collateralAmount);
        
        // Price drops significantly
        oracle.setPrice(ORACLE_PRICE / 2);
        
        // Should now be unhealthy if trying to borrow more
        vm.prank(user2);
        vm.expectRevert(PBALend.InsufficientCollateral.selector);
        pbaLend.borrow(address(loanToken), address(collateralToken), 1e18, 0);
    }
}

contract RepayTest is PBALendBaseTest {
    uint256 public borrowAmount = 1000e18;
    uint256 public collateralAmount = 1e18;
    
    function setUp() public override {
        super.setUp();
        // Setup liquidity and borrow position
        uint256 depositAmount = 10000e18;
        approveTokens(user1, depositAmount, 0);
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), depositAmount);
        
        // User2 borrows
        approveTokens(user2, 0, collateralAmount);
        vm.prank(user2);
        pbaLend.borrow(address(loanToken), address(collateralToken), borrowAmount, collateralAmount);
    }
    
    function testRepaySuccess() public {
        approveTokens(user2, borrowAmount, 0);
        
        uint256 initialBalance = loanToken.balanceOf(user2);
        
        vm.expectEmit(true, true, true, true);
        emit PBALend.Repay(address(loanToken), address(collateralToken), user2, borrowAmount, borrowAmount);
        
        vm.prank(user2);
        pbaLend.repay(address(loanToken), address(collateralToken), borrowAmount);
        
        // Check user data
        PBALend.UserData memory userData = pbaLend.getUserData(user2, address(loanToken), address(collateralToken));
        assertEq(userData.borrowShares, 0);
        
        // Check balance
        assertEq(loanToken.balanceOf(user2), initialBalance - borrowAmount);
    }
    
    function testRepayPartial() public {
        uint256 repayAmount = borrowAmount / 2;
        approveTokens(user2, repayAmount, 0);
        
        vm.prank(user2);
        pbaLend.repay(address(loanToken), address(collateralToken), repayAmount);
        
        // Check user data
        PBALend.UserData memory userData = pbaLend.getUserData(user2, address(loanToken), address(collateralToken));
        assertEq(userData.borrowShares, borrowAmount - repayAmount);
    }
    
    function testRepayZeroAmount() public {
        approveTokens(user2, borrowAmount, 0);
        
        vm.prank(user2);
        vm.expectRevert(PBALend.InvalidAmount.selector);
        pbaLend.repay(address(loanToken), address(collateralToken), 0);
    }
    
    function testRepayNonexistentMarket() public {
        MockToken otherToken = new MockToken("Other", "OTHER", 18);
        approveTokens(user2, borrowAmount, 0);
        
        vm.prank(user2);
        vm.expectRevert(PBALend.MarketDoesNotExist.selector);
        pbaLend.repay(address(otherToken), address(collateralToken), borrowAmount);
    }
    
    function testRepayWhenPaused() public {
        pbaLend.pause();
        approveTokens(user2, borrowAmount, 0);
        
        vm.prank(user2);
        vm.expectRevert();
        pbaLend.repay(address(loanToken), address(collateralToken), borrowAmount);
    }
    
    function testRepayWithInterestAccrual() public {
        // Skip time to accrue interest
        vm.warp(block.timestamp + 365 days);
        
        // First, trigger interest accrual by calling a function that updates interest
        // We'll make a small deposit to trigger _accrueInterest
        approveTokens(user1, 1e18, 0);
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), 1e18);
        
        // Now get the updated market data
        PBALend.MarketData memory marketData = pbaLend.getMarketData(address(loanToken), address(collateralToken));
        
        // The total borrow assets should have increased due to interest
        assertGt(marketData.totalBorrowAssets, borrowAmount);
        
        // Calculate the actual amount needed to repay
        uint256 actualBorrowAmount = borrowAmount * marketData.totalBorrowAssets / marketData.totalBorrowShares;
        approveTokens(user2, actualBorrowAmount, 0);
        
        vm.prank(user2);
        pbaLend.repay(address(loanToken), address(collateralToken), actualBorrowAmount);
        
        PBALend.UserData memory userData = pbaLend.getUserData(user2, address(loanToken), address(collateralToken));
        assertEq(userData.borrowShares, 0);
    }
}

contract WithdrawTest is PBALendBaseTest {
    uint256 public depositAmount = 5000e18;
    uint256 public borrowAmount = 1000e18;
    uint256 public collateralAmount = 1e18;
    
    function setUp() public override {
        super.setUp();
        // Setup deposits and borrows
        approveTokens(user1, depositAmount, 0);
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), depositAmount);
        
        // User2 borrows (creates some utilization)
        approveTokens(user2, 0, collateralAmount);
        vm.prank(user2);
        pbaLend.borrow(address(loanToken), address(collateralToken), borrowAmount, collateralAmount);
    }
    
    function testWithdrawSuccess() public {
        uint256 withdrawShares = depositAmount / 2;
        uint256 initialBalance = loanToken.balanceOf(user1);
        
        vm.expectEmit(true, true, true, true);
        emit PBALend.Withdraw(address(loanToken), address(collateralToken), user1, withdrawShares, withdrawShares);
        
        vm.prank(user1);
        pbaLend.withdraw(address(loanToken), address(collateralToken), withdrawShares);
        
        // Check user data
        PBALend.UserData memory userData = pbaLend.getUserData(user1, address(loanToken), address(collateralToken));
        assertEq(userData.depositShares, depositAmount - withdrawShares);
        
        // Check balance
        assertEq(loanToken.balanceOf(user1), initialBalance + withdrawShares);
    }
    
    function testWithdrawInsufficientLiquidity() public {
        // Try to withdraw more than available (considering borrowed amount)
        uint256 availableLiquidity = depositAmount - borrowAmount;
        uint256 withdrawShares = availableLiquidity + 1e18;
        
        vm.prank(user1);
        vm.expectRevert(PBALend.InsufficientLiquidity.selector);
        pbaLend.withdraw(address(loanToken), address(collateralToken), withdrawShares);
    }
    
    function testWithdrawZeroShares() public {
        vm.prank(user1);
        vm.expectRevert(PBALend.InvalidAmount.selector);
        pbaLend.withdraw(address(loanToken), address(collateralToken), 0);
    }
    
    function testWithdrawCollateralSuccess() public {
        uint256 withdrawAmount = collateralAmount / 4; // Withdraw 25% to be safe
        uint256 initialBalance = collateralToken.balanceOf(user2);
        
        vm.expectEmit(true, true, true, true);
        emit PBALend.WithdrawCollateral(address(loanToken), address(collateralToken), user2, withdrawAmount);
        
        vm.prank(user2);
        pbaLend.withdrawCollateral(address(loanToken), address(collateralToken), withdrawAmount);
        
        // Check user data
        PBALend.UserData memory userData = pbaLend.getUserData(user2, address(loanToken), address(collateralToken));
        assertEq(userData.collateralAssets, collateralAmount - withdrawAmount);
        
        // Check balance
        assertEq(collateralToken.balanceOf(user2), initialBalance + withdrawAmount);
    }
    
    function testWithdrawCollateralInsufficientBalance() public {
        vm.prank(user2);
        vm.expectRevert(PBALend.InsufficientBalance.selector);
        pbaLend.withdrawCollateral(address(loanToken), address(collateralToken), collateralAmount + 1e18);
    }
    
    function testWithdrawCollateralHealthCheck() public {
        // Try to withdraw collateral that would make position unhealthy
        vm.prank(user2);
        vm.expectRevert(PBALend.InsufficientCollateral.selector);
        pbaLend.withdrawCollateral(address(loanToken), address(collateralToken), collateralAmount);
    }
    
    function testWithdrawCollateralAfterPriceChange() public {
        // Price increases, allowing more collateral withdrawal
        oracle.setPrice(ORACLE_PRICE * 2);
        
        uint256 withdrawAmount = collateralAmount / 2;
        vm.prank(user2);
        pbaLend.withdrawCollateral(address(loanToken), address(collateralToken), withdrawAmount);
        
        PBALend.UserData memory userData = pbaLend.getUserData(user2, address(loanToken), address(collateralToken));
        assertEq(userData.collateralAssets, collateralAmount - withdrawAmount);
    }
}

contract FlashLoanTest is PBALendBaseTest {
    MockFlashLoanReceiver public goodReceiver;
    MockFlashLoanReceiver public badReceiver;
    
    function setUp() public override {
        super.setUp();
        // Add liquidity for flash loans
        uint256 depositAmount = 10000e18;
        approveTokens(user1, depositAmount, 0);
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), depositAmount);
        
        goodReceiver = new MockFlashLoanReceiver(true);
        badReceiver = new MockFlashLoanReceiver(false);
        
        // Give receivers tokens to repay flash loans
        loanToken.mint(address(goodReceiver), 1000e18);
        loanToken.mint(address(badReceiver), 1000e18);
    }
    
    function testFlashLoanSuccess() public {
        uint256 flashAmount = 1000e18;
        bytes memory data = "";
        
        // Approve the receiver to spend tokens for repayment
        vm.prank(address(goodReceiver));
        loanToken.approve(address(pbaLend), flashAmount);
        
        vm.expectEmit(true, true, false, true);
        emit PBALend.FlashLoan(address(loanToken), address(goodReceiver), flashAmount);
        
        vm.prank(address(goodReceiver));
        pbaLend.flashLoan(address(loanToken), flashAmount, data);
    }
    
    function testFlashLoanZeroAmount() public {
        bytes memory data = "";
        
        vm.prank(address(goodReceiver));
        vm.expectRevert(PBALend.InvalidAmount.selector);
        pbaLend.flashLoan(address(loanToken), 0, data);
    }
    
    function testFlashLoanCallbackFailure() public {
        uint256 flashAmount = 1000e18;
        bytes memory data = "";
        
        vm.prank(address(badReceiver));
        vm.expectRevert(PBALend.TransferFailed.selector);
        pbaLend.flashLoan(address(loanToken), flashAmount, data);
    }
    
    function testFlashLoanWhenPaused() public {
        pbaLend.pause();
        uint256 flashAmount = 1000e18;
        bytes memory data = "";
        
        vm.prank(address(goodReceiver));
        vm.expectRevert();
        pbaLend.flashLoan(address(loanToken), flashAmount, data);
    }
}

contract AdminTest is PBALendBaseTest {
    function testSetMarketStatusSuccess() public {
        vm.expectEmit(true, true, false, true);
        emit PBALend.MarketStatusSet(address(loanToken), address(collateralToken), false);
        
        pbaLend.setMarketStatus(address(loanToken), address(collateralToken), false);
        
        PBALend.MarketData memory marketData = pbaLend.getMarketData(address(loanToken), address(collateralToken));
        assertFalse(marketData.isActive);
    }
    
    function testSetMarketStatusOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pbaLend.setMarketStatus(address(loanToken), address(collateralToken), false);
    }
    
    function testSetMarketStatusNonexistentMarket() public {
        MockToken otherToken = new MockToken("Other", "OTHER", 18);
        
        vm.expectRevert(PBALend.MarketDoesNotExist.selector);
        pbaLend.setMarketStatus(address(otherToken), address(collateralToken), false);
    }
    
    function testPauseUnpause() public {
        // Test pause
        pbaLend.pause();
        assertTrue(pbaLend.paused());
        
        // Test operations fail when paused
        approveTokens(user1, 1000e18, 0);
        vm.prank(user1);
        vm.expectRevert();
        pbaLend.deposit(address(loanToken), address(collateralToken), 1000e18);
        
        // Test unpause
        pbaLend.unpause();
        assertFalse(pbaLend.paused());
        
        // Test operations work after unpause
        vm.prank(user1);
        pbaLend.deposit(address(loanToken), address(collateralToken), 1000e18);
    }
    
    function testPauseOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pbaLend.pause();
    }
    
    function testUnpauseOnlyOwner() public {
        pbaLend.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        pbaLend.unpause();
    }
}