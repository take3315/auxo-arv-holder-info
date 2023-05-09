import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const addressARV = "0x069c0Ed12dB7199c1DdAF73b94de75AAe8061d33";
const covalentAPI = process.env.COVALENT_API_KEY;
const zapperAPI = process.env.ZAPPER_API_KEY;
const authheaderCovalent = { "Authorization": "Basic " + Buffer.from(covalentAPI + ":").toString('base64') };
const authheaderZapper = { "Authorization": "Basic " + Buffer.from(zapperAPI + ":").toString('base64') };
const paramsCovalent = { "method": "GET", "headers": authheaderCovalent };
const paramsZapper = { "method": "GET", "headers": authheaderZapper };
const urlCovalent = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${addressARV}/token_holders_v2/`;
const holderList = [];
const holderInfo = [];
const sumByAppId = {};
const countByAppId = {};
const batchSize = 10;

async function getARVdemographics() {

  const listARV = await fetch(urlCovalent, paramsCovalent).then(response => response.json());

  if (listARV.data) {
    for (let i = 0; i < listARV.data.items.length; i++) {
      const holderARV = listARV.data.items[i].address;
      holderList.push(holderARV);
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


  console.log("Top by count:", topByCount);
  console.log("Top by usd term:", topBySumBalance);
}

getARVdemographics();