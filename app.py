import streamlit as st
import pandas as pd
import urllib.parse

st.set_page_config(layout="wide", page_title="ETF Momentum Tracker")

st.title("🚀 ETF Momentum Rankings")
st.write("Click 'View Chart' to open the ticker in TradingView. Lower numbers (Green) = Strongest.")

try:
    # 1. Load Data
    df = pd.read_csv('rankings_history.csv', index_col=0)
    df.index = pd.to_datetime(df.index).date
    df = df.sort_index(ascending=True)

    # 2. Identify target dates
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

    # 4. Prepare Heatmap
    heatmap_df = df.tail(10).T 

    # 5. Join and Reset Index
    final_df = pd.concat([summary_df, heatmap_df], axis=1)
    final_df.reset_index(inplace=True)
    final_df.rename(columns={'index': 'Ticker'}, inplace=True)

    # --- UPDATED LINK LOGIC ---
    # This creates the specific format: https://www.tradingview.com/chart/hVInOgbe/?symbol=AMEX%3A{TICKER}
    # Using AMEX: as the prefix works for the vast majority of US ETFs in TradingView
    def create_tv_url(ticker):
        prefix = "AMEX" # Default for most ETFs
        encoded_sym = urllib.parse.quote(f"{prefix}:{ticker}")
        return f"https://www.tradingview.com/chart/hVInOgbe/?symbol={encoded_sym}"

    final_df['Chart'] = final_df['Ticker'].apply(create_tv_url)

    # 6. Styling
    def color_rankings(val):
        if not isinstance(val, (int, float)) or pd.isna(val): return ''
        if val <= 10: return 'background-color: #008000; color: white'
        elif val <= 25: return 'background-color: #90EE90; color: black'
        elif val <= 75: return 'background-color: #FFFFE0; color: black'
        else: return 'background-color: #FFB6C1; color: black'

    # 7. Final Display
    # We move 'Chart' to the front so it's the first thing you see
    cols = ['Chart', 'Ticker'] + [c for c in final_df.columns if c not in ['Chart', 'Ticker']]
    final_df = final_df[cols]

    st.data_editor(
        final_df.style.applymap(color_rankings, subset=final_df.columns.drop(['Ticker', 'Chart'])).format(precision=0),
        column_config={
            "Chart": st.column_config.LinkColumn(
                "Chart",
                display_text="View 📈"
            ),
            "Ticker": st.column_config.TextColumn("ETF Symbol", width="small")
        },
        hide_index=True,
        use_container_width=True,
        disabled=True,
        height=800
    )

except Exception as e:
    st.error(f"Error: {e}")
