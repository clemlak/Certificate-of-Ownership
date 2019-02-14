/* eslint-env mocha */
/* global artifacts, contract, assert */

const MetaCOO = artifacts.require('MetaCOO');

let instance;

contract('MetaCOO', (accounts) => {
  it('Should deploy an instance of the MetaCOO contract', () => MetaCOO.deployed()
    .then((contractInstance) => {
      instance = contractInstance;
    }));
});
