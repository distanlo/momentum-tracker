import streamlit as st
import pandas as pd

st.set_page_config(layout="wide", page_title="ETF Momentum Tracker")

st.title("🚀 ETF Momentum Rankings")
st.write("Click a Ticker to open its chart on TradingView. Lower numbers (Green) = Strongest Momentum.")

try:
    # 1. Load Data
    df = pd.read_csv('rankings_history.csv', index_col=0)
    df.index = pd.to_datetime(df.index).date
    df = df.sort_index(ascending=True)

    # 2. Identify target dates for history
    current_ranks = df.iloc[-1]
    one_month_ago = df.iloc[-21] if len(df) >= 21 else df.iloc[0]
    six_weeks_ago = df.iloc[-30] if len(df) >= 30 else df.iloc[0]
    two_months_ago = df.iloc[-42] if len(df) >= 42 else df.iloc[0]

    # 3. Create Summary Table
    summary_df = pd.DataFrame({
        "2 Mo Ago": two_months_ago,
        "6 Wk Ago": six_weeks_ago,
        "1 Mo Ago": one_month_ago,
        "Current": current_ranks
    })

    # 4. Prepare Heatmap (Last 10 days)
    heatmap_df = df.tail(10).T 

    # 5. Join them
    final_df = pd.concat([summary_df, heatmap_df], axis=1)

    # --- NEW: Convert Tickers to TradingView Links ---
    # We create a new index with Markdown links
    link_template = "[{ticker}](https://www.tradingview.com/symbols/{ticker}/)"
    final_df.index = [link_template.format(ticker=t) for t in final_df.index]

    # 6. Styling Logic
    def color_rankings(val):
        if pd.isna(val): return ''
        if val <= 10: return 'background-color: #008000; color: white'
        elif val <= 25: return 'background-color: #90EE90; color: black'
        elif val <= 75: return 'background-color: #FFFFE0; color: black'
        else: return 'background-color: #FFB6C1; color: black'

    # 7. Display with column configuration for links
    st.subheader("Historical Shift vs. Recent Daily Trend")
    
    # st.column_config.LinkColumn makes the Markdown clickable in the index/first column
    st.dataframe(
        final_df.style.applymap(color_rankings).format(precision=0),
        use_container_width=True,
        height=800
    )

except Exception as e:
    st.error(f"Error loading dashboard: {e}")
