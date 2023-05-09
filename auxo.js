
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import Web3 from 'web3';
import pkg from '@apollo/client';
const { ApolloClient, InMemoryCache, createHttpLink, gql } = pkg;
dotenv.config();
const infuraAPI = process.env.INFURA_API_KEY;
const web3 = new Web3(`https://mainnet.infura.io/v3/${infuraAPI}`);
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
const httpLink = createHttpLink({
  uri: 'https://api.thegraph.com/subgraphs/name/jordaniza/auxo-staking',
});
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
async function getholderdemographics() {
  const holderInfo = [];
  const sumByAppId = {};
  const countByAppId = {};
  const holderAddresses = {
    [addresses[0]]: new Set(),
    [addresses[1]]: new Set(),
    stakerPRV: new Set()
  };
  const uniqueHolders = new Set();

  const stakerData = await fetchPRVStakers();
  const stakers = stakerData.prvstakingBalances;

  for (const staker of stakers) {
    const stakerAddress = staker.account.id;
    holderAddresses.stakerPRV.add(stakerAddress);
    uniqueHolders.add(stakerAddress);
  }

  for (const address of addresses) {
    const urlCovalent = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${address}/token_holders_v2/`;
    const list = await fetch(urlCovalent, paramsCovalent).then(response => response.json());

    if (list.data) {
      for (let i = 0; i < list.data.items.length; i++) {
        const holder = list.data.items[i].address;
        holderAddresses[address].add(holder);
        if (!uniqueHolders.has(holder)) {
          uniqueHolders.add(holder);
        }
      }
    }
  }

  const holderList = Array.from(uniqueHolders);

  for (let j = 0; j < holderList.length; j += batchSize) {
    const batchAddresses = holderList.slice(j, j + batchSize);
    const urlZapper = `https://api.zapper.xyz/v2/balances/apps?addresses%5B%5D=${batchAddresses.join('&addresses%5B%5D=')}`;
    const userInfo = await fetch(urlZapper, paramsZapper).then(response => response.json());
    for (let k = 0; k < userInfo.length; k++) {
      holderInfo.push([
        userInfo[k].appId,
        parseFloat(userInfo[k].balanceUSD)
      ]);
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

  const topByCount = Object.keys(countByAppId)
    .map(appId => [appId, countByAppId[appId], sumByAppId[appId].toFixed(2)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  const topBySumBalance = Object.keys(sumByAppId)
    .map(appId => [appId, countByAppId[appId], sumByAppId[appId].toFixed(2)])
    .sort((a, b) => b[2] - a[2])
    .slice(0, 20);

  console.log("Top 20 by USD term:", topBySumBalance);
  console.log("Top 20 by count:", topByCount);
  console.log("Count of ARV holder", ":", holderAddresses[addresses[0]].size);
  console.log("Count of PRV holder", ":", holderAddresses[addresses[1]].size);
  console.log("Count of PRV staker :", holderAddresses.stakerPRV.size);
  console.log("Count of unique addresses :", uniqueHolders.size);
}

getholderdemographics();

async function getCurrentBlockNumber() {
  try {
    const blockNumber = await web3.eth.getBlockNumber();
    return blockNumber;
  } catch (error) {
    console.error('Error getting current block number:', error);
    throw error;
  }
}
async function fetchPRVStakers() {
  const blockNumber = await getCurrentBlockNumber();

  const query = gql`
    query PRVStakers($block: Int, $skip: Int) {
      prvstakingBalances(
        skip: $skip,
        block: { number: $block },
        where: { value_not: "0" }
      ) {
        account {
          id
        }
        value
        valueExact
      }
    }
  `;

  const variables = {
    block: blockNumber,
    skip: 0,
  };

  try {
    const { data } = await client.query({
      query: query,
      variables: variables,
    });

    return data;
  } catch (error) {
    console.error('Error fetching PRV stakers:', error);
    throw error;
  }
}