import Parser from 'rss-parser';

const parser = new Parser();

export default async function handler(req, res) {
  const { tickers } = req.query;

  if (!tickers) {
    return res.status(400).json({ error: 'Tickers parameter is required' });
  }

  const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const results = {
      date: todayStr,
      lastUpdated: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (Live)',
      summaries: [],
      earnings: []
    };

    // Process all tickers in parallel
    const promises = tickerList.map(async (ticker) => {
      // 1. Fetch News
      try {
        const query = encodeURIComponent(`${ticker} stock news`);
        const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
        const feed = await parser.parseURL(feedUrl);
        
        // Take top 3 news
        const newsItems = feed.items.slice(0, 3).map((item, idx) => ({
          title: item.title,
          link: item.link,
          source: item.source || 'Google News'
        }));
        
        // Map to format expected by Dashboard
        const summaryObj = {
          ticker: ticker,
          name: ticker,
          price: 0,
          changePercent: 0,
          summary: "실시간 라이브 업데이트 모드입니다. 원문 기사만 제공되며, AI 요약본은 다음 정기 업데이트 시 반영됩니다.",
          sources: newsItems.map(n => ({
            provider: n.source,
            title: n.title,
            url: n.link
          }))
        };
        results.summaries.push(summaryObj);
      } catch (e) {
        console.error(`News fetch failed for ${ticker}`, e);
        results.summaries.push({
          ticker: ticker,
          name: ticker,
          price: 0,
          changePercent: 0,
          summary: "실시간 뉴스를 가져오는데 실패했습니다.",
          sources: []
        });
      }

      // 2. Fetch Earnings from Yahoo Finance
      try {
        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (response.ok) {
          const data = await response.json();
          const cal = data.quoteSummary?.result?.[0]?.calendarEvents;
          
          if (cal && cal.earnings && cal.earnings.earningsDate && cal.earnings.earningsDate.length > 0) {
            const rawTimestamp = cal.earnings.earningsDate[0].raw;
            const dateObj = new Date(rawTimestamp * 1000);
            
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const hour = dateObj.getUTCHours(); // EST diff approx
            
            let timing = "TBD";
            // Rough approximation of BMO/AMC based on UTC hours returned by Yahoo
            // Yahoo usually returns 12:00 UTC (8am EDT) for BMO, 20:00 UTC (4pm EDT) for AMC
            if (hour >= 10 && hour <= 15) {
               timing = "BMO (개장 전)";
            } else if (hour >= 19 && hour <= 23) {
               timing = "AMC (마감 후)";
            }
            
            results.earnings.push({
              ticker: ticker,
              earningsDate: `${yyyy}-${mm}-${dd} ${timing}`
            });
          } else {
            results.earnings.push({ ticker: ticker, earningsDate: 'TBD' });
          }
        } else {
          results.earnings.push({ ticker: ticker, earningsDate: 'TBD' });
        }
      } catch (e) {
        console.error(`Earnings fetch failed for ${ticker}`, e);
        results.earnings.push({ ticker: ticker, earningsDate: 'TBD' });
      }
    });

    await Promise.all(promises);

    res.status(200).json({ success: true, data: results });
    
  } catch (error) {
    console.error('Live update error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform live update' });
  }
}
