import streamlit as st
import pandas as pd

st.set_page_config(layout="wide", page_title="ETF Momentum Tracker")

st.title("🚀 ETF Momentum Rankings")
st.write("Current vs. Historical Rankings. Lower numbers (Green) = Strongest Momentum.")

try:
    # 1. Load Data
    df = pd.read_csv('rankings_history.csv', index_col=0)
    df.index = pd.to_datetime(df.index).date
    df = df.sort_index(ascending=True) # Sort oldest to newest for easier indexing

    # 2. Identify target dates for history (approximate trading days)
    # iloc[-1] is today, -21 is ~1 month, -30 is ~6 weeks, -42 is ~2 months
    current_ranks = df.iloc[-1]
    one_month_ago = df.iloc[-21] if len(df) >= 21 else df.iloc[0]
    six_weeks_ago = df.iloc[-30] if len(df) >= 30 else df.iloc[0]
    two_months_ago = df.iloc[-42] if len(df) >= 42 else df.iloc[0]

    # 3. Create a Summary Table for the left side
    summary_df = pd.DataFrame({
        "2 Months Ago": two_months_ago,
        "6 Wks Ago": six_weeks_ago,
        "1 Month Ago": one_month_ago,
        "Current Rank": current_ranks
    })

    # 4. Prepare the Heatmap data (Last 10 days)
    # We take the last 10 rows, transpose it so Tickers are rows
    heatmap_df = df.tail(10).T 

    # 5. Join them together
    # This puts your 3 new columns to the left of the daily heatmap
    final_df = pd.concat([summary_df, heatmap_df], axis=1)

    # 6. Styling Logic
    def color_rankings(val):
        if pd.isna(val): return ''
        if val <= 10: return 'background-color: #008000; color: white' # Leader
        elif val <= 25: return 'background-color: #90EE90; color: black' # Strong
        elif val <= 75: return 'background-color: #FFFFE0; color: black' # Neutral
        else: return 'background-color: #FFB6C1; color: black' # Weak

    # 7. Display
    st.subheader("Historical Shift vs. Recent Daily Trend")
    
    # We use a container to make it look clean
    st.dataframe(
        final_df.style.applymap(color_rankings).format(precision=0),
        use_container_width=True,
        height=800
    )

except Exception as e:
    st.error(f"Error loading dashboard: {e}")
    st.info("Ensure your rankings_history.csv has enough data (at least 42 rows) for historical comparisons.")
