// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./PriceConverter.sol";

error NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    // Save Gas by using constant
    uint256 public constant MIN_USD = 50 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    address public immutable i_owner;
    AggregatorV3Interface public priceFeed;

    constructor(address _priceFeed) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function fund() public payable {
        // Must be able to set azminimum funding amount
        // How do we let people send money to the contract?
        // It needs to be payable

        // You can get the value with msg.value
        // Send at least 1 ETH = 1e18 Wei = 1e9 Gwei
        // Revert undoes any previous actions and sends remaining gas back

        require(msg.value.getConversionRate(priceFeed) > MIN_USD, "Didn't send enough funds");
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
        // Need chainlink to convert USD to ETH

    }
    
    function withdraw() public payable onlyOwner {
        
        // For loops in solidity
        // Reset the mapping
        for(uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        funders = new address[](0);

        // Tranfer (2300 gas and throws an error auto revert on failure)
        // msg.sender type address
        // payable(msg.sender) type payable address
        // payable(msg.sender).transfer(address(this).balance);

        // Send (2300 gas and returns a bool)
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");

        // Low Level Call (forwards all gad, returns bool)
        // RECCOMENDED WAY TO SEND OR RECEIVE
        (bool callSuccess,) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Send Failed");
    }

    // Modifiers to wrap funtions
    modifier onlyOwner {
        // require(msg.sender == i_owner, "Not authorised");
        
        // Gas optimized way to revert without storing string error message
        // User defined errors
        // revert() can be used anywhere
        if(msg.sender != i_owner) { revert NotOwner(); }
        _;
    }

    // What happens if somone sends this contract ETH wihout calling the fund function

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
    // fallback()
}
