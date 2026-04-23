import https from 'https';

function fetchCalendar(ticker) {
  const url = `https://finance.yahoo.com/calendar/earnings?symbol=${ticker}`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      // Yahoo finance embeds a JSON in the HTML
      // Look for "earningsDate" or similar
      const match = data.match(/"earningsDate":\[([^\]]+)\]/);
      if (match) {
        console.log(`--- ${ticker} ---`);
        console.log(match[1]);
      } else {
        console.log(`--- ${ticker} --- No match`);
      }
    });
  });
}

fetchCalendar("AAPL");
fetchCalendar("TSLA");
