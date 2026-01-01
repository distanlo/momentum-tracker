import streamlit as st
import pandas as pd

st.set_page_config(layout="wide", page_title="ETF Momentum Tracker")

st.title("🚀 ETF Momentum Rankings")
st.write("Ranking of 100 ETFs based on 12-1 Month Momentum. Lower numbers (Green) = Strongest.")

try:
    # --- THE FIX IS HERE: index_col=0 ---
    df = pd.read_csv('rankings_history.csv', index_col=0)
    
    # Clean up the index to show only dates
    df.index = pd.to_datetime(df.index).date
    
    # We want to see the most recent dates first
    df = df.sort_index(ascending=False)

    # Function to color the cells: Top 10 = Dark Green, Top 25 = Light Green, etc.
    def color_rankings(val):
        if val <= 10:
            return 'background-color: #008000; color: white' # Dark Green
        elif val <= 25:
            return 'background-color: #90EE90; color: black' # Light Green
        elif val <= 75:
            return 'background-color: #FFFFE0; color: black' # Light Yellow
        else:
            return 'background-color: #FFB6C1; color: black' # Light Red

    # Display the last 15 days, transposed so Tickers are on the left
    st.subheader("Daily Rankings Heatmap (Last 15 Trading Days)")
    styled_df = df.head(15).T.style.applymap(color_rankings).format(precision=0)
    
    st.dataframe(styled_df, use_container_width=True, height=600)

except Exception as e:
    st.error(f"Error loading data: {e}")
    st.write("Please ensure rankings_history.csv exists and is formatted correctly.")
