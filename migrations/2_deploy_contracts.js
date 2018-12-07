/* eslint-env node */
/* global artifacts */

const COO = artifacts.require('COO');

function deployContracts(deployer) {
  deployer.deploy(COO);
}

module.exports = deployContracts;
