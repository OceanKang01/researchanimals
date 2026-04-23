import yfinance as yf
ticker = yf.Ticker("LITE")
print("Calendar:")
print(ticker.calendar)
print("Earnings dates:")
try:
    print(ticker.earnings_dates)
except Exception as e:
    print(e)
