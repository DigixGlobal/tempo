/* eslint-env mocha */
/* eslint-disable no-console, no-unused-expressions */

import Web3 from 'web3';
import TestRPC from 'ethereumjs-testrpc';
import { expect } from 'chai';

import Tempo from '../src';

describe('TestRPC', () => {
  let web3;
  let tempo;
  before((done) => {
    web3 = new Web3;
    // web3.setProvider(TestRPC.provider());
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
    new Tempo(web3).then((tempoInstance) => {
      tempo = tempoInstance;
      done();
    });
  });

  function testBlockNumber(targetBlock) {
    return new Promise((resolve) => {
      web3.eth.getBlockNumber((e, blockNumber) => {
        expect(tempo.currentBlock).to.equal(blockNumber);
        expect(tempo.currentBlock).to.equal(targetBlock);
        resolve();
      });
    });
  }

  it('it should instantiate with web3', () => {
    expect(tempo).to.be.an('object');
    expect(tempo.web3).to.be.an.instanceof(Web3);
  });

  it('should have detected that the chron api is supported', () => {
    expect(tempo.chronAPI).to.be.true;
  });

  describe('blockNumber', () => {
    it('boots up with the correct block number', () => {
      web3.eth.getBlockNumber((err, blockNumber) => {
        expect(tempo.currentBlock).to.equal(blockNumber);
      });
    });
  });

  describe('toBlock', () => {
    const blocksToWaitFor = 30;
    const secondsExtra = 1337;
    let targetBlock;
    let initialTimestamp;
    before((done) => {
      // triggers a time reset
      tempo.waitFor(1).then(() => {
        web3.eth.getBlock('latest', (err, block) => {
          targetBlock = block.number + blocksToWaitFor;
          initialTimestamp = block.timestamp;
          tempo.waitFor(blocksToWaitFor, secondsExtra).then(() => done());
        });
      });
    });

    it('should mine forwards to the correct block', (done) => {
      testBlockNumber(targetBlock).then(done);
    });

    it('should mine with the correct timestamp', (done) => {
      web3.eth.getBlock('latest', (err, block) => {
        const targetTimestamp = initialTimestamp + secondsExtra;
        expect(block.timestamp).to.be.at.least(targetTimestamp - 3);
        expect(block.timestamp).to.be.at.most(targetTimestamp);
        done();
      });
    });
  });
});
