# CurveFi integration
It is an example of integration of payment channel to CurveFi Y-pool into you defi application.<br>
You can find more in the [appropriate article on Medium](https://medium.com/better-programming/how-to-integrate-the-curve-fi-protocol-into-your-defi-protocol-e1d4c43f716d).<br>
All stubs for Curve.Fi smart-contracts are written over their Vyper implementations in official Curve.Fi repositories: [contracts](https://github.com/curvefi/curve-contract) and [DAO contracts](https://github.com/curvefi/curve-dao-contracts).<br>
Contracts are written in demostration purposes only so are potentially unsafe. Use them as references and test examples only.

## Prerequisites

For development purposes, you will need `Node.js` and a package manager – `npm`. For the development, the following versions were used:
- `Node.js` – v12.18.3
- `npm` – 6.14.6

## 1. Installation

Run the command `$ npm install` to install all the dependencies specified in `package.json`.

## 2. Configuration
#### `.env`

For the deployment process to be successfully performed, **manually created** `.env` file with filled-in parameters should be present at the root of the project. You need the following to be filled:

**Dev settings**
- `DEV_MNEMONIC` Private key for the deployment.
- `INFURA_ID`. Infura API key.
- `GAS_PRICE`. Set the gas price for the deployment transaction.

## 3. Running scripts

### Compilation
Use `$ npm run build` to compile the smart-contracts.

### *Dev tools*

`$ npm run dev:lint` to run Solidity and JavaScript linters and check the code for stylistic bugs.

`$ npm run dev:coverage` to run the unit-tests coverage utility.

`$ npm run dev:contract-size` to run the compiled contracts size check.

`$ npm run ganache` to start a local Ganache node.

### Testing

Run `$ npm run dev:ganache` to start the Ganache development network. Perform tests with `$ npm run test` to run all tests from the `test/` directory.

### Deployment
Before proceeding with the deployment process, make sure you have set up the `.env` file.

Run `$ npm run deploy --network <network_name>` with `<network_name>` replaced with testnet/mainnet name to deploy the smart-contracts.
