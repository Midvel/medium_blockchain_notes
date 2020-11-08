// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UniqueToken is ERC20 {
    constructor(address _holder, uint256 _supply) ERC20("UniqueToken", "UNQ") public {
        _mint(_holder, _supply);
    }
}