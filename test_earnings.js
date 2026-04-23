import https from 'https';

function getEarnings(ticker) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      if (parsed.quoteSummary && parsed.quoteSummary.result) {
        const cal = parsed.quoteSummary.result[0].calendarEvents;
        if (cal && cal.earnings && cal.earnings.earningsDate) {
           const dates = cal.earnings.earningsDate.map(d => new Date(d.raw * 1000).toLocaleString());
           console.log(`Earnings for ${ticker}:`, dates);
        } else {
           console.log(`No earnings data for ${ticker}`);
        }
      }
    });
  });
}

getEarnings("AAPL");
getEarnings("TSLA");
