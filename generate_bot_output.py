"""
Generate bot-readable versions of the ETF Momentum Rankings.

Produces static files that bots/scrapers can consume without rendering
the Streamlit JavaScript app:
  - api/rankings.json   (structured data for programmatic access)
  - api/latest.txt      (plain-text table for simple bots / Discord / IRC)
  - api/index.html      (minimal static HTML for web crawlers)

Run after update_ranks.py in the daily workflow.
"""

import json
import os
from datetime import datetime

import pandas as pd


def generate():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "rankings_history.csv")
    api_dir = os.path.join(script_dir, "api")

    if not os.path.exists(csv_path):
        print(f"rankings_history.csv not found at {csv_path}, skipping bot output generation.")
        return

    os.makedirs(api_dir, exist_ok=True)

    # ── Load data (same logic as app.py) ────────────────────────────
    df = pd.read_csv(csv_path, index_col=0)
    df.index = pd.to_datetime(df.index).strftime("%Y-%m-%d")
    df = df.sort_index(ascending=True)

    current_date = df.index[-1]
    current_ranks = df.iloc[-1]
    one_month_ago = df.iloc[-21] if len(df) >= 21 else df.iloc[0]
    six_weeks_ago = df.iloc[-30] if len(df) >= 30 else df.iloc[0]
    two_months_ago = df.iloc[-42] if len(df) >= 42 else df.iloc[0]

    summary = pd.DataFrame({
        "2 Mo Ago": two_months_ago,
        "6 Wk Ago": six_weeks_ago,
        "1 Mo Ago": one_month_ago,
        "Current": current_ranks,
    })

    heatmap = df.tail(10).T
    heatmap_dates = list(heatmap.columns)

    final = pd.concat([summary, heatmap], axis=1)
    final.index.name = "Ticker"
    final = final.sort_values("Current", ascending=True)

    # ── Helper: tier label ──────────────────────────────────────────
    def tier(rank):
        if pd.isna(rank):
            return "N/A"
        rank = int(rank)
        if rank <= 10:
            return "strong"
        if rank <= 25:
            return "good"
        if rank <= 75:
            return "neutral"
        return "weak"

    # ── 1. JSON output ──────────────────────────────────────────────
    rankings_list = []
    for ticker, row in final.iterrows():
        cur = row["Current"]
        entry = {
            "ticker": ticker,
            "current_rank": None if pd.isna(cur) else int(cur),
            "tier": tier(cur),
            "1_mo_ago": None if pd.isna(row["1 Mo Ago"]) else int(row["1 Mo Ago"]),
            "6_wk_ago": None if pd.isna(row["6 Wk Ago"]) else int(row["6 Wk Ago"]),
            "2_mo_ago": None if pd.isna(row["2 Mo Ago"]) else int(row["2 Mo Ago"]),
            "rank_history": {
                d: (None if pd.isna(row[d]) else int(row[d]))
                for d in heatmap_dates
            },
        }
        rankings_list.append(entry)

    json_payload = {
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "current_date": current_date,
        "total_etfs": len(rankings_list),
        "tier_guide": {
            "strong": "Rank 1-10",
            "good": "Rank 11-25",
            "neutral": "Rank 26-75",
            "weak": "Rank 76+",
        },
        "rankings": rankings_list,
    }

    json_path = os.path.join(api_dir, "rankings.json")
    with open(json_path, "w") as f:
        json.dump(json_payload, f, indent=2)
    print(f"Wrote {json_path}")

    # ── 2. Plain-text table ─────────────────────────────────────────
    lines = []
    lines.append(f"ETF Momentum Rankings  (as of {current_date})")
    lines.append("Lower rank = stronger momentum.  Tiers: 1-10 strong | 11-25 good | 26-75 neutral | 76+ weak")
    lines.append("")

    header = f"{'Ticker':<8} {'Current':>7} {'1MoAgo':>7} {'6WkAgo':>7} {'2MoAgo':>7}  {'Tier':<8}"
    lines.append(header)
    lines.append("-" * len(header))

    for ticker, row in final.iterrows():
        cur = row["Current"]
        fmt = lambda v: "   -" if pd.isna(v) else f"{int(v):4d}"
        lines.append(
            f"{ticker:<8} {fmt(cur):>7} {fmt(row['1 Mo Ago']):>7} "
            f"{fmt(row['6 Wk Ago']):>7} {fmt(row['2 Mo Ago']):>7}  {tier(cur):<8}"
        )

    lines.append("")
    lines.append("--- 10-Day Rank History ---")
    lines.append("")

    hist_header = f"{'Ticker':<8} " + " ".join(f"{d[-5:]:>5}" for d in heatmap_dates)
    lines.append(hist_header)
    lines.append("-" * len(hist_header))

    for ticker, row in final.iterrows():
        vals = " ".join(
            f"{'  -':>5}" if pd.isna(row[d]) else f"{int(row[d]):5d}"
            for d in heatmap_dates
        )
        lines.append(f"{ticker:<8} {vals}")

    txt = "\n".join(lines) + "\n"
    txt_path = os.path.join(api_dir, "latest.txt")
    with open(txt_path, "w") as f:
        f.write(txt)
    print(f"Wrote {txt_path}")

    # ── 3. Static HTML ──────────────────────────────────────────────
    def rank_color(val):
        if pd.isna(val):
            return ""
        val = int(val)
        if val <= 10:
            return "background:#008000;color:#fff"
        if val <= 25:
            return "background:#90EE90"
        if val <= 75:
            return "background:#FFFFE0"
        return "background:#FFB6C1"

    html_parts = []
    html_parts.append("<!DOCTYPE html>")
    html_parts.append('<html lang="en"><head><meta charset="utf-8">')
    html_parts.append(f"<title>ETF Momentum Rankings - {current_date}</title>")
    html_parts.append("<style>")
    html_parts.append("body{font-family:monospace;margin:20px}")
    html_parts.append("table{border-collapse:collapse;width:100%}")
    html_parts.append("th,td{border:1px solid #ccc;padding:4px 8px;text-align:right}")
    html_parts.append("th{background:#333;color:#fff}")
    html_parts.append("td:first-child,th:first-child{text-align:left}")
    html_parts.append("</style></head><body>")
    html_parts.append(f"<h1>ETF Momentum Rankings</h1>")
    html_parts.append(f"<p>As of <strong>{current_date}</strong>. Lower rank = stronger momentum.</p>")
    html_parts.append(f"<p>Tiers: <span style='background:#008000;color:#fff;padding:2px 6px'>1-10 Strong</span> "
                       f"<span style='background:#90EE90;padding:2px 6px'>11-25 Good</span> "
                       f"<span style='background:#FFFFE0;padding:2px 6px'>26-75 Neutral</span> "
                       f"<span style='background:#FFB6C1;padding:2px 6px'>76+ Weak</span></p>")

    # Summary table
    html_parts.append("<table><thead><tr>")
    html_parts.append("<th>Ticker</th><th>Current</th><th>1 Mo Ago</th><th>6 Wk Ago</th><th>2 Mo Ago</th>")
    for d in heatmap_dates:
        html_parts.append(f"<th>{d[-5:]}</th>")
    html_parts.append("</tr></thead><tbody>")

    for ticker, row in final.iterrows():
        html_parts.append("<tr>")
        html_parts.append(f"<td><strong>{ticker}</strong></td>")
        for col in ["Current", "1 Mo Ago", "6 Wk Ago", "2 Mo Ago"] + heatmap_dates:
            val = row[col]
            style = rank_color(val)
            display = "-" if pd.isna(val) else str(int(val))
            html_parts.append(f'<td style="{style}">{display}</td>')
        html_parts.append("</tr>")

    html_parts.append("</tbody></table>")
    html_parts.append('<h2>Bot-Readable Endpoints</h2>')
    html_parts.append("<ul>")
    html_parts.append('<li><strong>JSON:</strong> <a href="https://raw.githubusercontent.com/distanlo/momentum-tracker/main/api/rankings.json">api/rankings.json</a></li>')
    html_parts.append('<li><strong>Plain Text:</strong> <a href="https://raw.githubusercontent.com/distanlo/momentum-tracker/main/api/latest.txt">api/latest.txt</a></li>')
    html_parts.append('<li><strong>HTML:</strong> <a href="https://raw.githubusercontent.com/distanlo/momentum-tracker/main/api/index.html">api/index.html</a></li>')
    html_parts.append("</ul>")
    html_parts.append(f'<p style="margin-top:20px;color:#666">Generated {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}</p>')
    html_parts.append("</body></html>")

    html_path = os.path.join(api_dir, "index.html")
    with open(html_path, "w") as f:
        f.write("\n".join(html_parts))
    print(f"Wrote {html_path}")


if __name__ == "__main__":
    generate()
