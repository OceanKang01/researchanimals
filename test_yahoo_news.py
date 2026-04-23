import requests
import json

def search(q):
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}&quotesCount=0&newsCount=3"
    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(json.dumps(data.get('news', []), indent=2))

search("AAPL")
