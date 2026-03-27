# CLAUDE.md — AI Assistant Guide for momentum-tracker

## Project Overview

**momentum-tracker** is a lightweight, fully automated ETF momentum ranking system. It tracks 96 ETFs using a 12-1 momentum metric, updates daily via GitHub Actions, and serves results in three output formats (JSON, plain text, HTML) plus an interactive Streamlit dashboard.

**No backend server, no database, no authentication required.**

---

## Repository Structure

```
momentum-tracker/
├── .github/
│   └── workflows/
│       └── daily_update.yml   # GitHub Actions: runs daily at 02:00 UTC
├── api/                       # Generated output files (committed by bot)
│   ├── index.html             # Static HTML rankings page
│   ├── latest.txt             # Plain-text rankings table
│   └── rankings.json          # Structured JSON API endpoint
├── app.py                     # Streamlit interactive dashboard
├── update_ranks.py            # Core momentum calculation + CSV update
├── generate_bot_output.py     # Generates api/ output files (3 formats)
├── tickers.json               # List of 96 ETF symbols tracked
├── rankings_history.csv       # Rolling 365-day ranking history (time-series CSV)
└── README.md                  # Minimal project readme
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web UI | Streamlit |
| Data manipulation | pandas |
| Financial data | yfinance (Yahoo Finance) |
| Automation | GitHub Actions (cron + manual dispatch) |
| Storage | CSV flat file (no database) |
| Python version | 3.10+ |

---

## Data Pipeline

### How Rankings Work

1. **Momentum metric**: `(price_21d_ago / price_252d_ago) - 1`
   - 21 trading days ≈ 1 month; 252 trading days ≈ 1 year
   - This is the standard "12-1 momentum" (12-month return, skipping most recent month)
2. **Ranking**: Lower number = stronger momentum. Rank 1 is the best-performing ETF.
3. **Tiers**:
   - Ranks 1–10: Strong (dark green)
   - Ranks 11–25: Good (light green)
   - Ranks 26–75: Neutral (yellow)
   - Ranks 76+: Weak (pink/red)

### Daily Update Flow

```
GitHub Actions cron (02:00 UTC)
  → update_ranks.py       # Download prices, calculate momentum, append to CSV
  → generate_bot_output.py  # Generate api/rankings.json, api/latest.txt, api/index.html
  → git commit + push     # Automated commit: "Automated Daily Rank Update"
```

### Data Files

- **`tickers.json`** — Source of truth for tracked ETF symbols. Single JSON object with a `"symbols"` array of 96 strings.
- **`rankings_history.csv`** — Time-series CSV. Rows = trading days (YYYY-MM-DD), columns = ETF symbols. Values = integer ranks (1–96). Maintained as a rolling 365-day window.
- **`api/`** — All files in this directory are auto-generated. Do not manually edit them.

---

## Key Files

### `update_ranks.py`

Core data logic. Responsibilities:
- Loads ticker list from `tickers.json`
- Downloads 2 years of OHLCV data from Yahoo Finance via `yfinance`
- Handles MultiIndex DataFrame columns (multi-ticker yfinance output)
- Forward-fills missing data (`ffill`) for non-trading days
- Calculates momentum: `(close[day-21] / close[day-252]) - 1`
- Skips duplicate dates (idempotent — safe to re-run)
- Appends new row to `rankings_history.csv`
- Trims history to last 365 rows
- Catches all exceptions without re-raising (graceful degradation on holidays/weekends)

### `generate_bot_output.py`

Generates three output formats from `rankings_history.csv`:
- **`api/rankings.json`** — Full structured JSON with metadata, tier info, current ranks, historical snapshots (1 mo, 6 wk, 2 mo ago), and 10-day rank history per ETF.
- **`api/latest.txt`** — Tab-aligned plain text table for Discord/IRC bots.
- **`api/index.html`** — Self-contained styled HTML page with tier legend and links.

Snapshots use approximate business-day offsets: 1 month ≈ 21 rows back, 6 weeks ≈ 30 rows back, 2 months ≈ 42 rows back.

### `app.py`

Streamlit dashboard. Responsibilities:
- Reads `rankings_history.csv`
- Displays current rankings alongside snapshots (2 months ago, 6 weeks ago, 1 month ago)
- Renders a 10-day heatmap per ETF
- Color-codes cells by tier using Streamlit's `background_gradient` or manual styling
- Generates clickable TradingView chart links: `https://www.tradingview.com/chart/hVInOgbe/?symbol=AMEX%3A{TICKER}`
- Layout: wide, 800px table height, read-only data editor

