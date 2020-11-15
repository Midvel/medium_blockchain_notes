pragma solidity ^0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";

import "../curvefi/ICurveFi_Minter.sol";
import "../curvefi/ICurveFi_Gauge.sol";


/** 
 * @dev Test stub for the implementation of Curve.Fi CRV minter contract.
 * @dev Original code is located in official repository:
 * https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/Minter.vy
 */
contract Stub_CurveFi_Minter is Initializable, Context, ICurveFi_Minter {
    mapping(address => mapping(address => uint256)) public __minted;
    mapping(address => mapping(address => bool)) public allowed_to_mint_for;
    
    //CRV token
    address public __token;

    function initialize(address _token) public {
        __token = _token;
    }

    function mint(address gauge_addr) public {
        _mint_for(gauge_addr, msg.sender);
    }

    function mint_for(address gauge_addr, address _for) public {
        if (allowed_to_mint_for[msg.sender][_for])
            _mint_for(gauge_addr, _for);
    }

    function toggle_approve_mint(address minting_user) public {
        allowed_to_mint_for[minting_user][msg.sender] = !allowed_to_mint_for[minting_user][msg.sender];
    }

    function token() public view returns(address) {
        return __token;
    }

    function minted(address _for, address gauge_addr) public view returns(uint256) {
        return __minted[_for][gauge_addr];
    }

    function _mint_for(address gauge_addr, address _for) internal {
        ICurveFi_Gauge(gauge_addr).user_checkpoint(_for);
        uint256 total_mint = ICurveFi_Gauge(gauge_addr).integrate_fraction(_for);
        uint256 to_mint = total_mint - __minted[_for][gauge_addr];

        if (to_mint != 0) {
            ERC20Mintable(__token).mint(_for, to_mint);
            __minted[_for][gauge_addr] = total_mint;
        }
    }
}