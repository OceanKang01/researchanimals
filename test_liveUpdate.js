import handler from './api/liveUpdate.js';

const req = { query: { tickers: 'AAPL,TSLA' } };
const res = {
  status: (code) => {
    console.log("Status:", code);
    return {
      json: (data) => console.log("Response JSON:", JSON.stringify(data, null, 2))
    };
  }
};

handler(req, res).catch(console.error);
