// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IPythOracle} from "./interfaces/IPythOracle.sol";

contract PythOracle is IPythOracle {
    IPyth pyth;
    address public quoteFeed;
    address public baseFeed;
    bytes32 public priceFeedId;

    constructor(address pyth_, address quoteFeed_, address baseFeed_, bytes32 priceFeedId_) {
        pyth = IPyth(pyth_);
        quoteFeed = quoteFeed_;
        baseFeed = baseFeed_;
        priceFeedId = priceFeedId_;
    }

    function getPrice() external view returns (uint256) {
        PythStructs.Price memory price = pyth.getPriceUnsafe(priceFeedId);
        uint256 priceDecimals = SafeCast.toUint256(-price.expo);
        uint256 tokenPrice = SafeCast.toUint256(price.price) * (10 ** IERC20Metadata(baseFeed).decimals()) / 10 ** priceDecimals;
        return tokenPrice;
    }
}