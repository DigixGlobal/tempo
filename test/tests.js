/* eslint-env mocha */
/* eslint-disable no-console, no-unused-expressions, prefer-arrow-callback, func-names */

import Web3 from 'web3';
import TestRPC from 'ethereumjs-testrpc';
import { expect } from 'chai';

import Tempo from '../src';


describe('tempo', function () {
  const web3 = new Web3();
  let tempo;

  function testSuite(usingTestRpc) {
    function testBlockNumber(targetBlock) {
      return new Promise((resolve) => {
        web3.eth.getBlockNumber((e, blockNumber) => {
          if (usingTestRpc) {
            // testRPC should return exact block numbers
            if (targetBlock) { expect(tempo.currentBlock).to.equal(targetBlock); }
            expect(tempo.currentBlock).to.equal(blockNumber);
          } else {
            // wiggle room for network latency
            if (targetBlock) { expect(tempo.currentBlock).to.be.at.least(targetBlock); }
            expect(tempo.currentBlock).to.be.at.least(blockNumber);
            if (targetBlock) { expect(tempo.currentBlock).to.be.at.most(targetBlock + 2); }
            expect(tempo.currentBlock).to.be.at.most(blockNumber + 2);
          }
          resolve();
        });
      });
    }

    it('instantiates with web3', function () {
      expect(tempo).to.be.an('object');
      expect(tempo.web3).to.be.an.instanceof(Web3);
    });

    it('detects that the TestRPC API is supported', function () {
      expect(tempo.testRpcApi).to.be[usingTestRpc ? 'true' : 'false'];
    });

    describe('blockNumber', function () {
      it('intializes with the correct block number', function (done) {
        testBlockNumber().then(done);
      });
    });

    describe('traversal methods', function () {
      const secondsExtra = 1337;
      let targetBlock;
      let initialTimestamp;

      function traversalSuite() {
        it('should mine forwards to the correct block', function (done) {
          testBlockNumber(targetBlock).then(done);
        });

        it('should mine with the correct timestamp or fallback', function (done) {
          if (!tempo.testRpcApi) {
            return done();
          }
          return web3.eth.getBlock('latest', (err, block) => {
            const targetTimestamp = initialTimestamp + secondsExtra;
            // allow a little wiggle room
            expect(block.timestamp).to.be.at.least(targetTimestamp - 3);
            expect(block.timestamp).to.be.at.most(targetTimestamp + 1);
            done();
          });
        });
      }

      describe('waitForBlocks', function () {
        before(function (done) {
          // triggers a time reset
          tempo.waitForBlocks(1).then(function () {
            web3.eth.getBlock('latest', (err, block) => {
              const blocksToWait = Math.ceil(2 + (Math.random() * 3));
              targetBlock = block.number + blocksToWait;
              initialTimestamp = block.timestamp;
              tempo.waitForBlocks(blocksToWait, secondsExtra).then(done);
            });
          });
        });
        traversalSuite();
      });

      describe('waitUntilBlock', function () {
        before(function (done) {
          // triggers a time reset
          tempo.waitForBlocks(1).then(function () {
            web3.eth.getBlock('latest', (err, block) => {
              targetBlock = block.number + Math.ceil(2 + (Math.random() * 3));
              initialTimestamp = block.timestamp;
              tempo.waitUntilBlock(targetBlock, secondsExtra).then(done);
            });
          });
        });
        traversalSuite();
      });
    });
  }

  describe('TestRPC', function () {
    // this.timeout(1000 * 1);
    before(function (done) {
      web3.setProvider(TestRPC.provider());
      new Tempo(web3).then((tempoInstance) => {
        tempo = tempoInstance;
        done();
      });
    });
    testSuite(true);
  });

  describe('Local Node', function () {
    this.timeout(1000 * 60 * 2); // two minutes per test...
    before(function (done) {
      web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
      new Tempo(web3).then((tempoInstance) => {
        tempo = tempoInstance;
        done();
      });
    });
    testSuite();
  });
});
