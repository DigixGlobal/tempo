# Tempo

### A simple tool for time management in truffle testrpc tests


```javascript
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);
// wait will wait for `n` blocks; (seconds, blocks), default (20, 1)
// waitUntilBlock will wait until `n` specific block; (seconds, blockNumber)

contract('MockLibraryUser', function () {
  it('get_last_payment_date returns correct time when its not set', async function () {
    const mockLibraryUser = await MockLibraryUser.deployed();
    await mockLibraryUser.create_user(testUser);
    const lastPayment1 = await mockLibraryUser.get_last_payment_date.call(testUser);
    const timeDiff1 = new Date().getTime() - (lastPayment1.toNumber() * 1000);
    assert.ok(timeDiff1 < 1000, 'unset date isnt `now`');
    await wait();
  });
});
```

## License

MIT 2016
