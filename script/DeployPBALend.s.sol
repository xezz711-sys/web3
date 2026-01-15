// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {PBALend} from "../src/PBALend.sol";
import {MockToken} from "../src/MockToken.sol";
import {PythOracle} from "../src/PythOracle.sol";

contract DeployPBALend is Script {
    address owner;
    uint256 deployerKey;
    string rpcUrl;
    mapping(string => bytes32) internal pythOraclePriceFeedId;

    function run() public {
        pythOraclePriceFeedId["BTC"] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
        pythOraclePriceFeedId["ETH"] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

        deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        owner = vm.addr(deployerKey);

        //RPC URL
        rpcUrl = vm.envString("RPC_URL");
        vm.createSelectFork(rpcUrl);

        vm.startBroadcast(deployerKey);

        MockToken[2] memory loanToken = [
            new MockToken("USDC", "USDC", 6),
            new MockToken("DAI", "DAI", 18)
        ];

        MockToken[2] memory collateralToken = [
            new MockToken("BTC", "BTC", 8),
            new MockToken("ETH", "ETH", 18)
        ];

        PBALend pbalend = new PBALend();

        for (uint256 i = 0; i < loanToken.length; i++) {
            loanToken[i].mint(owner, 1000000*(10**loanToken[i].decimals()));
            for (uint256 j = 0; j < collateralToken.length; j++) {
                collateralToken[j].mint(owner, 1000000*(10**collateralToken[j].decimals()));
                PythOracle pythOracle = new PythOracle(vm.envAddress("PYTH_ORACLE"), address(collateralToken[j]), address(loanToken[i]), pythOraclePriceFeedId[collateralToken[j].symbol()]);
                pbalend.createMarket(address(loanToken[i]), address(collateralToken[j]), 10e16, 90e16, address(pythOracle));
            }
        }

        string memory deployedContract = string.concat(
            "\n\nPBA_LEND=", vm.toString(address(pbalend)),
            "\nUSDC=", vm.toString(address(loanToken[0])),
            "\nDAI=", vm.toString(address(loanToken[1])),
            "\nBTC=", vm.toString(address(collateralToken[0])),
            "\nETH=", vm.toString(address(collateralToken[1]))
        );

        vm.writeFile(".env", string.concat(vm.readFile(".env"), deployedContract));

        vm.stopBroadcast();
    }
}