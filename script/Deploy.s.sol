// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PBALend} from "../src/PBALend.sol";
import {MockToken} from "../src/MockToken.sol";

// Simple Mock Oracle for testing - always returns 1:1 price
contract SimpleMockOracle {
    function getPrice() external pure returns (uint256) {
        return 1e18; // 1:1 price for simplicity
    }
}

contract DeployScript is Script {
    function run() external {
        // Start broadcast - uses private key from --private-key flag
        vm.startBroadcast();

        // Deploy Mock Tokens for testing
        MockToken usdc = new MockToken("USD Coin", "USDC", 6);
        MockToken dai = new MockToken("Dai Stablecoin", "DAI", 18);
        MockToken weth = new MockToken("Wrapped Ether", "WETH", 18);
        MockToken wbtc = new MockToken("Wrapped Bitcoin", "WBTC", 8);

        console.log("USDC deployed at:", address(usdc));
        console.log("DAI deployed at:", address(dai));
        console.log("WETH deployed at:", address(weth));
        console.log("WBTC deployed at:", address(wbtc));

        // Deploy Simple Mock Oracle
        SimpleMockOracle oracle = new SimpleMockOracle();
        console.log("Oracle deployed at:", address(oracle));

        // Deploy PBALend
        PBALend pbaLend = new PBALend();
        console.log("PBALend deployed at:", address(pbaLend));

        // Create markets
        // USDC/WETH market: 5% interest, 80% LTV
        pbaLend.createMarket(
            address(usdc),
            address(weth),
            500, // 5% = 500 basis points
            8000, // 80% = 8000 basis points
            address(oracle)
        );
        console.log("Market USDC/WETH created");

        // DAI/WBTC market: 4.5% interest, 75% LTV
        pbaLend.createMarket(
            address(dai),
            address(wbtc),
            450, // 4.5%
            7500, // 75%
            address(oracle)
        );
        console.log("Market DAI/WBTC created");

        vm.stopBroadcast();

        // Print summary
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("PBALend:", address(pbaLend));
        console.log("USDC:", address(usdc));
        console.log("DAI:", address(dai));
        console.log("WETH:", address(weth));
        console.log("WBTC:", address(wbtc));
        console.log("Oracle:", address(oracle));
    }
}
