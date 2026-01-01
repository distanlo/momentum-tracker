import yfinance as yf
import pandas as pd
import json
import datetime
import os

def update():
    # 1. Load Tickers
    with open('tickers.json', 'r') as f:
        tickers = json.load(f)['symbols']

    # 2. Download recent data (enough to calculate 12-1 momentum)
    # We need at least 252 trading days of history
    data = yf.download(tickers, period="2y", auto_adjust=True)['Close']
    
    # Handle MultiIndex
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)
    
    data = data.ffill()

    # 3. Calculate today's ranking
    # Momentum = Price 21 days ago / Price 252 days ago - 1
    p_now = data.iloc[-1] # Most recent closing price
    p_21d = data.iloc[-21]
    p_252d = data.iloc[-252]
    
    momentum_scores = (p_21d / p_252d) - 1
    new_ranks = momentum_scores.dropna().rank(ascending=False, method='min')
    
    today_str = data.index[-1].strftime('%Y-%m-%d')

    # 4. Load history and append
    df_history = pd.read_csv('rankings_history.csv', index_col=0)
    
    # Update or Add the row for today
    df_history.loc[today_str] = new_ranks
    
    # Keep only the last 300 days of data to keep the file small/fast
    df_history = df_history.tail(300)
    
    # Save back to CSV
    df_history.to_csv('rankings_history.csv')
    print(f"Successfully updated rankings for {today_str}")

if __name__ == "__main__":
    update()
