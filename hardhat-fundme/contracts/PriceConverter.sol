// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Get the import ABI
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed) internal view returns(uint256) {
        // We need the ABI and the address to call the external aggregator API
        // Address : 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b841

        (,int256 price,,,) = priceFeed.latestRoundData(); // has 1e8 size
        return uint256(price * 1e10); // converting to the Wei
    }

    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
