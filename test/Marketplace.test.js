/* eslint-env node, mocha */
/* global artifacts, contract, it, assert */

const DummyToken = artifacts.require('DummyToken');
const COO = artifacts.require('COO');
const Marketplace = artifacts.require('Marketplace');

let dummyTokenInstance;
let cooInstance;
let marketplaceInstance;

contract('Marketplace', (accounts) => {
  it('Should deploy an instance of the DummyToken contract', () => DummyToken.deployed()
    .then((contractInstance) => {
      dummyTokenInstance = contractInstance;
    }));

  it('Should deploy an instance of the COO contract', () => COO.deployed()
    .then((contractInstance) => {
      cooInstance = contractInstance;
    }));

  it('Should deploy an instance of the Marketplace contract', () => Marketplace.new(dummyTokenInstance.address, cooInstance.address)
    .then((contractInstance) => {
      marketplaceInstance = contractInstance;
    }));

  it('Should check the address of the DummyToken in the Marketplace contract', () => marketplaceInstance.tokenContractAddress()
    .then((tokenContractAddress) => {
      assert.equal(dummyTokenInstance.address, tokenContractAddress, 'Token contract address is wrong');
    }));

  it('Should check the address of the COO in the Marketplace contract', () => marketplaceInstance.cooContractAddress()
    .then((cooContractAddress) => {
      assert.equal(cooInstance.address, cooContractAddress, 'Coo contract address is wrong');
    }));
});
