# Tempo

### A tool to simplify time management in EVM Tests

The problem: there are different APIs for traversing time in tests that run against TestRPC as well as a 'regular' EVM.

Tempo provides a simple interface for 'fast-forwarding' time (mining blocks) that will transparently fallback to regular mining when TestRPC is not available.

## Install

```
npm i --save-dev @digix/tempo
```

## Usage

```javascript
// pass web3 instance to tempo
const tempo = new Tempo(web3);

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

## Tests

`npm run test`

## License

MIT 2016
