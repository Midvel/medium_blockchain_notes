require("regenerator-runtime/runtime");
const suite = require('token-test-suite/lib/suite');
const UniqueTokenMintable = artifacts.require('UniqueTokenMintable');

contract('UniqueTokenMintable', function (accounts) {
	let options = {
		// accounts to test with, accounts[0] being the contract owner
		accounts: accounts,

		// factory method to create new token contract
		create: async function () {
			return await UniqueTokenMintable.new(accounts[0], "10000000000000000000000");
		},

		// factory callbacks to mint the tokens
		// use "transfer" instead of "mint" for non-mintable tokens
        mint: async function (token, to, amount) {
			await token.mint(amount, { from: accounts[0] });
			return await token.transfer(to, amount, { from: accounts[0] });
		},

		// optional:
		// also test the increaseApproval/decreaseApproval methods (not part of the ERC-20 standard)
		increaseDecreaseApproval: false,

		// token info to test
		name: 'UniqueTokenMintable',
		symbol: 'UNQM',
		decimals: 18,

		// initial state to test
		initialSupply: "10000000000000000000000",
		initialBalances: [
            [accounts[0], "10000000000000000000000"]
		],
//		initialAllowances: [
//			[accounts[0], accounts[1], 0]
//		]
	};

	suite(options);
});