require('dotenv').config();

const UniqueToken = artifacts.require("UniqueToken");
const UniqueTokenMintable = artifacts.require("UniqueTokenMintable");

module.exports = function(deployer) {
  deployer.deploy(UniqueToken, process.env.UNIQUE_TOKEN_HOLDER, process.env.UNIQUE_TOKEN_SUPPLY);
  deployer.deploy(UniqueTokenMintable, process.env.UNIQUE_TOKEN_HOLDER, process.env.UNIQUE_TOKEN_SUPPLY);
};