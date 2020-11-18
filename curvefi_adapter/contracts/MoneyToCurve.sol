pragma solidity ^0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "./curvefi/ICurveFi_DepositY.sol";
import "./curvefi/ICurveFi_Gauge.sol";
import "./curvefi/ICurveFi_Minter.sol";
import "./curvefi/ICurveFi_SwapY.sol";
import "./curvefi/IYERC20.sol";

contract MoneyToCurve is Initializable, Context, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public curveFi_Deposit;
    address public curveFi_Swap;
    address public curveFi_LPToken;
    address public curveFi_LPGauge;
    address public curveFi_CRVMinter;
    address public curveFi_CRVToken;
    
    function initialize() external initializer {
        Ownable.initialize(_msgSender());
    }

    /**
     * @notice Set CurveFi contracts addresses
     * @param _depositContract CurveFi Deposit contract for Y-pool
     * @param _gaugeContract CurveFi Gauge contract for Y-pool
     * @param _minterContract CurveFi CRV minter
     */
    function setup(address _depositContract, address _gaugeContract, address _minterContract) external onlyOwner {
        require(_depositContract != address(0), "Incorrect deposit contract address");

        curveFi_Deposit = _depositContract;
        curveFi_Swap = ICurveFi_DepositY(curveFi_Deposit).curve();
        curveFi_LPGauge = _gaugeContract;
        curveFi_LPToken = ICurveFi_DepositY(curveFi_Deposit).token();

        require(ICurveFi_Gauge(curveFi_LPGauge).lp_token() == address(curveFi_LPToken), "CurveFi LP tokens do not match");        

        curveFi_CRVMinter = _minterContract;
        curveFi_CRVToken = ICurveFi_Gauge(curveFi_LPGauge).crv_token();
    }


    /**
     * @notice Deposits 4 stablecoins (registered in Curve.Fi Y pool)
     * @param _amounts Array of amounts for CurveFI stablecoins in pool (denormalized to token decimals)
     */
    function multiStepDeposit(uint256[4] memory _amounts) public {
        address[4] memory stablecoins = ICurveFi_DepositY(curveFi_Deposit).underlying_coins();

        for (uint256 i = 0; i < stablecoins.length; i++) {
            IERC20(stablecoins[i]).safeTransferFrom(_msgSender(), address(this), _amounts[i]);
            IERC20(stablecoins[i]).safeApprove(curveFi_Deposit, _amounts[i]);
        }

        //Step 1 - deposit stablecoins and get Curve.Fi LP tokens
        ICurveFi_DepositY(curveFi_Deposit).add_liquidity(_amounts, 0); //0 to mint all Curve has to 

        //Step 2 - stake Curve LP tokens into Gauge and get CRV rewards
        uint256 curveLPBalance = IERC20(curveFi_LPToken).balanceOf(address(this));

        IERC20(curveFi_LPToken).safeApprove(curveFi_LPGauge, curveLPBalance);
        ICurveFi_Gauge(curveFi_LPGauge).deposit(curveLPBalance);

        //Step 3 - get all the rewards (and make whatever you need with them)
        crvTokenClaim();
        uint256 crvAmount = IERC20(curveFi_CRVToken).balanceOf(address(this));
        IERC20(curveFi_CRVToken).safeTransfer(_msgSender(), crvAmount);

    }


    /**
     * @notice Withdraws 4 stablecoins (registered in Curve.Fi Y pool)
     * @param _amounts Array of amounts for CurveFI stablecoins in pool (denormalized to token decimals)
     */
    function multiStepWithdraw(uint256[4] memory _amounts) public {
        address[4] memory stablecoins = ICurveFi_DepositY(curveFi_Deposit).underlying_coins();

        //Step 1 - Calculate amount of Curve LP-tokens to unstake
        uint256 nWithdraw;
        uint256 i;
        for (i = 0; i < stablecoins.length; i++) {
            nWithdraw = nWithdraw.add(normalize(stablecoins[i], _amounts[i]));
        }

        uint256 withdrawShares = calculateShares(nWithdraw);

        //Check if you can re-use unstaked LP tokens
        uint256 notStaked = curveLPTokenUnstaked();
        if (notStaked > 0) {
            withdrawShares = withdrawShares.sub(notStaked);
        }

        //Step 2 - Unstake Curve LP tokens from Gauge
        ICurveFi_Gauge(curveFi_LPGauge).withdraw(withdrawShares);
    
        //Step 3 - Withdraw stablecoins from CurveDeposit
        IERC20(curveFi_LPToken).safeApprove(curveFi_Deposit, withdrawShares);
        ICurveFi_DepositY(curveFi_Deposit).remove_liquidity_imbalance(_amounts, withdrawShares);
        
        //Step 4 - Send stablecoins to the requestor
        for (i = 0; i <  stablecoins.length; i++){
            IERC20 stablecoin = IERC20(stablecoins[i]);
            uint256 balance = stablecoin.balanceOf(address(this));
            uint256 amount = (balance <= _amounts[i]) ? balance : _amounts[i]; //Safepoint for rounding
            stablecoin.safeTransfer(_msgSender(), amount);
        }
    }

    /**
     * @notice Get amount of CurveFi LP tokens staked in the Gauge
     */
    function curveLPTokenStaked() public view returns(uint256) {
        return ICurveFi_Gauge(curveFi_LPGauge).balanceOf(address(this));
    }
    
    /**
     * @notice Get amount of unstaked CurveFi LP tokens (which lay on this contract)
     */
    function curveLPTokenUnstaked() public view returns(uint256) {
        return IERC20(curveFi_LPToken).balanceOf(address(this));
    }

    /**
     * @notice Get full amount of Curve LP tokens available for this contract
     */
    function curveLPTokenBalance() public view returns(uint256) {
        uint256 staked = curveLPTokenStaked();
        uint256 unstaked = curveLPTokenUnstaked();
        return unstaked.add(staked);
    }

    /**
     * @notice Claim CRV reward
     */
    function crvTokenClaim() internal {
        ICurveFi_Minter(curveFi_CRVMinter).mint(curveFi_LPGauge);
    }

    /**
     * @notice Calculate shared part of this contract in LP token distriution
     * @param normalizedWithdraw amount of stablecoins to withdraw normalized to 18 decimals
     */    
    function calculateShares(uint256 normalizedWithdraw) internal view returns(uint256) {
        uint256 nBalance = normalizedBalance();
        uint256 poolShares = curveLPTokenBalance();
        
        return poolShares.mul(normalizedWithdraw).div(nBalance);
    }

    /**
     * @notice Balances of stablecoins available for withdraw
     */
    function balanceOfAll() public view returns(uint256[4] memory balances) {
        address[4] memory stablecoins = ICurveFi_DepositY(curveFi_Deposit).underlying_coins();

        uint256 curveLPBalance = curveLPTokenBalance();
        uint256 curveLPTokenSupply = IERC20(curveFi_LPToken).totalSupply();

        require(curveLPTokenSupply > 0, "No Curve LP tokens minted");

        for (uint256 i = 0; i < stablecoins.length; i++) {
            //Get Y-tokens balance
            uint256 yLPTokenBalance = ICurveFi_SwapY(curveFi_Swap).balances(int128(i));
            address yCoin = ICurveFi_SwapY(curveFi_Swap).coins(int128(i));

            //Calculate user's shares in y-tokens
            uint256 yShares = yLPTokenBalance.mul(curveLPBalance).div(curveLPTokenSupply);

            //Get y-token price for underlying coin
            uint256 yPrice = IYERC20(yCoin).getPricePerFullShare();

            //Re-calculate available stablecoins balance by y-tokens shares
            balances[i] = yPrice.mul(yShares).div(1e18);
        }
    }

    /**
     * @notice Balances of stablecoins available for withdraw normalized to 18 decimals
     */
    function normalizedBalance() public view returns(uint256) {
        address[4] memory stablecoins = ICurveFi_DepositY(curveFi_Deposit).underlying_coins();
        uint256[4] memory balances = balanceOfAll();

        uint256 summ;
        for (uint256 i=0; i < stablecoins.length; i++){
            summ = summ.add(normalize(stablecoins[i], balances[i]));
        }
        return summ;
    }

    /**
     * @notice Util to normalize balance up to 18 decimals
     */
    function normalize(address coin, uint256 amount) internal view returns(uint256) {
        uint8 decimals = ERC20Detailed(coin).decimals();
        if (decimals == 18) {
            return amount;
        } else if (decimals > 18) {
            return amount.div(uint256(10)**(decimals-18));
        } else if (decimals < 18) {
            return amount.mul(uint256(10)**(18 - decimals));
        }
    }
}