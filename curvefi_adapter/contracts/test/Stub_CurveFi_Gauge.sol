pragma solidity ^0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "../curvefi/ICurveFi_Minter.sol";
import "../curvefi/ICurveFi_Gauge.sol";

/** 
 * @dev Test stub for the implementation of Curve.Fi CRV staking Gauge contract.
 * @dev Original code is located in official repository:
 * https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/LiquidityGauge.vy
 */
contract Stub_CurveFi_Gauge is ICurveFi_Gauge, Initializable, Context {
    using SafeMath for uint256;

    //CRV distribution number
    uint128 period;

    //Simplification to keep timestamp
    uint256 period_timestamp;

    //CRV Minter contract
    address public __minter;

    //CRV token
    address public __crv_token;

    //LP-token from Curve pool
    address public __lp_token;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    //Total shares of CRV for the user
    mapping(address => uint256) public __integrate_fraction;

    mapping (uint256 => uint256) public integrate_inv_supply;
    mapping(address => uint256) public integrate_inv_supply_of;
    mapping(address => uint256) public integrate_checkpoint_of;

    mapping(address => uint256) public working_balances;
    uint256 public working_supply;

    uint256 public constant TOKENLESS_PRODUCTION = 40;

    //Rate taken from CRV
    uint256 public constant YEAR = 365 * 24 * 60 * 60;
    uint256 public constant INITIAL_RATE = (274_815_283 * (10 ** 18)) / YEAR;


    function initialize(address lp_addr, address _minter) public {
        __minter = _minter;
        __lp_token = lp_addr;

        __crv_token = ICurveFi_Minter(_minter).token();
        period_timestamp = block.timestamp;
    }

    function user_checkpoint(address addr) public returns(bool) {
        require(msg.sender == addr || msg.sender == __minter, "Unauthorized minter");
        _checkpoint(addr);
        _update_liquidity_limit(addr, balanceOf[addr], totalSupply);
        return true;
    }
 
    //Deposit Curve LP tokens into the Gauge
    function deposit(uint256 _value) public {
        _checkpoint(_msgSender());

        if (_value != 0) {
            balanceOf[_msgSender()] = balanceOf[_msgSender()].add(_value);
            totalSupply = totalSupply.add(_value);

            _update_liquidity_limit(_msgSender(), balanceOf[_msgSender()], totalSupply);

            IERC20(__lp_token).transferFrom(_msgSender(), address(this), _value);
        }
    }

    //Withdraw Curve LP tokens back to the user
    function withdraw(uint256 _value) public {
        _checkpoint(_msgSender());

        balanceOf[_msgSender()] = balanceOf[_msgSender()].sub(_value);
        totalSupply = totalSupply.sub(_value);

        _update_liquidity_limit(_msgSender(), balanceOf[_msgSender()], totalSupply);

        IERC20(__lp_token).transfer(_msgSender(), _value);
    }

    //Get CRV available for the user
    function claimable_tokens(address addr) external returns (uint256) {
        _checkpoint(addr);
        return __integrate_fraction[addr] - ICurveFi_Minter(__minter).minted(addr, address(this));
    }

    //Checkpoint for a user
    function _checkpoint(address addr) internal {
        uint256 _integrate_inv_supply = integrate_inv_supply[period];
        uint256 _working_balance = working_balances[addr];
        uint256 _working_supply = working_supply;

        // Update integral of 1/supply
        if (block.timestamp > period_timestamp) {
            //Originally rewards are minted with complex calculations for a week.
            //It is simplified to have weight equal 1 and  rate equal INITIAL_RATE and period in 1 block
            uint256 dt = block.timestamp - period_timestamp;

            if (_working_supply > 0) {
                _integrate_inv_supply += INITIAL_RATE * dt / _working_supply;
            }
        }
        //Simplification - always mint a couple of tokens
        _integrate_inv_supply += 2;

        period += 1;
        period_timestamp = block.timestamp;
        integrate_inv_supply[period] = _integrate_inv_supply;
        // Update user-specific integrals
        __integrate_fraction[addr] += _working_balance * (_integrate_inv_supply - integrate_inv_supply_of[addr]) / 10 ** 18;
        integrate_inv_supply_of[addr] = _integrate_inv_supply;
        integrate_checkpoint_of[addr] = block.timestamp;
    }

    /**
     * @notice Calculate limits which depend on the amount of CRV token per-user.
                Effectively it calculates working balances to apply amplification
                of CRV production by CRV
     * @param addr User address
     * @param l User's amount of liquidity (LP tokens)
     * @param L Total amount of liquidity (LP tokens)
     */
    function _update_liquidity_limit(address addr, uint256 l, uint256 L) public {
        uint256 lim = l * TOKENLESS_PRODUCTION / 100;

        uint256 old_bal = working_balances[addr];
        working_balances[addr] = lim;
        working_supply = working_supply + lim - old_bal;
    }

    function minter() public view returns(address) {
        return __minter;
    }

    function crv_token() public view returns(address) {
        return __crv_token;
    }

    function lp_token() public view returns(address) {
        return __lp_token;
    }

    function integrate_fraction(address _for) public view returns(uint256) {
        return __integrate_fraction[_for];
    }
}

