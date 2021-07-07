# ECDSA signature testing
It is an example of testing the signature based functionality.<br>
You can find more in the [appropriate article on Medium](https://betterprogramming.pub/secure-and-test-the-contract-with-ecdsa-signature-3ff368a479a6).<br>
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
- `RINKEBY_PRIVATE_KEY` Private key for the deployment.
- `INFURA_ID`. Infura API key.

## 3. Running scripts

### Compilation
Use `$ npm run compile` to compile the smart-contracts.

### *Dev tools*

`$ npm run dev:lint` to run Solidity and JavaScript linters and check the code for stylistic bugs.

`$ npm run dev:coverage` to run the unit-tests coverage utility.

`$ npm run dev:contract-size` to run the compiled contracts size check.

`$ npm run ganache` to start a local Ganache node.

### Testing

Run `$ npm run ganache` to start the Ganache development network. Perform tests with `$ npm run test` to run all tests from the `test/` directory.

### Deployment
Before proceeding with the deployment process, make sure you have set up the `.env` file.

Run migration with testnet/mainnet name to deploy the smart-contracts.
