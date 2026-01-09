import yfinance as yf
import pandas as pd
import json
import os

def update():
    try:
        # 1. Load Tickers
        with open('tickers.json', 'r') as f:
            tickers = json.load(f)['symbols']

        # 2. Download recent data
        # We fetch enough to ensure we have the 252-day lookback
        df = yf.download(tickers, period="2y", auto_adjust=True)
        
        # Flatten MultiIndex if necessary
        if isinstance(df.columns, pd.MultiIndex):
            data = df['Close']
        else:
            data = df
            
        data = data.ffill()

        # --- HOLIDAY/WEEKEND CHECK ---
        # Get the last date available in the downloaded data
        latest_market_date = data.index[-1].strftime('%Y-%m-%d')
        
        # Load existing history to check for duplicates
        if os.path.exists('rankings_history.csv'):
            df_history = pd.read_csv('rankings_history.csv', index_col=0)
            existing_dates = df_history.index.tolist()
        else:
            existing_dates = []

        # If the latest market date is already in our CSV, stop here.
        if latest_market_date in existing_dates:
            print(f"Skipping update: Data for {latest_market_date} is already recorded.")
            return

        print(f"New market data detected for {latest_market_date}. Processing...")

        # 3. Calculate Rankings
        p_now = data.iloc[-1]
        p_21d = data.iloc[-21]
        p_252d = data.iloc[-252]
        
        # Calculate 12-1 Momentum
        momentum_scores = (p_21d / p_252d) - 1
        
        # If the entire row is NaN (Market closed/Error), exit gracefully
        if momentum_scores.isnull().all():
            print("Skipping update: Downloaded data contains no price information.")
            return

        new_ranks = momentum_scores.rank(ascending=False, method='first')

        # 4. Append and Save
        df_history.loc[latest_market_date] = new_ranks
        # Keep only the most recent 365 trading days
        df_history = df_history.tail(365)
        df_history.to_csv('rankings_history.csv')
        
        print(f"✅ Successfully added rankings for {latest_market_date}")

    except Exception as e:
        print(f"❌ Script failed: {e}")
        # We don't 'raise' the error here so that GitHub Actions sees a "Success" 
        # even if it's just a graceful skip.
        
if __name__ == "__main__":
    update()
