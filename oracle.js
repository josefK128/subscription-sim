var fetch = require('fetch')
var OracleContract = require('./build/contracts/Subscription.json')
var contract = require('truffle-contract')

var Web3 = require('web3');
//var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
var prev_price = 0;


// Truffle abstraction to interact with our
// deployed contract
var oracleContract = contract(OracleContract)
oracleContract.setProvider(web3.currentProvider)

// Dirty hack for web3@1.0.0 support for localhost testrpc
// see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof oracleContract.currentProvider.sendAsync !== "function") {
  oracleContract.currentProvider.sendAsync = function() {
    return oracleContract.currentProvider.send.apply(
      oracleContract.currentProvider, arguments
    );
  };
}

// Get accounts from web3
web3.eth.getAccounts((err, accounts) => {
  oracleContract.deployed()
  .then((oracleInstance) => {

    // schedule 60-second priceETHUDS update in subscription contract
    setInterval(() => {
        console.log(`\noracle updating current priceETHUSD for Subscription contract`);
        //oracleInstance.update({from: accounts[0]})  // Request oracle to update the information
        fetch.fetchUrl('https://api.coinmarketcap.com/v1/global/', (err, m, b) => {
          const cmcJson = JSON.parse(b.toString())
          const btcMarketCap = parseInt(cmcJson.total_market_cap_usd)
          console.log(`oracle reads priceETHUSD = ${btcMarketCap}`);

          // Send data back contract on-chain
          oracleInstance.callback(btcMarketCap, {from: accounts[0]})
      })
    }, 60000);

    // Watch event and respond to event PriceQuery with callback  
    oracleInstance.PriceQuery()
    .watch((err, event) => {
      console.log(`\noracle receives event PriceQuery!`);
      // Fetch data
      // and update it into the contract
      fetch.fetchUrl('https://api.coinmarketcap.com/v1/global/', (err, m, b) => {
        const cmcJson = JSON.parse(b.toString())
        const btcMarketCap = parseInt(cmcJson.total_market_cap_usd)
        console.log(`oracle reads priceETHUSD = ${btcMarketCap}`);

        // Send data back contract on-chain
        oracleInstance.callback(btcMarketCap, {from: accounts[0]})
      })
    })

    // Watch event Price and display current price
    oracleInstance.Price()
    .watch((err, event) => {
      let b = (event.args.price - prev_price);
      if(b !== 0){
        console.log(`\noracle receives event Price! priceETHUSD = ${event.args.price}`);
        prev_price = event.args.price;
      }  
    })

    // Watch event and respond to event Registered and begin reminder tracking 
    oracleInstance.Registered()
    .watch((err, event) => {
      //let subscriber = event.args.subscriber;
      let email = event.args.email;
      let priceETHUSD = event.args.priceETHUSD;
      let blockNumber = event.args.blockNumber;
      let blockTimestamp = event.args.blockTimestamp;
      //console.log(`subscriber = ${subscriber}`);
      console.log(`\noracle received subscription registration:`);
      console.log(`email = ${email}`);
      console.log(`priceETHUSD = ${priceETHUSD}`);
      console.log(`blockNumber = ${blockNumber}`);
      console.log(`blockTimestamp = ${blockTimestamp}`);
      console.log(`oracle starting reminder tracking for subscriber ${email}`);
    })
  })
  .catch((err) => {
    console.log(err)
  })
})
