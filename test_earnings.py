import yfinance as yf
ticker = yf.Ticker("AAPL")
print("Calendar:", ticker.calendar)
try:
    dates = ticker.get_earnings_dates()
    print("Earnings dates top 5:")
    print(dates.head())
except Exception as e:
    print(e)
