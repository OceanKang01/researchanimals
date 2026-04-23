import https from 'https';

function fetchEarnings(ticker) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const cal = parsed.quoteSummary?.result?.[0]?.calendarEvents;
        console.log(`--- ${ticker} ---`);
        console.log(JSON.stringify(cal, null, 2));
      } catch(e) {
        console.error(e);
      }
    });
  });
}

fetchEarnings("AAPL");
fetchEarnings("PLTR");
fetchEarnings("TSLA");
