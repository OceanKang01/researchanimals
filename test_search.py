import requests
import json

def search(q):
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}&quotesCount=1&newsCount=0"
    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(url, headers=headers)
    print(f"Query: {q}")
    if res.status_code == 200:
        data = res.json()
        if data.get('quotes'):
            q_info = data['quotes'][0]
            print(f"Found: Ticker: {q_info.get('symbol')}, Name: {q_info.get('shortname')}")
        else:
            print("No quotes found.")
    else:
        print("Error:", res.status_code)

search("애플")
search("엔비디아")
search("NVDA")
