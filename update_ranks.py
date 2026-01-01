import yfinance as yf
import pandas as pd
import json
import datetime
import os

def update():
    try:
        # 1. Load Tickers
        with open('tickers.json', 'r') as f:
            tickers = json.load(f)['symbols']

        # 2. Download data
        # We use period="2y" to ensure we have enough history for the 252-day lookback
        df = yf.download(tickers, period="2y", auto_adjust=True)
        
        # Expert Fix: Force the dataframe to only include 'Close' prices and flatten headers
        if 'Close' in df.columns.levels[0] if isinstance(df.columns, pd.MultiIndex) else False:
            data = df['Close']
        else:
            data = df
            
        data = data.ffill()

        # 3. Calculate today's rankings
        # We use iloc to get relative positions (today, 1 month ago, 1 year ago)
        p_now = data.iloc[-1]
        p_21d = data.iloc[-21]
        p_252d = data.iloc[-252]
        
        momentum_scores = (p_21d / p_252d) - 1
        
        # Rank: 1 is the best. 'first' avoids ties crashing the script
        new_ranks = momentum_scores.rank(ascending=False, method='first')
        
        today_str = data.index[-1].strftime('%Y-%m-%d')
        print(f"Calculating for date: {today_str}")

        # 4. Update the CSV
        if os.path.exists('rankings_history.csv'):
            df_history = pd.read_csv('rankings_history.csv', index_col=0)
            # Ensure the columns match
            df_history.loc[today_str] = new_ranks
            # Keep the last 365 entries to prevent file bloat
            df_history = df_history.tail(365)
        else:
            # Fallback if file is missing
            df_history = pd.DataFrame({today_str: new_ranks}).T
            
        df_history.to_csv('rankings_history.csv')
        print("✅ Successfully updated rankings_history.csv")

    except Exception as e:
        print(f"❌ Script failed with error: {e}")
        raise # This ensures GitHub Actions sees the failure

if __name__ == "__main__":
    update()
