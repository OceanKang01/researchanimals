export default async function handler(req, res) {
  const { tickers } = req.query;

  if (!tickers) {
    return res.status(400).json({ error: 'Tickers parameter is required' });
  }

  const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());

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

  // Yahoo Finance v8 API (used by yfinance internally)
  const fetchYahooEarnings = async (ticker) => {
    try {
      // Step 1: Get crumb and cookies
      const cookieRes = await fetchWithTimeout('https://fc.yahoo.com/cuMnx', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, 5000).catch(() => null);
      
      let cookies = '';
      if (cookieRes) {
        const setCookies = cookieRes.headers.getSetCookie?.() || [];
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      }

      const crumbRes = await fetchWithTimeout('https://query2.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies
        }
      }, 5000);
      const crumb = await crumbRes.text();

      // Step 2: Fetch calendar events
      const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents&crumb=${encodeURIComponent(crumb)}`;
      const dataRes = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies
        }
      }, 5000);

      if (!dataRes.ok) return null;

      const data = await dataRes.json();
      const calEvents = data?.quoteSummary?.result?.[0]?.calendarEvents;
      if (!calEvents) return null;

      const earningsDates = calEvents.earnings?.earningsDate || [];
      if (earningsDates.length === 0) return null;

      const timestamp = earningsDates[0]?.raw;
      const date = new Date(timestamp * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // 1 date = confirmed, 2 dates = expected range
      const isConfirmed = earningsDates.length === 1;

      const epsAvg = calEvents.earnings?.earningsAverage?.raw;
      const epsHigh = calEvents.earnings?.earningsHigh?.raw;
      const epsLow = calEvents.earnings?.earningsLow?.raw;
      const revAvg = calEvents.earnings?.revenueAverage?.raw;

      return {
        ticker,
        earningsDate: dateStr,
        confirmed: isConfirmed,
        epsEstimate: epsAvg || null,
        epsHigh: epsHigh || null,
        epsLow: epsLow || null,
        revenueEstimate: revAvg || null,
      };
    } catch (e) {
      return null;
    }
  };

  // Fallback: Nasdaq API
  const fetchNasdaqEarnings = async (ticker) => {
    try {
      const url = `https://api.nasdaq.com/api/analyst/${ticker}/earnings-date`;
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://www.nasdaq.com',
          'Referer': 'https://www.nasdaq.com/'
        }
      }, 5000);

      if (!response.ok) return null;

      const data = await response.json();
      const reportText = data?.data?.reportText || "";
      const dateMatch = reportText.match(/(\d{2}\/\d{2}\/\d{4})\s+(after market close|before market open|time not specified)/i);

      if (dateMatch) {
        const [mm, dd, yyyy] = dateMatch[1].split('/');
        let timing = "";
        if (dateMatch[2].toLowerCase().includes("after")) timing = " AMC";
        else if (dateMatch[2].toLowerCase().includes("before")) timing = " BMO";
        return { ticker, earningsDate: `${yyyy}-${mm}-${dd}${timing}`, confirmed: false };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  try {
    const earnings = [];

    // First try Yahoo Finance for all tickers at once (share crumb)
    let cookies = '';
    let crumb = '';
    try {
      const cookieRes = await fetchWithTimeout('https://fc.yahoo.com/cuMnx', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }, 5000).catch(() => null);
      
      if (cookieRes) {
        const setCookies = cookieRes.headers.getSetCookie?.() || [];
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      }

      const crumbRes = await fetchWithTimeout('https://query2.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies
        }
      }, 5000);
      crumb = await crumbRes.text();
    } catch (e) {
      // crumb fetch failed, will use Nasdaq fallback
    }

    const promises = tickerList.map(async (ticker) => {
      // Try Yahoo Finance first
      if (crumb) {
        try {
          const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=calendarEvents&crumb=${encodeURIComponent(crumb)}`;
          const dataRes = await fetchWithTimeout(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': cookies
            }
          }, 5000);

          if (dataRes.ok) {
            const data = await dataRes.json();
            const calEvents = data?.quoteSummary?.result?.[0]?.calendarEvents;
            if (calEvents) {
              const earningsDates = calEvents.earnings?.earningsDate || [];
              if (earningsDates.length > 0) {
                const timestamp = earningsDates[0]?.raw;
                const date = new Date(timestamp * 1000);
                const dateStr = date.toISOString().split('T')[0];
                const isConfirmed = earningsDates.length === 1;
                
                earnings.push({
                  ticker,
                  earningsDate: dateStr,
                  confirmed: isConfirmed,
                  epsEstimate: calEvents.earnings?.earningsAverage?.raw || null,
                  revenueEstimate: calEvents.earnings?.revenueAverage?.raw || null,
                  source: 'yahoo'
                });
                return;
              }
            }
          }
        } catch (e) { /* fall through to Nasdaq */ }
      }

      // Fallback: Nasdaq
      const nasdaqResult = await fetchNasdaqEarnings(ticker);
      if (nasdaqResult) {
        earnings.push({ ...nasdaqResult, source: 'nasdaq' });
      } else {
        earnings.push({ ticker, earningsDate: 'TBD', confirmed: null, source: 'none' });
      }
    });

    await Promise.all(promises);
    res.status(200).json({ success: true, earnings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch earnings data' });
  }
}
