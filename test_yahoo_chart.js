import https from 'https';

function fetchChart(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&events=div,splits,capitalGains,earnings`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`--- ${ticker} ---`);
      console.log(data);
    });
  });
}
fetchChart("AAPL");
