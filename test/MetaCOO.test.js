/* eslint-env mocha */
/* global artifacts, contract, assert, web3 */

const MetaCOO = artifacts.require('MetaCOO');

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
  data: 'randomDataHash',
};

let nonce;
let hash;
const userPrivateKey = '0xf4d00425a07a0622be6ada32277219d90f0e245536c9ef0b889f13478853268f';
const userAddress = '0xc1fF78550D830Ce2D2e320312f0d542381398E5e';

contract('MetaCOO', (accounts) => {
  it('Should deploy an instance of the MetaCOO contract', () => MetaCOO.deployed()
    .then((contractInstance) => {
      instance = contractInstance;
    }));

  it('Should check the nonce for account 1', () => instance.nonces(accounts[1])
    .then((res) => {
      assert.equal(res.toNumber(), 0, 'Account 1 nonce is wrong');
      nonce = res;
    }));

  it('Should get the metaCreateCertificate hash', () => instance.metaCreateCertificateHash(
    testCertificate.assetId,
    testCertificate.name,
    testCertificate.label,
    testCertificate.price,
    testCertificate.timestamp,
    testCertificate.factomEntryHash,
    testCertificate.anotherEncryptionKey,
    testCertificate.data,
    nonce,
  )
    .then((res) => {
      const metaHash = web3.utils.soliditySha3(
        instance.address,
        'metaCreateCertificate',
        testCertificate.assetId,
        testCertificate.name,
        testCertificate.label,
        testCertificate.price,
        testCertificate.timestamp,
        testCertificate.factomEntryHash,
        testCertificate.anotherEncryptionKey,
        testCertificate.data,
        nonce,
      );

      assert.equal(res, metaHash, 'Hash is wrong');
      hash = res;
    }));

  it('Should check the signer of the hash', () => instance.getSigner(
    hash,
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
  )
    .then((res) => {
      assert.equal(res, userAddress, 'Signer is wrong');
    }));

  it('Should create a new certificate using metaCreateCertificate', () => instance.metaCreateCertificate(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    testCertificate,
    nonce,
  ));

  it('Should check user balance', () => instance.balanceOf(userAddress)
    .then((balance) => {
      assert.equal(balance.toNumber(), 1, 'User balance is wrong');
    }));

  it('Should get the metaTransfer hash', () => instance.metaTransferHash(
    accounts[1],
    0,
    nonce + 1,
  )
    .then((res) => {
      const metaHash = web3.utils.soliditySha3(
        instance.address,
        'metaTransfer',
        accounts[1],
        0,
        nonce + 1,
      );

      assert.equal(res, metaHash, 'Hash is wrong');
      hash = res;
    }));

  it('Should transfer a token using metaTransfer', () => instance.metaTransfer(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    accounts[1],
    0,
    nonce + 1,
  ));

  it('Should check the new owner of token 0', () => instance.ownerOf(0)
    .then((owner) => {
      assert.equal(owner, accounts[1], 'Token 0 owner is wrong');
    }));

  it('Should get the metaSetApprovalForAll hash', () => instance.metaSetApprovalForAllHash(
    accounts[2],
    true,
    nonce + 2,
  )
    .then((res) => {
      const metaHash = web3.utils.soliditySha3(
        instance.address,
        'metaSetApprovalForAll',
        accounts[2],
        true,
        nonce + 2,
      );

      assert.equal(res, metaHash, 'Hash is wrong');
      hash = res;
    }));

  it('Should set an approval for all using metaSetApprovalForAll', () => instance.metaSetApprovalForAll(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    accounts[2],
    true,
    nonce + 2,
  ));

  it('Should check if account 2 is approved for all the tokens of the user', () => instance.isApprovedForAll(
    userAddress,
    accounts[2],
  )
    .then((res) => {
      assert.equal(res, true, 'Allowance is wrong');
    }));
});