---

## Development Conventions

### Code Style

- **No classes or OOP** — all scripts are procedural top-level code
- **No type annotations** (Python 3.10 is min; yfinance compatibility is a concern)
- **Variable naming**: `df` for main DataFrames, `p_21d`/`p_252d` for price snapshots, `history` for the CSV DataFrame
- **Error handling**: `try/except Exception as e: print(e)` — never re-raise; scripts must exit cleanly even on data errors
- **No external config beyond** `tickers.json` — hardcode constants directly in scripts

### Adding a New ETF

1. Add the ticker symbol string to the `"symbols"` array in `tickers.json`
2. The next daily run will automatically include it in rankings
3. Historical rankings for the new ticker will be missing until next run (NaN → handled via ffill)

### Modifying the Momentum Formula

The calculation lives in `update_ranks.py` around lines 30–45. The key line is:
```python
momentum = (close.iloc[-21] / close.iloc[-252]) - 1
```
The DataFrame is sorted ascending by date so `iloc[-1]` is the most recent day.

### Output Format Changes

All three output formats are generated independently in `generate_bot_output.py`. Each has its own section in the file. Tier boundaries are defined as constants near the top of the function — update them consistently across all three format sections.

---

## GitHub Actions Workflow

File: `.github/workflows/daily_update.yml`

- **Schedule**: `cron: '0 2 * * *'` (02:00 UTC daily, after US market close)
- **Manual trigger**: `workflow_dispatch` enabled
- **Runner**: `ubuntu-latest`
- **Python**: 3.10
- **Dependencies installed**: `yfinance pandas` (pip, no requirements.txt)
- **Git config**: Sets `github-actions[bot]` user for automated commits
- **Commit message**: `"Automated Daily Rank Update"`
- **Skips empty commits**: Uses `git diff --quiet` check before committing

To add a new dependency, update the `pip install` line in the workflow file directly — there is no `requirements.txt`.

---

## No-Test Environment

There is no test suite. Validation strategies:
- Scripts are written to be idempotent (safe to re-run without corrupting data)
- Duplicate date detection prevents double-writes to CSV
- Errors are caught and printed rather than raised, so the CI workflow completes even on bad data
- When making changes, manually verify output by running scripts locally:
  ```bash
  python update_ranks.py
  python generate_bot_output.py
  streamlit run app.py
  ```

---

## Running Locally

```bash
# Install dependencies
pip install streamlit pandas yfinance

# Run the daily update manually
python update_ranks.py

# Generate API output files
python generate_bot_output.py

# Launch the web dashboard
streamlit run app.py
```

No environment variables or secrets are required.

---

## Important Constraints

- **Do not edit `api/` files manually** — they are overwritten by `generate_bot_output.py` on every run.
- **Do not remove the duplicate-date check** in `update_ranks.py` — it prevents data corruption when the workflow is triggered multiple times.
- **Preserve error suppression** in both scripts — the GitHub Actions workflow must exit 0 even on weekends/holidays when markets are closed.
- **Keep `rankings_history.csv` in version control** — it is the only persistent store; there is no database.
- **TradingView links use the `AMEX:` prefix** for all tickers. This is hardcoded in both `app.py` and `generate_bot_output.py` — update both if the exchange prefix ever needs to change.
- **`yfinance` API is not guaranteed stable** — if downloads fail or column names change (MultiIndex behavior), check yfinance release notes first.

---

## Branch and Git Conventions

- **Main branch**: `main` — production data, auto-committed daily by GitHub Actions bot
- **No PR workflow** for automated commits (bot pushes directly to `main`)
- Human changes should be reviewed before merging to `main`
- Automated commit messages follow the format: `"Automated Daily Rank Update"`
