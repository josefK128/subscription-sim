/*
  testSubscription
  jasmine tests for contract Subscription
*/

const Subscription = artifacts.require('Subscription');
const assert = require('jasmine').assert;
const truffleAssert = require('truffle-assertions');

contract('Subscriber', async(accounts) => {
  let subscription;
  const serviceAccount = accounts[0];
  const subscriberAccount = accounts[1];


  // set up - create contract
  beforeEach(async () => {
    subscription = await Subscription.new({from: serviceAccount});
  });

  // teardown - kill contract
  afterEach(async () => {
    await subscription.kill({from: serviceAccount});
  });


  // tests
  it('should emit event Price on subscription.callback', async () => {
    let tx = await subscription.callback(1000);
    truffleAssert.eventEmitted(tx, 'Price');
  });

  it('should emit event PriceQuery on subscription.update', async () => {
    let tx = await subscription.update();
    truffleAssert.eventEmitted(tx, 'PriceQuery');
  });
  
  it('should emit event Registered on subscription.subscribe', async () => {
    let tx = await subscription.subscribe('jack@gmail.com');
    truffleAssert.eventEmitted(tx, 'Registered');
  });
}); 
