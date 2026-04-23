export default async function handler(req, res) {
  const { tickers } = req.query;

  if (!tickers) {
    return res.status(400).json({ error: 'Tickers parameter is required' });
  }

  const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());
  
  const kstDate = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  const todayStr = kstDate.toISOString().split('T')[0];
  let lastUpdatedStr = "Live";
  try { lastUpdatedStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' (Live)'; } catch(e) { lastUpdatedStr = kstDate.toISOString().replace('T', ' ').substring(0, 19) + ' (Live)'; }

  // Helper for timeouts to prevent Vercel 10s limit
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  try {
    const results = {
      date: todayStr,
      lastUpdated: lastUpdatedStr,
      summaries: [],
      earnings: []
    };

    const promises = tickerList.map(async (ticker) => {
      // 1. Fetch News
      try {
        const newsUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${ticker}&quotesCount=0&newsCount=3`;
        const newsRes = await fetchWithTimeout(newsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 3500);
        
        let sources = [];
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          if (newsData.news && newsData.news.length > 0) {
            sources = newsData.news.map(n => ({
              provider: n.publisher || 'Yahoo Finance',
              title: n.title,
              url: n.link
            }));
          }
        }
        
        if (sources.length === 0) {
           try {
             const query = encodeURIComponent(`${ticker} stock news`);
             const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
             const rssRes = await fetchWithTimeout(feedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 3500);
             if (rssRes.ok) {
               const xmlText = await rssRes.text();
               const itemRegex = /<item>([\s\S]*?)<\/item>/g;
               let match;
               while ((match = itemRegex.exec(xmlText)) !== null && sources.length < 3) {
                 const itemXml = match[1];
                 const titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
                 const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);
                 const sourceMatch = itemXml.match(/<source[^>]*>([^<]+)<\/source>/);
                 if (titleMatch && linkMatch) {
                   const decodeHtml = (html) => html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
                   sources.push({
                     provider: sourceMatch ? decodeHtml(sourceMatch[1]) : 'Google News',
                     title: decodeHtml(titleMatch[1]),
                     url: linkMatch[1]
                   });
                 }
               }
             }
           } catch(e) {}
        }
        
        results.summaries.push({
          ticker: ticker,
          name: ticker,
          price: 0,
          changePercent: 0,
          summary: "실시간 라이브 업데이트 모드입니다. 원문 기사만 제공되며, AI 요약본은 다음 정기 업데이트 시 반영됩니다.",
          sources: sources
        });
      } catch (e) {
        results.summaries.push({
          ticker: ticker,
          name: ticker,
          price: 0,
          changePercent: 0,
          summary: "뉴스 서버 연결 지연으로 기사를 가져오지 못했습니다.",
          sources: []
        });
      }

      // 2. Fetch Earnings
      try {
        const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents`;
        const response = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 3000);
        if (response.ok) {
          const data = await response.json();
          const cal = data.quoteSummary?.result?.[0]?.calendarEvents;
          if (cal && cal.earnings && cal.earnings.earningsDate && cal.earnings.earningsDate.length > 0) {
            const rawTimestamp = cal.earnings.earningsDate[0].raw;
            const dateObj = new Date(rawTimestamp * 1000);
            const e_yyyy = dateObj.getFullYear();
            const e_mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const e_dd = String(dateObj.getDate()).padStart(2, '0');
            const hour = dateObj.getUTCHours();
            
            let timing = "TBD";
            if (hour >= 10 && hour <= 15) timing = "BMO (개장 전)";
            else if (hour >= 19 && hour <= 23) timing = "AMC (마감 후)";
            
            results.earnings.push({ ticker: ticker, earningsDate: `${e_yyyy}-${e_mm}-${e_dd} ${timing}` });
          } else {
            results.earnings.push({ ticker: ticker, earningsDate: 'TBD' });
          }
        } else {
          results.earnings.push({ ticker: ticker, earningsDate: 'TBD' });
        }
      } catch (e) {
        results.earnings.push({ ticker: ticker, earningsDate: 'TBD' });
      }
    });

    await Promise.all(promises);
    res.status(200).json({ success: true, data: results });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Live update failed' });
  }
}
