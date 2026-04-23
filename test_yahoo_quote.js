import https from 'https';

function fetchQuote(ticker) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`--- ${ticker} ---`);
      console.log(data);
    });
  });
}
fetchQuote("AAPL");
