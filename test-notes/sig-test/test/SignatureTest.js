const Web3 = require('web3');
const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
const { expect } = require('chai');
const BigNumber = require('bignumber.js');
const {constants} = require('openzeppelin-test-helpers');
const { ethers } = require("ethers");
const truffleAssert = require('truffle-assertions');

/*eslint-disable no-undef*/
const SigTest=artifacts.require('SigTest')

BigNumber.config({ EXPONENTIAL_AT: 1e+9 })

contract('Signature test', async () => {
    let sigInstance;
  
    let contractOwner, user1, user2, refUser;
    let mesSigned;
  
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  
    before(async () => {
        [contractOwner, user1, user2] = await web3.eth.getAccounts();

        //Create new account
        refUser = await web3.eth.accounts.create();
    
        sigInstance = await SigTest.new();
    });

    describe('Common interface', async () => {
        it('Operator set/remove', async () => {
            expect(await sigInstance.isOperator(contractOwner), "Should be operator").to.be.true;
            expect(await sigInstance.isOperator(user1), "Should not be operator").to.be.false;

            await truffleAssert.reverts(
                sigInstance.setOperator(user1, {from: user1})
            );
            await truffleAssert.reverts(
                sigInstance.removeOperator(contractOwner, {from: user1})
            );

            await truffleAssert.reverts(
                sigInstance.setOperator(ZERO_ADDRESS), "Null address provided"
            );
            await truffleAssert.reverts(
                sigInstance.removeOperator(ZERO_ADDRESS), "Null address provided"
            );

            await sigInstance.setOperator(user1, {from: contractOwner});
            expect(await sigInstance.isOperator(user1), "Should be operator").to.be.true;
            await sigInstance.removeOperator(user1, {from: contractOwner});
            expect(await sigInstance.isOperator(user1), "Should not be operator").to.be.false;

        });
    });
    

    describe('Signature test', async () => {
        it('No signature before testing', async () => {
            expect(await sigInstance.hasSignature(user1), "Should not have signature yet").to.be.false;
            expect(await sigInstance.signatures(user1), "Should not have stored signature").to.equal(ZERO_ADDRESS);
        });

        it('Signature generated', async () => {
            // Generate signature
            let mes = await sigInstance.formMessage(refUser.address, user1, {from: refUser.address})
            let mesGenerated = 
              ethers.utils.solidityKeccak256(
                  ['bytes'],
                  [
                      ethers.utils.solidityPack(
                          ['address', 'address'],
                          [refUser.address, user1]
                      )
                  ]
              )

            expect(mes.toString(), "Wrong signature").to.equal(mesGenerated.toString())

            mesSigned = refUser.sign(mesGenerated)
        });

        it('Process signature', async () => {
            expect(await sigInstance.hasSignature(user1), "Should not have signature yet").to.be.false;
            expect(await sigInstance.signatures(user1), "Should not have stored signature").to.equal(ZERO_ADDRESS);

            await truffleAssert.passes(
                sigInstance.processSignature(refUser.address, user1, mesSigned.signature.toString())
            );

            expect(await sigInstance.hasSignature(user1), "Should not have signature yet").to.be.true;
            expect(await sigInstance.signatures(user1), "Should not have stored signature").to.equal(refUser.address);
        });

        it('Rejects incorrect signatures', async () => {
            expect(await sigInstance.hasSignature(user1), "Should not have signature yet").to.be.true;
            expect(await sigInstance.signatures(user1), "Should not have stored signature").to.equal(refUser.address);

            await truffleAssert.reverts(
                sigInstance.processSignature(contractOwner, user2, mesSigned.signature.toString()), "Invalid signature provided"
            )

            await truffleAssert.reverts(
                sigInstance.processSignature(contractOwner, user2, mesSigned.signature.toString().slice(0, 20)), "invalid signature length"
            )

        });

    });
});