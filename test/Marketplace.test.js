/* eslint-env mocha */
/* global artifacts, contract, assert */

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

  it('Should transfer some tokens to account 3', () => dummyTokenInstance.transfer(accounts[3], 10, {
    from: accounts[0],
  }));

  it('Should transfer some tokens to account 4', () => dummyTokenInstance.transfer(accounts[4], 20, {
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

  it('Should create a new order for certificate 0', () => marketplaceInstance.createSale(
    0,
    10,
    getFutureDate(2), {
      from: accounts[1],
    },
  ));

  it('Should allow marketplace contract to manipulate account 2 funds', () => dummyTokenInstance.approve(marketplaceInstance.address, 10, {
    from: accounts[2],
  }));

  it('Should execute order 0', () => marketplaceInstance.executeSale(0, {
    from: accounts[2],
  }));

  it('Should check the owner of certificate 0', () => cooInstance.ownerOf(0)
    .then((owner) => {
      assert.equal(owner, accounts[2], 'Owner is wrong');
    }));

  it('Should create another new certificate from account 1', () => cooInstance.createCertificate(testCertificate, {
    from: accounts[1],
  }));

  it('Should allow the marketplace contract to manipulate certificate 1', () => cooInstance.approve(marketplaceInstance.address, 1, {
    from: accounts[1],
  }));

  it('Should create a new auction for certificate 1', () => marketplaceInstance.createAuction(
    1,
    10,
    getFutureDate(1), {
      from: accounts[1],
    },
  ));

  it('Should allow marketplace contract to manipulate account 3 funds', () => dummyTokenInstance.approve(marketplaceInstance.address, 10, {
    from: accounts[3],
  }));

  it('Should allow marketplace contract to manipulate account 4 funds', () => dummyTokenInstance.approve(marketplaceInstance.address, 20, {
    from: accounts[4],
  }));

  it('Should execute auction 0', () => marketplaceInstance.executeAuction(0, 10, {
    from: accounts[3],
  }));

  it('Should execute auction 0', () => marketplaceInstance.executeAuction(0, 20, {
    from: accounts[4],
  }));

  it('Should time travel 3 hours', () => {
    const jsonrpc = '2.0';
    const id = 0;
    const method = 'evm_increaseTime';

    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc,
        method,
        params: [3 * 60 * 60],
        id,
      }, (err, result) => {
        if (err) { return reject(err); }
        return resolve(result);
      });
    });
  });

  it('Should complete the auction 0', () => marketplaceInstance.completeAuction(0, {
    from: accounts[4],
  }));

  it('Should check the owner of certificate 1', () => cooInstance.ownerOf(1)
    .then((owner) => {
      assert.equal(owner, accounts[4], 'Owner is wrong');
    }));
});
