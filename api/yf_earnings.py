import json
import sys
import yfinance as yf
from datetime import date
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        tickers_param = params.get('tickers', [''])[0]

        if not tickers_param:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'tickers parameter required'}).encode())
            return

        tickers = [t.strip().upper() for t in tickers_param.split(',')]
        earnings = []

        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                cal = stock.calendar or {}
                dates = cal.get('Earnings Date', [])
                
                if dates and len(dates) > 0:
                    d = dates[0]  # First date
                    date_str = d.strftime('%Y-%m-%d')
                    
                    # If only 1 date = confirmed, if 2 dates = expected (range)
                    is_confirmed = len(dates) == 1
                    
                    earnings.append({
                        'ticker': ticker,
                        'earningsDate': date_str,
                        'confirmed': is_confirmed,
                        'epsEstimate': cal.get('Earnings Average'),
                        'epsHigh': cal.get('Earnings High'),
                        'epsLow': cal.get('Earnings Low'),
                        'revenueEstimate': cal.get('Revenue Average'),
                    })
                else:
                    earnings.append({
                        'ticker': ticker,
                        'earningsDate': 'TBD',
                        'confirmed': None,
                    })
            except Exception as e:
                earnings.append({
                    'ticker': ticker,
                    'earningsDate': 'TBD',
                    'confirmed': None,
                })

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True, 'earnings': earnings}).encode())

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    server = HTTPServer(('0.0.0.0', port), handler)
    print(f'yfinance earnings server running on port {port}')
    server.serve_forever()
