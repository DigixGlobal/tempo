import asyncWhile from 'async-while';

export default class Tempo {

  constructor(web3) {
    this.web3 = web3;
    this.currentBlock = 0;
    return this.determineApiSupport()
    .then(this.saveCurrentBlock())
    .then(() => this);
  }

  // TODO events listener for updating block info

  determineApiSupport() {
    return new Promise((resolve) => {
      this.web3.version.getNode((err, node) => {
        this.chronAPI = node.includes('TestRPC');
        resolve();
      });
    });
  }

  saveCurrentBlock() {
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

  waitFor(blocksToWait, dateOrSeconds) {
    if (this.chronAPI) {
      return this.waitForChron(blocksToWait, dateOrSeconds);
    }
    return this.waitForNoChron(blocksToWait);
  }

  waitForChron(blocksToWait, secondsToJump) {

    // get current blockctime
    // simply jump to the block...
    // use evm_mine in series until current block is > existing block
    return new Promise((resolve) => {
      this.saveCurrentBlock().then(() => {
        let targetBlock = this.currentBlock + blocksToWait;
        if (secondsToJump) { targetBlock -= 1; }
        resolve({ targetBlock });
      });
    }).then(({ targetBlock }) => {
      const logBlock = (n) => {
        process.stdout.write(`🚀  warped to block ${n}\n`);
      };
      return new Promise((resolve) => {
        const asyncIterator = () => {
          // minus one block if we have seoncds to jump as we mine again once afterwards
          if (this.currentBlock >= targetBlock) {
            if (!secondsToJump) {
              logBlock(this.currentBlock);
              return resolve();
            }
            logBlock(this.currentBlock + 1);
            return this.sendRpc('evm_increaseTime', [secondsToJump])
            .then(() => this.sendRpc('evm_mine'))
            .then(() => this.saveCurrentBlock())
            .then(() => resolve());
          }
          return this.sendRpc('evm_mine')
          .then(() => this.saveCurrentBlock())
          .then(asyncIterator);
        };
        asyncIterator();
      });
    });
  }

  waitForNoChron(blockToWait) {

  }

  waitUntil(targetBlock, dateOrSeconds) {
    // this.startMining()
  }

  startMining() {
    // don't do anything if we're using TestRPC, just force a block to be mined on end
  }

  stopMining() {
    // send stop mining command if we're not using TestRPC
    // force a block to be mined if we are using TestRPC
  }

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
