'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Tempo = function () {
  function Tempo(web3) {
    var _this = this;

    _classCallCheck(this, Tempo);

    this.web3 = web3;
    this.currentBlock = 0;
    return this._determineApiSupport().then(this._getCurrentBlock()).then(function () {
      return _this;
    });
  }

  _createClass(Tempo, [{
    key: '_determineApiSupport',
    value: function _determineApiSupport() {
      var _this2 = this;

      return new Promise(function (resolve) {
        _this2.web3.version.getNode(function (err, node) {
          _this2.testRpcApi = node.includes('TestRPC');
          resolve();
        });
      });
    }
  }, {
    key: '_getCurrentBlock',
    value: function _getCurrentBlock() {
      var _this3 = this;

      return new Promise(function (resolve) {
        _this3.web3.eth.getBlock('latest', function (e, block) {
          _this3.currentBlock = block.number;
          _this3.currentTimestamp = block.timestamp;
          resolve();
        });
      });
    }

    // TestRPC Specific

  }, {
    key: '_sendRpc',
    value: function _sendRpc(method, params) {
      var _this4 = this;

      return new Promise(function (resolve) {
        _this4.web3.currentProvider.sendAsync({
          jsonrpc: '2.0',
          method: method,
          params: params || [],
          id: new Date().getTime()
        }, function (err, res) {
          resolve(res);
        });
      });
    }
  }, {
    key: '_testRpcWaitForBlockNumber',
    value: function _testRpcWaitForBlockNumber(targetBlock, secondsToJump) {
      var _this5 = this;

      var logBlock = function logBlock(n) {
        var secondsText = !secondsToJump ? '' : ', fast forward ' + secondsToJump + ' seconds';
        process.stdout.write('\uD83D\uDE80  warped to block ' + n + secondsText + '\n');
      };
      var realTargetBlock = secondsToJump ? targetBlock - 1 : targetBlock;
      return new Promise(function (resolve) {
        var asyncIterator = function asyncIterator() {
          // minus one block if we have seoncds to jump as we mine again once afterwards
          if (_this5.currentBlock >= realTargetBlock) {
            if (!secondsToJump) {
              logBlock(_this5.currentBlock);
              return resolve();
            }
            logBlock(_this5.currentBlock + 1);
            return _this5._sendRpc('evm_increaseTime', [secondsToJump]).then(function () {
              return _this5._sendRpc('evm_mine');
            }).then(function () {
              return _this5._getCurrentBlock();
            }).then(function () {
              return resolve();
            });
          }
          return _this5._sendRpc('evm_mine').then(function () {
            return _this5._getCurrentBlock();
          }).then(asyncIterator);
        };
        asyncIterator();
      });
    }
  }, {
    key: '_gethWaitForBlockNumber',
    value: function _gethWaitForBlockNumber(targetBlock) {
      var _this6 = this;

      return new Promise(function (resolve) {
        var resolved = false;
        // start mining until we reach the target block...
        return _this6._sendRpc('miner_start', [3]).then(function () {
          // start checking to see if the last block is our block...
          var filter = _this6.web3.eth.filter('latest');
          filter.watch(function () {
            _this6._getCurrentBlock().then(function () {
              if (_this6.currentBlock >= targetBlock && !resolved) {
                process.stdout.write('\u26CF  reached block ' + _this6.currentBlock + '\n');
                resolved = true;
                filter.stopWatching();
                _this6._sendRpc('miner_stop').then(function () {
                  return resolve();
                });
              }
            });
          });
        });
      });
    }

    // Public API

  }, {
    key: 'waitForBlocks',
    value: function waitForBlocks(blocksToWait, secondsToJump) {
      var _this7 = this;

      return new Promise(function (resolve) {
        _this7._getCurrentBlock().then(function () {
          resolve(_this7.currentBlock + blocksToWait);
        });
      }).then(function (targetBlock) {
        return _this7.waitUntilBlock(targetBlock, secondsToJump);
      });
    }
  }, {
    key: 'waitUntilBlock',
    value: function waitUntilBlock(targetBlock, secondsToJump) {
      if (this.testRpcApi) {
        return this._testRpcWaitForBlockNumber(targetBlock, secondsToJump);
      }
      return this._gethWaitForBlockNumber(targetBlock);
    }

    // TODO implement snapshots

  }, {
    key: 'snapshot',
    value: function snapshot() {}
  }, {
    key: 'restore',
    value: function restore() {}

    // TODO events listener for polling for block info?

  }]);

  return Tempo;
}();

exports.default = Tempo;