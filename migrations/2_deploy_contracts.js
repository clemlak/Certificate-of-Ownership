/* eslint-env node */
/* global artifacts */

const COO = artifacts.require('COO');
const MetaCOO = artifacts.require('MetaCOO');
const DummyToken = artifacts.require('test/DummyToken');
const Marketplace = artifacts.require('Marketplace');

function deployContracts(deployer, network) {
  console.log('Deploying to network:', network);

  if (network === 'development') {
    let cooContractAddress;
    let tokenContractAddress;

    deployer.deploy(MetaCOO)
      .then(() => {
        cooContractAddress = MetaCOO.address;

        return deployer.deploy(DummyToken);
      })
      .then(() => {
        tokenContractAddress = DummyToken.address;

        return deployer.deploy(Marketplace, tokenContractAddress, cooContractAddress);
      });
  } else if (network === 'ropsten') {
    let cooContractAddress;
    let tokenContractAddress;

    deployer.deploy(COO)
      .then(() => {
        cooContractAddress = COO.address;

        return deployer.deploy(DummyToken);
      })
      .then(() => {
        tokenContractAddress = DummyToken.address;

        return deployer.deploy(Marketplace, tokenContractAddress, cooContractAddress);
      });
  }
}

module.exports = deployContracts;
