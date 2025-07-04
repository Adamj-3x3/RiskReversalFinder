import json
import time
import yfinance as yf
import pandas as pd
import numpy as np
from scipy.stats import norm

def handler(request):
    if request.method != "POST":
        return (json.dumps({"error": "Only POST allowed"}), 405, {"Content-Type": "application/json"})

    try:
        data = request.json
        ticker = data.get("ticker", "").upper()
        min_dte = int(data.get("min_dte", 30))
        max_dte = int(data.get("max_dte", 180))
        strategy = data.get("strategy", "bullish")

        if not ticker or strategy not in ["bullish", "bearish"]:
            return (json.dumps({"error": "Invalid input"}), 400, {"Content-Type": "application/json"})

        stock = yf.Ticker(ticker)
        time.sleep(0.5)
        hist = stock.history(period="1y")
        time.sleep(0.5)
        options_dates = stock.options
        time.sleep(0.5)

        # For demo: just use the first expiry
        expiry = options_dates[0]
        chain = stock.option_chain(expiry)
        time.sleep(0.5)

        if strategy == "bullish":
            options = chain.calls
            options = options.sort_values("impliedVolatility", ascending=False).head(5)
        else:
            options = chain.puts
            options = options.sort_values("impliedVolatility", ascending=False).head(5)

        # Prepare top 5 table
        top_5 = []
        for _, row in options.iterrows():
            top_5.append([
                row["contractSymbol"],
                str(row["strike"]),
                str(row["lastPrice"]),
                str(row["impliedVolatility"]),
                str(row["openInterest"]),
                str(row["volume"]),
                expiry
            ])

        # Prepare chart data (dummy P&L curve)
        chart_data = []
        strikes = [float(row[1]) for row in top_5]
        for price in np.linspace(min(strikes)*0.9, max(strikes)*1.1, 20):
            profit = (price - strikes[0]) * 10 if strategy == "bullish" else (strikes[0] - price) * 10
            chart_data.append({"price": round(price,2), "profit": round(profit,2)})

        summary = f"Top {strategy.capitalize()} trade for {ticker}: {top_5[0][0]} (Strike {top_5[0][1]}, IV {top_5[0][3]})"

        return (json.dumps({
            "summary": summary,
            "top_5": top_5,
            "chartData": chart_data
        }), 200, {"Content-Type": "application/json"})

    except Exception as e:
        return (json.dumps({"error": str(e)}), 500, {"Content-Type": "application/json"}) 