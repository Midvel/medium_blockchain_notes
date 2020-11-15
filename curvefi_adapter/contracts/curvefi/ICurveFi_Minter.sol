pragma solidity ^0.5.12;

/** 
 * @dev Interface for Curve.Fi CRV minter contract.
 * @dev See original implementation in official repository:
 * https://github.com/curvefi/curve-dao-contracts/blob/master/contracts/Minter.vy
 */
interface ICurveFi_Minter {
    function mint(address gauge_addr) external;
    function mint_for(address gauge_addr, address _for) external;
    function minted(address _for, address gauge_addr) external view returns(uint256);

    function toggle_approve_mint(address minting_user) external;

    function token() external view returns(address);
}