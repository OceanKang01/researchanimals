import https from 'https';

async function fetchNasdaq(ticker) {
  const url = `https://api.nasdaq.com/api/analyst/${ticker}/earnings-date`;
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(`${ticker}: ${res.statusCode}`));
    }).on('error', e => resolve(`${ticker}: Error`));
  });
}

async function test() {
  const tickers = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];
  const results = await Promise.all(tickers.map(fetchNasdaq));
  console.log(results);
}
test();
