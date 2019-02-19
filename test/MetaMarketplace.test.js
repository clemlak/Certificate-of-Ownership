/* eslint-env mocha */
/* global artifacts, contract, assert, web3 */

const DummyToken = artifacts.require('DummyToken');
const MetaCOO = artifacts.require('MetaCOO');
const MetaMarketplace = artifacts.require('MetaMarketplace');

const {
  currentTime,
  getFutureDate,
} = require('./utils');

let token;
let coo;
let marketplace;

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

const newSale = {
  certificateId: 0,
  price: 10,
  expiresAt: getFutureDate(6),
};

let cooNonce = 0;
let marketplaceNonce = 0;
let hash;
const userPrivateKey = '0x3c233843b00bfca19fefaee3ee0a7c5f645e201306088c286e3d6867a64fa36f';
const userAddress = '0xa879DE779B33327558a6647414d8591971800965';

contract('Marketplace', (accounts) => {
  it('Should deploy an instance of the DummyToken contract', () => DummyToken.deployed()
    .then((instance) => {
      token = instance;
    }));

  it('Should deploy an instance of the COO contract', () => MetaCOO.deployed(token.address)
    .then((instance) => {
      coo = instance;
    }));

  it('Should deploy an instance of the Marketplace contract', () => MetaMarketplace.new(token.address, coo.address)
    .then((instance) => {
      marketplace = instance;
    }));

  it('Should get some free Dummy Tokens from - Account 1', () => token.claimFreeTokens(
    web3.utils.toWei('100'), {
      from: accounts[1],
    },
  ));

  it('Should get some free Dummy Tokens from - Account 2', () => token.claimFreeTokens(
    web3.utils.toWei('100'), {
      from: accounts[2],
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
      cooNonce = res;
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
    cooNonce,
  )
    .then((res) => {
      hash = res;
    }));

  it('Should create a new certificate using metaCreateCertificate', () => coo.metaCreateCertificate(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    testCertificate,
    cooNonce,
  ));

  it('Should get the hash for the metaSetApprovalForAll function', () => coo.metaSetApprovalForAllHash(
    marketplace.address,
    true,
    cooNonce + 1,
  )
    .then((res) => {
      hash = res;
    }));

  it.skip('Should give the Marketplace allowance', () => coo.metaSetApprovalForAll(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    marketplace.address,
    true,
    cooNonce + 1,
  ));

  it('Should allow the marketplace contract to manipulate certificate 0', () => coo.approve(marketplace.address, 0, {
    from: accounts[1],
  }));

  it('Should get the metaCreateSaleHash', () => marketplace.metaCreateSaleHash(
    newSale.certificateId,
    newSale.price,
    newSale.expiresAt,
    marketplaceNonce,
  )
    .then((res) => {
      hash = res;
    }));

  it('Should create a new sale using metaCreateSale', () => marketplace.metaCreateSale(
    web3.eth.accounts.sign(hash, userPrivateKey).signature,
    newSale.certificateId,
    newSale.price,
    newSale.expiresAt,
    marketplaceNonce,
  ));
});
