export default async function handler(req, res) {
  const { tickers } = req.query;

  if (!tickers) {
    return res.status(400).json({ error: 'Tickers parameter is required' });
  }

  const tickerList = tickers.split(',').map(t => t.trim().toUpperCase());

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
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
    const earnings = [];

    const promises = tickerList.map(async (ticker) => {
      try {
        const url = `https://api.nasdaq.com/api/analyst/${ticker}/earnings-date`;
        const response = await fetchWithTimeout(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.nasdaq.com',
            'Referer': 'https://www.nasdaq.com/'
          }
        }, 5000);

        if (response.ok) {
          const data = await response.json();
          const reportText = data?.data?.reportText || "";
          const dateMatch = reportText.match(/(\d{2}\/\d{2}\/\d{4})\s+(after market close|before market open|time not specified)/i);

          if (dateMatch) {
            const rawDate = dateMatch[1];
            const rawTiming = dateMatch[2].toLowerCase();
            const [mm, dd, yyyy] = rawDate.split('/');
            let timing = "TBD";
            if (rawTiming.includes("after")) timing = "AMC";
            else if (rawTiming.includes("before")) timing = "BMO";
            earnings.push({ ticker, earningsDate: `${yyyy}-${mm}-${dd} ${timing}` });
          } else {
            const announcement = data?.data?.announcement || "";
            const annMatch = announcement.match(/([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})/i);
            if (annMatch) {
              const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              const mm2 = String(monthNames.indexOf(annMatch[1]) + 1).padStart(2, '0');
              const dd2 = String(annMatch[2]).padStart(2, '0');
              const yyyy2 = annMatch[3];
              earnings.push({ ticker, earningsDate: `${yyyy2}-${mm2}-${dd2} TBD` });
            } else {
              earnings.push({ ticker, earningsDate: 'TBD' });
            }
          }
        } else {
          earnings.push({ ticker, earningsDate: 'TBD' });
        }
      } catch (e) {
        earnings.push({ ticker, earningsDate: 'TBD' });
      }
    });

    await Promise.all(promises);
    res.status(200).json({ success: true, earnings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch earnings data' });
  }
}
