# Tempo

### A tool to simplify time management in EVM Tests

The problem: there are different APIs for traversing time in tests that run against `testrpc` as well as a 'regular' EVM.

Tempo provides a simple interface for 'fast-forwarding' time (mining blocks) that will transparently fallback to regular mining when TestRPC is not available.

An example of a non-TestRPC chain would be a local `geth` instance in `--dev` mode. You could start *that* up with something like this:

```
geth --dev --rpc --rpcapi="eth,miner,web3" --rpccorsdomain "*" --maxpeers 0 --nodiscover
```

## Install

```
npm i --save-dev @digix/tempo
```

## Usage

```javascript
// pass web3 instance to tempo, it will auto-detect whether you're using TestRPC or not
new Tempo(web3).then((tempo) => {
    // now you can use `tempo`
});

// API for both TestRPC and regular RPC
tempo.waitForBlocks(n).then(() => { // mine for x number of blocks from now
  doSomeCoolStuff();
});
const myPromise = tempo.waitUntilBlock(n); // mine until we hit this block number

tempo.currentBlock; // returns latest block, inaccurate if blocks not controlled only by tempo
// TODO make the above always accurate by adding a `filter.watch`

// API for TestRPC only, which provides a second param
// `seconds`; set the amount of time in the future (from now) to make the next block
tempo.waitForBlocks(n, seconds);
tempo.waitUntilBlock(n, seconds);

// TODO implement snapshots
tempo.snapshot('snapshotId');
tempo.restore('snapshotId');

```

## Example

```javascript
describe('feeDays', function () {
  // set the 'now' using tempo...
  it('calculates the correct number of fee days', function () {
    const numberOfDays = randomInt(12, 40);
    const numberOfSeconds = numberOfDays * 60 * 60 * 24;
    let beforeTime;
    tempo.waitForBlocks(1) // reset the time
    .then(() => {
      beforeTime = tempo.currentTimestamp;
      // check the current time is fine...
      return digixMath.feeDays.call(beforeTime);
    }).then((res) => {
      assert.equal(0, res.toNumber());
      // zoom a few days into the future
      return tempo.waitForBlocks(1, numberOfSeconds);
    })
    .then(() => digixMath.feeDays.call(beforeTime))
    .then((res) => assert.equal(numberOfDays, res.toNumber()));
  });
});
```

## Tests

`npm run test`

## License

MIT 2016
