/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const { toHex, toWei } = require("web3-utils");
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */
  plugins: ["solidity-coverage", "truffle-contract-size"],

  networks: {
    development: {
      host: "127.0.0.1",
      gas: "6000000",
      gasPrice: toHex(toWei("1", "gwei")),
      network_id: "*",
      port: "8545",
      skipDryRun: true,
    },
    soliditycoverage: {
      host: "localhost",
      network_id: "*",
      port: "8545",
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    kovan: {
      provider: () => new HDWalletProvider(process.env.DEV_MNEMONIC, "https://kovan.infura.io/v3/" + process.env.INFURA_ID),
      networkId: 42,       // Kovan's id
      network_id: 42,
      gasPrice: process.env.GAS_PRICE,
    },
    rinkeby: {
      provider: () => new HDWalletProvider(process.env.DEV_MNEMONIC, "https://rinkeby.infura.io/v3/" + process.env.INFURA_ID),
      networkId: 4,       // Rinkeby's id
      network_id: 4,
      gasPrice: process.env.GAS_PRICE,
    },
    mainnet: {
      provider: () => new HDWalletProvider(process.env.DEV_MNEMONIC, "https://mainnet.infura.io/v3/" + process.env.INFURA_ID),
      networkId: 1,       // Mainnet's id
      network_id: 1,
      gasPrice: process.env.GAS_PRICE,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.12",
      // docker: true, 
      // settings: {
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  }
}
