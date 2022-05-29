// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7; // 0.8.12

// We love comments in my contract amazing

contract SimpleStorage {
    // Basic types: boolean, uint, int, address, bytes
    
    // This gets initialized to zero
    uint256 public meanNumber;

    // Adding a key,value store
    mapping(string => uint256) public nameToNumber;

    // Simple struct initialization
    People public person = People({number: 0, name: "Patrick"});

    // Typical struct data type
    struct People {
        uint256 number;
        string name;
    }

    // Creating arrays
    // Since size is not given, this is a dyanamic array
    People[] public people;

    // view: only can read state, pure: cannot read or write state
    // Calling view functionsis free, unless you're calling it inside a write function
    function retrieve() public view returns(uint256) {
        return meanNumber;
    }

    function mean(uint256 a, uint256 b) public pure returns(uint256) {
        return (a + b)/2;
    }
    

    // calldata: temporary variables cannot be modified
    // memory: temporary variables than can be modified
    // storage: global variable
    function addPerson(string memory _name, uint256 _number) public virtual {
        People memory newPerson = People({name: _name, number: _number});
        // People memory newPerson = People(_name, _number});
        people.push(newPerson);

        // Also adding to mapping
        nameToNumber[_name] = _number;

        // Calculating mean
        meanNumber = mean(meanNumber, _number);
    }
} 
