import Web3 from 'web3';

var web3 = new Web3();

// FIXME: read URI from the config
web3.setProvider(new web3.providers.HttpProvider(
  'http://127.0.0.1:8545'
));

export default web3;
