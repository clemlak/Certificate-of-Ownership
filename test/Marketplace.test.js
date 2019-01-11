/* eslint-env node, mocha */
/* global artifacts, contract, it, assert */

/**
 * TODO: Create an external file to store all the small functions and data
 */

const DummyToken = artifacts.require('DummyToken');
const COO = artifacts.require('COO');
const Marketplace = artifacts.require('Marketplace');

let dummyTokenInstance;
let cooInstance;
let marketplaceInstance;

const testCertificate = {
  assetId: 0,
  name: 'Name',
  label: 'Label',
  price: 200,
  timestamp: Math.round(Date.now() / 1000),
  factomEntryHash: 'FactomEntryHash',
  anotherEncryptionKey: 'AnotherEncryptionKey',
};

const randomData = ['randomData'];

function getFutureDate(hours) {
  return Math.round(Date.now() / 1000) + (hours * 60 * 60);
}

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

  it('Should transfer some tokens to account 2', () => dummyTokenInstance.transfer(accounts[2], 10, {
    from: accounts[0],
  }));

  it('Should check the address of the COO in the Marketplace contract', () => marketplaceInstance.cooContractAddress()
    .then((cooContractAddress) => {
      assert.equal(cooInstance.address, cooContractAddress, 'Coo contract address is wrong');
    }));

  it('Should create a new certificate from account 1', () => cooInstance.createCertificate(testCertificate, {
    from: accounts[1],
  }));

  it('Should allow the marketplace contract to manipulate certificate 0', () => cooInstance.approve(marketplaceInstance.address, 0, {
    from: accounts[1],
  }));

  it('Should create a new order for certificate 0', () => marketplaceInstance.createOrder(
    0,
    10,
    getFutureDate(2), {
      from: accounts[1],
    },
  ));

  it('Should allow marketplace contract to manipulate account 2 funds', () => dummyTokenInstance.approve(marketplaceInstance.address, 10, {
    from: accounts[2],
  }));

  it('Should execute order 0', () => marketplaceInstance.executeOrder(0, {
    from: accounts[2],
  }));
});
