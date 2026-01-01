import streamlit as st
import pandas as pd

st.title("🚀 Stock Momentum Tracker")

df = pd.read_csv('rankings_history.csv', index_index=0)
# We show the last 10 days of ranking changes
st.write("Current Rankings (Lower is better/higher rank)")
st.dataframe(df.tail(10).style.background_gradient(cmap='RdYlGn_r'))
