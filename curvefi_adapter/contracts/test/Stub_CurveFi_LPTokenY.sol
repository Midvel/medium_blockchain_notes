pragma solidity ^0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";


/**
 * @dev Simplified stub to imitate Curve.Fi LP-token
 */
contract Stub_CurveFi_LPTokenY is Initializable, Context, ERC20, ERC20Detailed, ERC20Mintable, ERC20Burnable {
    function initialize() public initializer {
        ERC20Mintable.initialize(_msgSender());
        ERC20Detailed.initialize("Curve.fi yDAI/yUSDC/yUSDT/yTUSD", "yDAI+yUSDC+yUSDT+yTUSD", 18);
    }
}