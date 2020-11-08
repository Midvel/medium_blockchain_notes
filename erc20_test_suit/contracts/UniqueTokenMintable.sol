// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UniqueTokenMintable is ERC20, Ownable {
    
    constructor(address _holder, uint256 _initialSupply) Ownable() ERC20("UniqueTokenMintable", "UNQM") public {
        _mint(_holder, _initialSupply);
    }

    function mint(uint256 _amount) public onlyOwner {
        _mint(owner(), _amount);
    }
}