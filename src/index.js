export default class Tempo {

  constructor(web3) {
    this.web3 = web3;
    this.currentBlock = 0;
    return this._determineApiSupport()
    .then(this._getCurrentBlock())
    .then(() => this);
  }

  _determineApiSupport() {
    return new Promise((resolve) => {
      this.web3.version.getNode((err, node) => {
        this.testRpcApi = node.includes('TestRPC');
        resolve();
      });
    });
  }

  _getCurrentBlock() {
    return new Promise((resolve) => {
      this.web3.eth.getBlock('latest', (e, block) => {
        this.currentBlock = block.number;
        this.currentTimestamp = block.timestamp;
        resolve();
      });
    });
  }

  // TestRPC Specific
  _sendRpc(method, params) {
    return new Promise((resolve) => {
      this.web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method,
        params: params || [],
        id: new Date().getTime(),
      }, (err, res) => { resolve(res); });
    });
  }

  _testRpcWaitForBlockNumber(targetBlock, secondsToJump) {
    const logBlock = (n) => {
      const secondsText = !secondsToJump ? '' : `, fast forward ${secondsToJump} seconds`;
      // process.stdout.write(`🚀  warped to block ${n}${secondsText}\n`);
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
          return this._sendRpc('evm_increaseTime', [secondsToJump])
          .then(() => this._sendRpc('evm_mine'))
          .then(() => this._getCurrentBlock())
          .then(() => resolve());
        }
        return this._sendRpc('evm_mine')
        .then(() => this._getCurrentBlock())
        .then(asyncIterator);
      };
      asyncIterator();
    });
  }

  _gethWaitForBlockNumber(targetBlock) {
    return new Promise((resolve) => {
      let resolved = false;
      // start mining until we reach the target block...
      return this._sendRpc('miner_start', [3]).then(() => {
        // start checking to see if the last block is our block...
        const filter = this.web3.eth.filter('latest');
        filter.watch(() => {
          this._getCurrentBlock().then(() => {
            if (this.currentBlock >= targetBlock && !resolved) {
              // process.stdout.write(`⛏  reached block ${this.currentBlock}\n`);
              resolved = true;
              filter.stopWatching();
              this._sendRpc('miner_stop')
              .then(() => resolve());
            }
          });
        });
      });
    });
  }

  // Public API

  waitForBlocks(blocksToWait, secondsToJump) {
    return new Promise((resolve) => {
      this._getCurrentBlock().then(() => {
        resolve(this.currentBlock + blocksToWait);
      });
    })
    .then((targetBlock) => {
      return this.waitUntilBlock(targetBlock, secondsToJump);
    });
  }

  waitUntilBlock(targetBlock, secondsToJump) {
    if (this.testRpcApi) {
      return this._testRpcWaitForBlockNumber(targetBlock, secondsToJump);
    }
    return this._gethWaitForBlockNumber(targetBlock);
  }

  // TODO implement snapshots

  snapshot() {

  }
  restore() {

  }

  // TODO events listener for polling for block info?

}
