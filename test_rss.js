import https from 'https';

async function fetchRss(ticker) {
  const query = encodeURIComponent(`${ticker} stock news`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Extract top 3 items
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(data)) !== null && items.length < 3) {
          const itemXml = match[1];
          const titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
          const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);
          const sourceMatch = itemXml.match(/<source[^>]*>([^<]+)<\/source>/);
          
          if (titleMatch && linkMatch) {
            items.push({
              title: titleMatch[1],
              link: linkMatch[1],
              source: sourceMatch ? sourceMatch[1] : 'Google News'
            });
          }
        }
        resolve(items);
      });
      res.on('error', reject);
    });
  });
}

fetchRss("AAPL").then(res => console.log(res));
