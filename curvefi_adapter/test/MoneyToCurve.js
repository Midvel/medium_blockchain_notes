const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC20 = artifacts.require('Stub_ERC20');
const YERC20 = artifacts.require('Stub_YERC20');


const CurveDeposit = artifacts.require('Stub_CurveFi_DepositY');
const CurveSwap = artifacts.require('Stub_CurveFi_SwapY');
const CurveLPToken = artifacts.require('Stub_CurveFi_LPTokenY');
const CurveCRVMinter = artifacts.require('Stub_CurveFi_Minter');
const CurveGauge = artifacts.require('Stub_CurveFi_Gauge');

const MoneyToCurve = artifacts.require('MoneyToCurve');

const supplies = {
    dai: new BN('1000000000000000000000000'),
    usdc: new BN('1000000000000'),
    tusd: new BN('1000000000000'),
    usdt: new BN('1000000000000000000000000')
};

const deposits = {
    dai: new BN('100000000000000000000'), 
    usdc: new BN('200000000'), 
    tusd: new BN('300000000'), 
    usdt: new BN('400000000000000000000')
}

contract('Integrate Curve.Fi into your defi', async([ owner, defiowner, user1, user2 ]) => {
    let dai;
    let usdc;
    let tusd;
    let usdt;

    let ydai;
    let yusdc;
    let ytusd;
    let yusdt;

    let curveLPToken;
    let curveSwap;
    let curveDeposit;

    let crvToken;
    let curveMinter;
    let curveGauge;

    let moneyToCurve;

    before(async() => {
        // Prepare stablecoins stubs
        dai = await ERC20.new({ from: owner });
        await dai.methods['initialize(string,string,uint8,uint256)']('DAI', 'DAI', 18, supplies.dai, { from: owner });

        usdc = await ERC20.new({ from: owner });
        await usdc.methods['initialize(string,string,uint8,uint256)']('USDC', 'USDC', 6, supplies.usdc, { from: owner });

        tusd = await ERC20.new({ from: owner });
        await tusd.methods['initialize(string,string,uint8,uint256)']('TUSD', 'TUSD', 6, supplies.dai, { from: owner });

        usdt = await ERC20.new({ from: owner });
        await usdt.methods['initialize(string,string,uint8,uint256)']('USDT', 'USDT', 18, supplies.dai, { from: owner });

        //Prepare Y-token wrappers
        ydai = await YERC20.new({ from: owner });
        await ydai.initialize(dai.address, 'yDAI', 18, { from: owner });
        yusdc = await YERC20.new({ from: owner });
        await yusdc.initialize(usdc.address, 'yUSDC', 6,{ from: owner });
        ytusd = await YERC20.new({ from: owner });
        await ytusd.initialize(tusd.address, 'yTUSD', 6, { from: owner });
        yusdt = await YERC20.new({ from: owner });
        await yusdt.initialize(usdt.address, 'yUSDT', 18, { from: owner });


        //Prepare stubs of Curve.Fi
        curveLPToken = await CurveLPToken.new({from:owner});
        await curveLPToken.methods['initialize()']({from:owner});

        curveSwap = await CurveSwap.new({ from: owner });
        await curveSwap.initialize(
            [ydai.address, yusdc.address, ytusd.address, yusdt.address],
            [dai.address, usdc.address, tusd.address, usdt.address],
            curveLPToken.address, 10, { from: owner });
        await curveLPToken.addMinter(curveSwap.address, {from:owner});

        curveDeposit = await CurveDeposit.new({ from: owner });
        await curveDeposit.initialize(
            [ydai.address, yusdc.address, ytusd.address, yusdt.address],
            [dai.address, usdc.address, tusd.address, usdt.address],
            curveSwap.address, curveLPToken.address, { from: owner });
        await curveLPToken.addMinter(curveDeposit.address, {from:owner});

        crvToken = await ERC20.new({ from: owner });
        await crvToken.methods['initialize(string,string,uint8,uint256)']('CRV', 'CRV', 18, 0, { from: owner });

        curveMinter = await CurveCRVMinter.new({ from: owner });
        await curveMinter.initialize(crvToken.address, { from: owner });
        await crvToken.addMinter(curveMinter.address, { from: owner });

        curveGauge = await CurveGauge.new({ from: owner });
        await curveGauge.initialize(curveLPToken.address, curveMinter.address, {from:owner});
        await crvToken.addMinter(curveGauge.address, { from: owner });


        //Main contract
        moneyToCurve = await MoneyToCurve.new({from:defiowner});
        await moneyToCurve.initialize({from:defiowner});
        await moneyToCurve.setup(curveDeposit.address, curveGauge.address, curveMinter.address, {from:defiowner});

        //Preliminary balances
        await dai.transfer(user1, new BN('1000000000000000000000'), { from: owner });
        await usdc.transfer(user1, new BN('1000000000'), { from: owner });
        await tusd.transfer(user1, new BN('1000000000'), { from: owner });
        await usdt.transfer(user1, new BN('1000000000000000000000'), { from: owner });

        await dai.transfer(user2, new BN('1000000000000000000000'), { from: owner });
        await usdc.transfer(user2, new BN('1000000000'), { from: owner });
        await tusd.transfer(user2, new BN('1000000000'), { from: owner });
        await usdt.transfer(user2, new BN('1000000000000000000000'), { from: owner });
    });

    describe('Deposit your money into Curve.Fi', () => {
        it('Deposit', async() => {
            await dai.approve(moneyToCurve.address, deposits.dai, {from:user1});
            await usdc.approve(moneyToCurve.address, deposits.usdc, {from:user1});
            await tusd.approve(moneyToCurve.address, deposits.tusd, {from:user1});
            await usdt.approve(moneyToCurve.address, deposits.usdt, {from:user1});

            let daiBefore = await dai.balanceOf(user1);
            let usdcBefore = await usdc.balanceOf(user1);
            let tusdBefore = await tusd.balanceOf(user1);
            let usdtBefore = await usdt.balanceOf(user1);

            await moneyToCurve.multiStepDeposit(
                [deposits.dai, deposits.usdc, deposits.tusd, deposits.usdt], {from:user1});

                
            let daiAfter = await dai.balanceOf(user1);
            let usdcAfter = await usdc.balanceOf(user1);
            let tusdAfter = await tusd.balanceOf(user1);
            let usdtAfter = await usdt.balanceOf(user1);

            expect(daiBefore.sub(daiAfter).toString(), "Not deposited DAI").to.equal(deposits.dai.toString());
            expect(usdcBefore.sub(usdcAfter).toString(), "Not depositde USDC").to.equal(deposits.usdc.toString());
            expect(tusdBefore.sub(tusdAfter).toString(), "Not deposited TUSD").to.equal(deposits.tusd.toString());
            expect(usdtBefore.sub(usdtAfter).toString(), "Not deposited USDT").to.equal(deposits.usdt.toString());

        });

        it('Funds are wrapped with Y-tokens', async() => {
            expect((await dai.balanceOf(ydai.address)).toString(), "DAI not wrapped").to.equal(deposits.dai.toString());
            expect((await usdc.balanceOf(yusdc.address)).toString(), "USDC not wrapped").to.equal(deposits.usdc.toString());
            expect((await tusd.balanceOf(ytusd.address)).toString(), "TUSD not wrapped").to.equal(deposits.tusd.toString());
            expect((await usdt.balanceOf(yusdt.address)).toString(), "USDT not wrapped").to.equal(deposits.usdt.toString());
        });

        it('Y-tokens are deposited to Curve.Fi Swap', async() => {
            expect((await ydai.balanceOf(curveSwap.address)).toString(), "YDAI not deposited").to.equal(deposits.dai.toString());
            expect((await yusdc.balanceOf(curveSwap.address)).toString(), "YUSDC not deposited").to.equal(deposits.usdc.toString());
            expect((await ytusd.balanceOf(curveSwap.address)).toString(), "YTUSD not deposited").to.equal(deposits.tusd.toString());
            expect((await yusdt.balanceOf(curveSwap.address)).toString(), "YUSDT not deposited").to.equal(deposits.usdt.toString());
        });

        it('Curve.Fi LP-tokens are staked in Gauge', async() => {
            let lptokens = deposits.dai.add(deposits.usdc.mul(new BN('1000000000000'))).add(deposits.tusd.mul(new BN('1000000000000'))).add(deposits.usdt);
            expect((await moneyToCurve.curveLPTokenStaked()).toString(), "Stake is absent").to.equal(lptokens.toString());
            expect((await curveGauge.balanceOf(moneyToCurve.address)).toString(), "Stake is absent in Gauge").to.equal(lptokens.toString());
        });

        it('CRV tokens are minted and transfered to the user', async() => {
            expect((await crvToken.balanceOf(user1)).toNumber(), "No CRV tokens").to.be.gt(0);
        });

    });
    describe('Additional deposit to create extra liquidity', () => {
        it('Additional deposit', async() => {
            await dai.approve(moneyToCurve.address, deposits.dai, {from:user2});
            await usdc.approve(moneyToCurve.address, deposits.usdc, {from:user2});
            await tusd.approve(moneyToCurve.address, deposits.tusd, {from:user2});
            await usdt.approve(moneyToCurve.address, deposits.usdt, {from:user2});

            await moneyToCurve.multiStepDeposit(
                [deposits.dai, deposits.usdc, deposits.tusd, deposits.usdt], {from:user2});
        });
    });

    describe('Withdraw your money from Curve.Fi', () => {
        it('Withdraw', async() => {
            let daiBefore = await dai.balanceOf(user1);
            let usdcBefore = await usdc.balanceOf(user1);
            let tusdBefore = await tusd.balanceOf(user1);
            let usdtBefore = await usdt.balanceOf(user1);

            //Should left less in a pool due to comissions
            await moneyToCurve.multiStepWithdraw(
//                [new BN("10000000000000000000"), 0, 0, 0],
                [deposits.dai, deposits.usdc, deposits.tusd, deposits.usdt],
                {from:user1});
                
            let daiAfter = await dai.balanceOf(user1);
            let usdcAfter = await usdc.balanceOf(user1);
            let tusdAfter = await tusd.balanceOf(user1);
            let usdtAfter = await usdt.balanceOf(user1);

            expect(daiAfter.sub(daiBefore).toString(), "Not withdrawn DAI").to.equal(deposits.dai.toString());
            expect(usdcAfter.sub(usdcBefore).toString(), "Not withdrawn USDC").to.equal(deposits.usdc.toString());
            expect(tusdAfter.sub(tusdBefore).toString(), "Not withdrawn TUSD").to.equal(deposits.tusd.toString());
            expect(usdtAfter.sub(usdtBefore).toString(), "Not withdrawn USDT").to.equal(deposits.usdt.toString());

        });
    });
});
