export default async function handler(req, res) {
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
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
    // Get watchlist from query or use defaults
    const tickers = (req.query.tickers || 'LITE,INTC,AMD,MU,GLW,AAPL,META,MSFT,QCOM,FORM,FSLR,TSLA,NXT,TSEM,SNDK,NVDA,PLTR,GEV,MRVL,ARM,STX,GOOGL,AMZN,RXRX,TEM,COHR,285A.T').split(',').map(t => t.trim().toUpperCase());

    // --- Fetch earnings data (same logic as earnings.js) ---
    let cookies = '', crumb = '';
    try {
      const cookieRes = await fetchWithTimeout('https://fc.yahoo.com/cuMnx', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, 5000).catch(() => null);
      if (cookieRes) {
        const setCookies = cookieRes.headers.getSetCookie?.() || [];
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      }
      const crumbRes = await fetchWithTimeout('https://query2.finance.yahoo.com/v1/test/getcrumb', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Cookie': cookies }
      }, 5000);
      crumb = await crumbRes.text();
    } catch (e) {}

    const rows = [];

    await Promise.all(tickers.map(async (ticker) => {
      let earningsDate = 'TBD', confirmed = false, epsEstimate = null, timing = '';
      let companyName = ticker;

      // Yahoo Finance
      if (crumb) {
        try {
          const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents,quoteType&crumb=${encodeURIComponent(crumb)}`;
          const dataRes = await fetchWithTimeout(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Cookie': cookies }
          }, 5000);
          if (dataRes.ok) {
            const data = await dataRes.json();
            const result = data?.quoteSummary?.result?.[0];
            const calEvents = result?.calendarEvents;
            const quoteType = result?.quoteType;
            if (quoteType?.longName) companyName = quoteType.longName;
            if (calEvents) {
              const dates = calEvents.earnings?.earningsDate || [];
              if (dates.length > 0) {
                const ts = dates[0]?.raw;
                const d = new Date(ts * 1000);
                earningsDate = d.toISOString().split('T')[0];
                confirmed = dates.length === 1;
                epsEstimate = calEvents.earnings?.earningsAverage?.raw || null;
              }
            }
          }
        } catch (e) {}
      }

      // Nasdaq for AMC/BMO timing
      if (earningsDate !== 'TBD') {
        try {
          const nasdaqRes = await fetchWithTimeout(`https://api.nasdaq.com/api/analyst/${ticker}/earnings-date`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json', 'Origin': 'https://www.nasdaq.com', 'Referer': 'https://www.nasdaq.com/'
            }
          }, 4000);
          if (nasdaqRes.ok) {
            const nd = await nasdaqRes.json();
            const rt = nd?.data?.reportText || '';
            if (/after market close/i.test(rt)) timing = 'AMC';
            else if (/before market open/i.test(rt)) timing = 'BMO';
          }
        } catch (e) {}
      }

      // Convert to Korean time
      let kstDate = earningsDate;
      let kstTime = '';
      if (earningsDate !== 'TBD') {
        const baseDate = new Date(earningsDate + 'T00:00:00');
        if (timing === 'AMC') {
          // After Market Close (US) = 다음날 오전 (KST)
          baseDate.setDate(baseDate.getDate() + 1);
          kstTime = '오전';
        } else if (timing === 'BMO') {
          // Before Market Open (US) = 당일 저녁 (KST)
          kstTime = '저녁';
        }
        kstDate = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;
      }

      rows.push({
        ticker,
        companyName,
        usDate: earningsDate,
        usTiming: timing || '-',
        kstDate: kstDate === 'TBD' ? '미정' : kstDate,
        kstTime: kstTime || '-',
        confirmed: confirmed ? 'Y' : 'N',
        epsEstimate: epsEstimate !== null ? epsEstimate.toFixed(4) : '-',
      });
    }));

    // Sort alphabetically
    rows.sort((a, b) => a.ticker.localeCompare(b.ticker));

    // Build CSV
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const updatedAt = kstNow.toISOString().replace('T', ' ').split('.')[0] + ' KST';

    const header = 'Ticker,Company,US Date,US Timing,KST Date,KST Time,Confirmed,EPS Estimate';
    const csvRows = rows.map(r => 
      `${r.ticker},"${r.companyName}",${r.usDate},${r.usTiming},${r.kstDate},${r.kstTime},${r.confirmed},${r.epsEstimate}`
    );
    const csv = `# Earnings Calendar (Updated: ${updatedAt})\n${header}\n${csvRows.join('\n')}\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="earnings_schedule.csv"');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.status(200).end(csv);
  } catch (error) {
    res.status(500).end('# Error fetching earnings data\n');
  }
}
