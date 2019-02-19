/* eslint-env mocha */
/* global artifacts, contract, assert, web3 */

const MetaCOO = artifacts.require('MetaCOO');
const DummyToken = artifacts.require('DummyToken');

let coo;
let token;

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
const userPrivateKey = '0x812d4e3746e5768e2c2f24379cafe094c72b13927a33023eb29d05cc31951eca';
const userAddress = '0x58fe7AedD6eF874E4D6ca3Ab87393e47EefA524C';

contract('MetaCOO', (accounts) => {
  it('Should deploy an instance of the DummyToken contract', () => DummyToken.deployed()
    .then((instance) => {
      token = instance;
    }));

  it('Should deploy an instance of the MetaCOO contract', () => MetaCOO.deployed(token.address)
    .then((instance) => {
      coo = instance;
    }));

  it('Should get some free Dummy Tokens', () => token.claimFreeTokens(
    web3.utils.toWei('100'), {
      from: accounts[1],
    },
  ));

  it('Should give COO contract the allowance', () => token.approve(
    coo.address,
    web3.utils.toWei('100'), {
      from: accounts[1],
    },
  ));

  it('Should check the nonce for account 1', () => coo.nonces(accounts[1])
    .then((res) => {
      assert.equal(res.toNumber(), 0, 'Account 1 nonce is wrong');
      nonce = res;
    }));

  it('Should get the metaCreateCertificate hash', () => coo.metaCreateCertificateHash(
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
        coo.address,
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

  it('Should check the signer of the hash', () => coo.getSigner(
    hash,
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
  )
    .then((res) => {
      assert.equal(res, userAddress, 'Signer is wrong');
    }));

  it('Should create a new certificate using metaCreateCertificate', () => coo.metaCreateCertificate(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    testCertificate,
    nonce,
  ));

  it('Should check user balance', () => coo.balanceOf(userAddress)
    .then((balance) => {
      assert.equal(balance.toNumber(), 1, 'User balance is wrong');
    }));

  it('Should get the metaUpdateCertificate hash', () => coo.metaUpdateCertificateHash(
    0,
    testCertificate.name,
    testCertificate.label,
    testCertificate.price,
    testCertificate.factomEntryHash,
    testCertificate.anotherEncryptionKey,
    testCertificate.data,
    nonce + 1,
  )
    .then((res) => {
      const metaHash = web3.utils.soliditySha3(
        coo.address,
        'metaUpdateCertificate',
        0,
        testCertificate.name,
        testCertificate.label,
        testCertificate.price,
        testCertificate.factomEntryHash,
        testCertificate.anotherEncryptionKey,
        testCertificate.data,
        nonce + 1,
      );

      assert.equal(res, metaHash, 'Hash is wrong');
      hash = res;
    }));

  it('Should update certificate 0 using metaUpdateCertificate', () => coo.metaUpdateCertificate(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    0,
    testCertificate.name,
    testCertificate.label,
    testCertificate.price,
    testCertificate.factomEntryHash,
    testCertificate.anotherEncryptionKey,
    testCertificate.data,
    nonce + 1,
  ));

  it('Should get the metaTransfer hash', () => coo.metaTransferHash(
    accounts[1],
    0,
    nonce + 2,
  )
    .then((res) => {
      const metaHash = web3.utils.soliditySha3(
        coo.address,
        'metaTransfer',
        accounts[1],
        0,
        nonce + 2,
      );

      assert.equal(res, metaHash, 'Hash is wrong');
      hash = res;
    }));

  it('Should transfer a token using metaTransfer', () => coo.metaTransfer(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    accounts[1],
    0,
    nonce + 2,
  ));

  it('Should check the new owner of token 0', () => coo.ownerOf(0)
    .then((owner) => {
      assert.equal(owner, accounts[1], 'Token 0 owner is wrong');
    }));

  it('Should get the metaSetApprovalForAll hash', () => coo.metaSetApprovalForAllHash(
    accounts[2],
    true,
    nonce + 3,
  )
    .then((res) => {
      const metaHash = web3.utils.soliditySha3(
        coo.address,
        'metaSetApprovalForAll',
        accounts[2],
        true,
        nonce + 3,
      );

      assert.equal(res, metaHash, 'Hash is wrong');
      hash = res;
    }));

  it('Should set an approval for all using metaSetApprovalForAll', () => coo.metaSetApprovalForAll(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    accounts[2],
    true,
    nonce + 3,
  ));

  it('Should check if account 2 is approved for all the tokens of the user', () => coo.isApprovedForAll(
    userAddress,
    accounts[2],
  )
    .then((res) => {
      assert.equal(res, true, 'Allowance is wrong');
    }));
});
