export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker parameter is required' });
  }

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=1&newsCount=0`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.quotes && data.quotes.length > 0) {
      // Filter out non-equity/futures if needed, but mostly we just return top 5
      const results = data.quotes.slice(0, 5).map(quote => ({
        ticker: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol
      }));
      
      return res.status(200).json({ 
        success: true, 
        results: results 
      });
    } else {
      return res.status(200).json({ success: true, results: [] });
    }
    
  } catch (error) {
    console.error('Error fetching company data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch company data' });
  }
}
