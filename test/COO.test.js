/* eslint-env mocha */
/* global artifacts, contract, assert */

/**
 * TODO: Update these tests
 */

const COO = artifacts.require('COO');

let instance;

function currentTime() {
  return Math.round(Date.now() / 1000);
}

const testCertificate = {
  assetId: 0,
  name: 'Name',
  label: 'Label',
  price: 200,
  timestamp: currentTime(),
  factomEntryHash: 'FactomEntryHash',
  anotherEncryptionKey: 'AnotherEncryptionKey',
};

const randomData = ['randomData'];

contract('COO', (accounts) => {
  it('Should deploy an instance of the COO contract', () => COO.deployed()
    .then((contractInstance) => {
      instance = contractInstance;
    }));

  it('Should create a new certificate', () => instance.createCertificate(testCertificate));

  it('Should get the information of certificate 0', () => instance.getCertificate(0)
    .then((certificate) => {
      assert.containsAllKeys(certificate, testCertificate, 'Certificate is wrong');
    }));

  it('Should NOT get the information of certificate 0', () => instance.getCertificate(0, {
    from: accounts[1],
  })
    .then(() => {
    })
    .catch((error) => {
      assert.equal(error.message.includes('revert'), true, 'A revert error was supposed to happen here');
    }));

  it('Should update certificate 0 data', () => instance.updateCertificateData(
    0,
    randomData,
  ));

  it('Should check the certificate 0 data', () => instance.getCertificateData(0)
    .then((data) => {
      assert.sameMembers(data, randomData, 'Data is wrong');
    }));

  it('Should check the owner of certificate 0', () => instance.ownerOf(0)
    .then((owner) => {
      assert.equal(owner, accounts[0], 'Owner is wrong');
    }));

  it('Should check the balance of account 0', () => instance.balanceOf(accounts[0])
    .then((balance) => {
      assert.equal(balance, 1, 'Balance is wrong');
    }));

  it('Should check the token owned by account 0 at index 0', () => instance.tokenOfOwnerByIndex(
    accounts[0],
    0,
  )
    .then((tokenId) => {
      assert.equal(tokenId, 0, 'Token id is wrong');
    }));

  it('Should transfer the certificate 0', () => instance.transferFrom(accounts[0], accounts[1], 0));

  it('Should check the owner of certificate 0', () => instance.ownerOf(0)
    .then((owner) => {
      assert.equal(owner, accounts[1], 'Owner is wrong');
    }));
});
