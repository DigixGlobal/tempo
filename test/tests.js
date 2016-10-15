/* eslint-env mocha */
/* eslint-disable no-console, no-unused-expressions */

import Web3 from 'web3';
import TestRPC from 'ethereumjs-testrpc';
import { expect } from 'chai';

import Tempo from '../src';


describe('tempo', () => {
  const web3 = new Web3();
  let tempo;

  function testBlockNumber(targetBlock) {
    return new Promise((resolve) => {
      web3.eth.getBlockNumber((e, blockNumber) => {
        expect(tempo.currentBlock).to.equal(blockNumber);
        expect(tempo.currentBlock).to.equal(targetBlock);
        resolve();
      });
    });
  }

  function testSuite(usingTestRpc) {
    it('instantiates with web3', () => {
      expect(tempo).to.be.an('object');
      expect(tempo.web3).to.be.an.instanceof(Web3);
    });

    it('detects that the TestRPC API is supported', () => {
      expect(tempo.testRpcApi).to.be[usingTestRpc ? 'true' : 'false'];
    });

    describe('blockNumber', () => {
      it('intializes with the correct block number', () => {
        web3.eth.getBlockNumber((err, blockNumber) => {
          expect(tempo.currentBlock).to.equal(blockNumber);
        });
      });
    });

    describe('traversal methods', () => {
      const secondsExtra = 1337;
      let targetBlock;
      let initialTimestamp;

      function traversalSuite() {
        it('should mine forwards to the correct block', (done) => {
          testBlockNumber(targetBlock).then(done);
        });

        it('should mine with the correct timestamp or fallback', (done) => {
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

      describe('waitForBlocks', () => {
        before((done) => {
          // triggers a time reset
          tempo.waitForBlocks(1).then(() => {
            web3.eth.getBlock('latest', (err, block) => {
              const blocksToWait = Math.ceil(Math.random() * 30);
              targetBlock = block.number + blocksToWait;
              initialTimestamp = block.timestamp;
              tempo.waitForBlocks(blocksToWait, secondsExtra).then(() => done());
            });
          });
        });
        traversalSuite();
      });

      describe('waitUntilBlock', () => {
        before((done) => {
          // triggers a time reset
          tempo.waitForBlocks(1).then(() => {
            web3.eth.getBlock('latest', (err, block) => {
              targetBlock = block.number + Math.ceil(Math.random() * 30);
              initialTimestamp = block.timestamp;
              tempo.waitUntilBlock(targetBlock, secondsExtra).then(() => done());
            });
          });
        });
        traversalSuite();
      });
    });
  }

  describe('TestRPC', () => {
    before((done) => {
      web3.setProvider(TestRPC.provider());
      new Tempo(web3).then((tempoInstance) => {
        tempo = tempoInstance;
        done();
      });
    });
    testSuite(true);
  });

  // describe('Local Node', () => {
  //   before((done) => {
  //     web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
  //     new Tempo(web3).then((tempoInstance) => {
  //       tempo = tempoInstance;
  //       done();
  //     });
  //   });
  //   testSuite();
  // });
});
