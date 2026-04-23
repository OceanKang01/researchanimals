import requests
import urllib.parse

def search(q):
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={urllib.parse.quote(q)}&quotesCount=5&newsCount=0"
    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(url, headers=headers)
    print(f"Query: {q}")
    if res.status_code == 200:
        data = res.json()
        if data.get('quotes'):
            for q_info in data['quotes']:
                print(f" - {q_info.get('symbol')}: {q_info.get('shortname') or q_info.get('longname')}")
        else:
            print("No quotes found.")

search("app")
search("palant")
search("micro")
