const https = require('https');

function search(q) {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=5&newsCount=0`;
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      console.log(`Query: ${q}`);
      if (parsed.quotes && parsed.quotes.length > 0) {
        parsed.quotes.forEach(q => console.log(` - ${q.symbol}: ${q.shortname || q.longname}`));
      } else {
        console.log("No quotes found.");
      }
    });
  });
}

search("app");
search("palant");
search("micro");
