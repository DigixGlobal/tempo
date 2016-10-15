import asyncWhile from 'async-while';

export default class Tempo {

  constructor(web3) {
    this.web3 = web3;
    this.currentBlock = 0;
    return this.determineApiSupport()
    .then(this.getCurrentBlock())
    .then(() => this);
  }

  // TODO events listener for updating block info

  determineApiSupport() {
    return new Promise((resolve) => {
      this.web3.version.getNode((err, node) => {
        this.testRpcApi = node.includes('TestRPC');
        resolve();
      });
    });
  }

  getCurrentBlock() {
    return new Promise((resolve) => {
      this.web3.eth.getBlock('latest', (e, block) => {
        this.currentBlock = block.number;
        this.currentTimestamp = block.timestamp;
        resolve();
      });
    });
  }

  // TestRPC Specific
  sendRpc(method, params) {
    return new Promise((resolve) => {
      this.web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method,
        params: params || [],
        id: new Date().getTime(),
      }, (err, res) => { resolve(res); });
    });
  }

  waitForBlocks(blocksToWait, secondsToJump) {
    return new Promise((resolve) => {
      this.getCurrentBlock().then(() => {
        resolve(this.currentBlock + blocksToWait);
      });
    })
    .then((targetBlock) => {
      return this.waitUntilBlock(targetBlock, secondsToJump);
    });
  }

  waitUntilBlock(targetBlock, secondsToJump) {
    if (this.testRpcApi) {
      return this.testRpcWaitForBlockNumber(targetBlock, secondsToJump);
    }
    return this.gethWaitForBlockNumber(targetBlock);
  }


  testRpcWaitForBlockNumber(targetBlock, secondsToJump) {
    const logBlock = (n) => {
      process.stdout.write(`      🚀  warped to block ${n}\n`);
    };
    const realTargetBlock = secondsToJump ? targetBlock - 1 : targetBlock;
    return new Promise((resolve) => {
      const asyncIterator = () => {
        // minus one block if we have seoncds to jump as we mine again once afterwards
        if (this.currentBlock >= realTargetBlock) {
          if (!secondsToJump) {
            logBlock(this.currentBlock);
            return resolve();
          }
          logBlock(this.currentBlock + 1);
          return this.sendRpc('evm_increaseTime', [secondsToJump])
          .then(() => this.sendRpc('evm_mine'))
          .then(() => this.getCurrentBlock())
          .then(() => resolve());
        }
        return this.sendRpc('evm_mine')
        .then(() => this.getCurrentBlock())
        .then(asyncIterator);
      };
      asyncIterator();
    });
  }

  gethWaitForBlockNumber(blockToWait) {
    return new Promise((resolve) => {
      console.log('howdy')
      resolve();
    })
  }
  // TODO implement

  snapshot() {

  }
  restore() {

  }
  // pass it a web3 object, pull the host, then return an object that controls time...
  // check for support of forward.

  // api
  // get current block
  // wait until block n
  // wait x blocks

  // TESTRPC compatible
  // set the time
  // create a snapshot
  // go to snapshot
}
