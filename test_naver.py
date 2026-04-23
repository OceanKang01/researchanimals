import requests
import urllib.parse

def search_naver(q):
    url = f"https://ac.finance.naver.com/ac?q={urllib.parse.quote(q)}&q_enc=utf-8&st=111&r_format=json&r_enc=utf-8"
    headers = {'User-Agent': 'Mozilla/5.0'}
    res = requests.get(url, headers=headers)
    print(f"Query: {q}")
    if res.status_code == 200:
        data = res.json()
        print(data)
    else:
        print("Error:", res.status_code)

search_naver("엔비디아")
search_naver("애플")
search_naver("NVDA")
