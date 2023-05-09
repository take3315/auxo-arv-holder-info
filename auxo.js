import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const addresses = [
  '0x069c0Ed12dB7199c1DdAF73b94de75AAe8061d33',
  '0xc72fbD264b40D88E445bcf82663D63FF21e722AF'
];
const covalentAPI = process.env.COVALENT_API_KEY;
const zapperAPI = process.env.ZAPPER_API_KEY;
const authheaderCovalent = { "Authorization": "Basic " + Buffer.from(covalentAPI + ":").toString('base64') };
const authheaderZapper = { "Authorization": "Basic " + Buffer.from(zapperAPI + ":").toString('base64') };
const paramsCovalent = { "method": "GET", "headers": authheaderCovalent };
const paramsZapper = { "method": "GET", "headers": authheaderZapper };
const batchSize = 10;

async function getholderdemographics() {
  const holderList = [];
  const holderInfo = [];
  const sumByAppId = {};
  const countByAppId = {};
  const uniqueAddresses = {
    [addresses[0]]: new Set(),
    [addresses[1]]: new Set()
  };

  for (const address of addresses) {
    const urlCovalent = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${address}/token_holders_v2/`;
    const list = await fetch(urlCovalent, paramsCovalent).then(response => response.json());

    if (list.data) {
      for (let i = 0; i < list.data.items.length; i++) {
        const holder = list.data.items[i].address;
        holderList.push(holder);
        uniqueAddresses[address].add(holder); 
      }
    }
  }

  for (let j = 0; j < holderList.length; j += batchSize) {
    const batchAddresses = holderList.slice(j, j + batchSize);
    const urlZapper = `https://api.zapper.xyz/v2/balances/apps?addresses%5B%5D=${batchAddresses.join('&addresses%5B%5D=')}`;
    const userInfo = await fetch(urlZapper, paramsZapper).then(response => response.json());
    for (let k = 0; k < userInfo.length; k++) {
      holderInfo.push([
        userInfo[k].appId,
        parseFloat(userInfo[k].balanceUSD)
      ])
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  holderInfo.forEach(info => {
    const appId = info[0];
    const balanceUSD = info[1];
    if (sumByAppId[appId]) {
      sumByAppId[appId] += balanceUSD;
    } else {
      sumByAppId[appId] = balanceUSD;
    }
    if (countByAppId[appId]) {
      countByAppId[appId] += 1;
    } else {
      countByAppId[appId] = 1;
    }
  });

  const topByCount = Object.keys(countByAppId).map(appId => {
    return [
      appId,
      countByAppId[appId],
      sumByAppId[appId].toFixed(2)
    ];
  }).sort((a, b) => b[1] - a[1]).slice(0, 20);

  const topBySumBalance = Object.keys(sumByAppId).map(appId => {
    return [
      appId,
      countByAppId[appId],
      sumByAppId[appId].toFixed(2)
    ];
  }).sort((a, b) => b[2] - a[2]).slice(0, 20);


  console.log("Top 20 by usd term:", topBySumBalance);
  console.log("Top 20 by count:", topByCount);
  console.log("Count of unique addresses for", addresses[0], ":", uniqueAddresses[addresses[0]].size);
  console.log("Count of unique addresses for", addresses[1], ":", uniqueAddresses[addresses[1]].size);
}

getholderdemographics();

/*
import Web3 from 'web3';
const infuraAPI = process.env.INFURA_API_KEY;
const web3 = new Web3(`https://mainnet.infura.io/v3/${infuraAPI}`);
async function getDepositors() {
  try {
    const proxyContractABI = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "withdrawAmount", "type": "uint256" }], "name": "InvalidEmptyBalance", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "InvalidWithdrawalAmount", "type": "error" }, { "inputs": [], "name": "TransferFailed", "type": "error" }, { "inputs": [], "name": "ZeroAmount", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "depositor", "type": "address" }, { "indexed": true, "internalType": "address", "name": "receiver", "type": "address" }, { "indexed": true, "internalType": "uint8", "name": "epoch", "type": "uint8" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Deposited", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "EmergencyWithdraw", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "depositor", "type": "address" }, { "indexed": true, "internalType": "uint8", "name": "epoch", "type": "uint8" }], "name": "Exited", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint8", "name": "version", "type": "uint8" }], "name": "Initialized", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint8", "name": "newEpochId", "type": "uint8" }, { "indexed": false, "internalType": "uint256", "name": "startedTimestamp", "type": "uint256" }], "name": "NewEpoch", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Paused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "indexed": true, "internalType": "bytes32", "name": "previousAdminRole", "type": "bytes32" }, { "indexed": true, "internalType": "bytes32", "name": "newAdminRole", "type": "bytes32" }], "name": "RoleAdminChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": true, "internalType": "address", "name": "sender", "type": "address" }], "name": "RoleGranted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": true, "internalType": "address", "name": "sender", "type": "address" }], "name": "RoleRevoked", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Unpaused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "depositor", "type": "address" }, { "indexed": true, "internalType": "uint8", "name": "epoch", "type": "uint8" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "Withdrawn", "type": "event" }, { "inputs": [], "name": "DEFAULT_ADMIN_ROLE", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "OPERATOR_ROLE", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "activateNextEpoch", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "currentEpochId", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "address", "name": "_receiver", "type": "address" }], "name": "depositFor", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "address", "name": "_receiver", "type": "address" }, { "internalType": "uint256", "name": "_deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "depositForWithSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint256", "name": "_deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "name": "depositWithSignature", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "emergencyWithdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "epochBalances", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "epochPendingBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getActivations", "outputs": [{ "components": [{ "internalType": "uint256", "name": "_value", "type": "uint256" }], "internalType": "struct Bitfields.Bitfield", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getActiveBalanceForUser", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCurrentEpochBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint8", "name": "_epochId", "type": "uint8" }], "name": "getEpochBalanceWithProjection", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getEpochBalances", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getPendingBalanceForUser", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getProjectedNextEpochBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }], "name": "getRoleAdmin", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getTotalBalanceForUser", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "getUserStakingData", "outputs": [{ "components": [{ "components": [{ "internalType": "uint256", "name": "_value", "type": "uint256" }], "internalType": "struct Bitfields.Bitfield", "name": "activations", "type": "tuple" }, { "internalType": "uint8", "name": "epochWritten", "type": "uint8" }, { "internalType": "uint120", "name": "pending", "type": "uint120" }, { "internalType": "uint120", "name": "active", "type": "uint120" }], "internalType": "struct IRollStaker.UserStake", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "grantRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "hasRole", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_stakingToken", "type": "address" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "lastEpochUserWasActive", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "paused", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "quit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "renounceRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "revokeRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "stakingToken", "outputs": [{ "internalType": "contract IERC20Upgradeable", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }], "name": "userIsActive", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }, { "internalType": "uint8", "name": "_epoch", "type": "uint8" }], "name": "userIsActiveForEpoch", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "userStakes", "outputs": [{ "components": [{ "internalType": "uint256", "name": "_value", "type": "uint256" }], "internalType": "struct Bitfields.Bitfield", "name": "activations", "type": "tuple" }, { "internalType": "uint8", "name": "epochWritten", "type": "uint8" }, { "internalType": "uint120", "name": "pending", "type": "uint120" }, { "internalType": "uint120", "name": "active", "type": "uint120" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];

    const proxyContractAddress = '0x096b4F2253a430F33edc9B8e6A8e1d2fb4faA317';
    const proxyContract = new web3.eth.Contract(proxyContractABI, proxyContractAddress);
    const currentEpochId = await proxyContract.methods.currentEpochId().call();

    if (currentEpochId > 0) {
      const epochBalances = await proxyContract.methods.getEpochBalances().call();
      const depositorAddresses = epochBalances.map(balance => balance.depositor);
      console.log('Depositor Addresses:', depositorAddresses);
    } else {
      console.log('No epoch has started yet');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
getDepositors();
*/