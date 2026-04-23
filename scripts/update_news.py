import json
import os
import datetime
import yfinance as yf
import feedparser
from bs4 import BeautifulSoup

# 설정
COMPANIES = [
    {"ticker": "LITE", "name": "Lumentum Holdings Inc."},
    {"ticker": "INTC", "name": "Intel Corporation"},
    {"ticker": "AMD", "name": "Advanced Micro Devices, Inc."},
    {"ticker": "MU", "name": "Micron Technology, Inc."}
]

DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'mockDatabase.json')

def get_stock_data(ticker):
    """yfinance를 사용하여 종가와 등락률을 가져옵니다."""
    try:
        stock = yf.Ticker(ticker)
        # 최근 2일치 데이터 가져오기
        hist = stock.history(period="2d")
        if len(hist) >= 2:
            prev_close = hist['Close'].iloc[0]
            current_close = hist['Close'].iloc[1]
            change_percent = ((current_close - prev_close) / prev_close) * 100
        elif len(hist) == 1:
            current_close = hist['Close'].iloc[0]
            change_percent = 0.0 # 이전 데이터 없음
        else:
            return 0.0, 0.0
            
        return round(float(current_close), 2), round(float(change_percent), 2)
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return 0.0, 0.0

def get_earnings_date(ticker):
    """yfinance를 사용하여 다음 실적발표일을 가져옵니다."""
    try:
        stock = yf.Ticker(ticker)
        cal = stock.calendar
        if cal and 'Earnings Date' in cal and len(cal['Earnings Date']) > 0:
            date_obj = cal['Earnings Date'][0]
            if isinstance(date_obj, datetime.date):
                return date_obj.strftime('%Y-%m-%d')
            elif hasattr(date_obj, 'date'):
                return date_obj.date().strftime('%Y-%m-%d')
            else:
                return str(date_obj)[:10]
    except Exception as e:
        print(f"Error fetching earnings date for {ticker}: {e}")
    return "TBD"

import urllib.parse

def scrape_raw_news(ticker, company_name):
    """Google News RSS를 통해 해당 기업의 최신 영문 기사 원문 링크와 스니펫을 수집합니다."""
    # Google News RSS (검색어 기반)
    query = f"{ticker} stock OR {company_name}"
    encoded_query = urllib.parse.quote(query)
    rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
    
    feed = feedparser.parse(rss_url)
    sources = []
    raw_snippets = []
    
    # 상위 3개 뉴스만 추출
    for entry in feed.entries[:3]:
        title = getattr(entry, 'title', 'No Title')
        link = getattr(entry, 'link', 'No Link')
        
        # HTML 태그 제거하여 순수 텍스트 스니펫 추출
        summary_html = getattr(entry, 'summary', '')
        soup = BeautifulSoup(summary_html, 'html.parser')
        snippet = soup.get_text(separator=' ', strip=True)
        
        sources.append({
            "title": title,
            "url": link,
            "provider": "Google News"
        })
        raw_snippets.append(f"- {title}: {snippet[:200]}...")
        
    # Openclaw AI 에이전트가 쉽게 읽어갈 수 있도록 원문을 합쳐서 summary 필드에 임시 저장
    combined_raw_text = "\n".join(raw_snippets)
    
    return {
        "summary": f"[AI 요약 대기 중 - 아래 원문 데이터 포함]\n\n{combined_raw_text}",
        "sources": sources
    }

def main():
    print("Starting raw news scraping for Openclaw Agent...")
    
    today_str = datetime.date.today().strftime('%Y-%m-%d')
    now_time = datetime.datetime.now().strftime('%I:%M %p KST')
    
    # 1. 기존 데이터 로드
    try:
        with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f:
            db = json.load(f)
    except FileNotFoundError:
        db = {}
        
    today_data = {
        "date": today_str,
        "lastUpdated": now_time,
        "summaries": []
    }
    
    earnings_calendar = []
    
    # 2. 각 회사별로 주가와 뉴스 원문(Snippet) 생성
    for company in COMPANIES:
        ticker = company['ticker']
        name = company['name']
        print(f"Processing {ticker}...")
        
        price, change = get_stock_data(ticker)
        news_info = scrape_raw_news(ticker, name)
        earnings_date = get_earnings_date(ticker)
        
        earnings_calendar.append({
            "ticker": ticker,
            "name": name,
            "earningsDate": earnings_date
        })
        
        summary_item = {
            "ticker": ticker,
            "name": name,
            "price": price,
            "changePercent": change,
            "summary": news_info["summary"], # openclaw agent가 읽어갈 원문 데이터
            "sources": news_info["sources"]
        }
        today_data["summaries"].append(summary_item)
        
    # 3. 데이터베이스 업데이트 (최신순으로 정렬)
    db[today_str] = today_data
    db["earningsCalendar"] = earnings_calendar
    
    # earningsCalendar 키는 날짜 정렬에서 제외
    sorted_db = {k: db[k] for k in ["earningsCalendar"] if k in db}
    for k in sorted(db.keys(), reverse=True):
        if k != "earningsCalendar":
            sorted_db[k] = db[k]
    
    # 이 파일(mockDatabase.json)을 GitHub에 덮어쓰면, Openclaw 에이전트가 이를 읽어 재가공 가능
    with open(DATA_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(sorted_db, f, ensure_ascii=False, indent=2)
        
    print(f"Raw data collection completed successfully. Date: {today_str}")

if __name__ == "__main__":
    main()
