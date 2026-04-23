import Parser from 'rss-parser';
const parser = new Parser();

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // URL-encode the query
    const encodedQuery = encodeURIComponent(query);
    const feedUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ko&gl=KR&ceid=KR:ko`;

    const feed = await parser.parseURL(feedUrl);
    
    // Get up to 20 news items
    const newsItems = feed.items.slice(0, 20).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source || 'Google News',
      snippet: item.contentSnippet || ''
    }));

    res.status(200).json({ success: true, data: newsItems });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
}
