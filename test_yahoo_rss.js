import https from 'https';

async function fetchRss(ticker) {
  const url = `https://finance.yahoo.com/rss/headline?s=${ticker}`;
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

fetchRss("AAPL").then(res => console.log(res.substring(0, 500)));
