# dashboard/app.py
# Gajian Aman — Streamlit Dashboard (multi-page, dark theme)

import html as _html
import calendar
import math
import os
from datetime import date

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

# ─────────────────────────────────────────
# PAGE CONFIG
# ─────────────────────────────────────────
st.set_page_config(
    page_title="Gajian Aman",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────
# GLOBAL CSS — Nomad Agency dark theme
# ─────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --green:#0d9b76; --green-lt:rgba(13,155,118,0.12);
    --red:#f87171;   --red-lt:rgba(248,113,113,0.12);
    --amber:#fbbf24; --blue:#3b82f6;
    --bg:#0f1117;    --surface:#161b27; --border:#1e2535;
    --text-1:#f1f5f9; --text-2:#94a3b8; --text-3:#64748b;
    --font:'Plus Jakarta Sans',sans-serif;
    --mono:'DM Mono',monospace;
  }

  html, body, [class*="css"] { font-family: var(--font) !important; }
  .stApp { background: var(--bg) !important; }
  #MainMenu, footer, header { visibility: hidden; }
  .block-container { padding-top: 1.5rem !important; }

  section[data-testid="stSidebar"] {
    background: var(--surface) !important;
    border-right: 1px solid var(--border);
  }
  section[data-testid="stSidebar"] * { color: var(--text-2) !important; }

  h1, h2, h3 { color: var(--text-1) !important; }
  hr { border-color: var(--border) !important; }

  /* Metric cards */
  div[data-testid="metric-container"] {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem 1.25rem;
  }
  div[data-testid="metric-container"] label {
    font-size: 11px !important; color: var(--text-3) !important;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  div[data-testid="metric-container"] [data-testid="stMetricValue"] {
    font-family: var(--mono) !important; font-size: 22px !important;
    font-weight: 500 !important; color: var(--text-1) !important;
  }

  /* Number input centering */
  input[type="number"] { text-align: center !important; }

  /* KPI card */
  .kpi-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px 14px 14px 17px;
    position: relative; overflow: hidden; margin-bottom: 4px;
  }
  .kpi-accent { position:absolute; top:0; left:0; width:3px; height:100%; border-radius:3px 0 0 3px; }
  .kpi-label  { font-size:9px; font-weight:700; color:var(--text-3); text-transform:uppercase;
                letter-spacing:.7px; margin-bottom:6px; }
  .kpi-value  { font-family:var(--mono); font-size:22px; font-weight:500; color:var(--text-1); line-height:1.1; }
  .kpi-sub    { font-size:10px; color:var(--text-3); margin-top:4px; }

  /* GA card */
  .ga-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; margin-bottom: 12px;
  }
  .ga-card-title { font-size:10px; font-weight:700; color:var(--text-3);
                   text-transform:uppercase; letter-spacing:.6px; margin-bottom:14px; }

  /* Category bar row */
  .bar-row   { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
  .bar-row:last-child { margin-bottom:0; }
  .bar-emoji { font-size:13px; width:20px; text-align:center; flex-shrink:0; }
  .bar-label { font-size:12px; font-weight:500; color:var(--text-2); flex:1; min-width:0;
               white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bar-track { background:#1e2535; border-radius:4px; height:6px; overflow:hidden; flex-shrink:0; width:80px; }
  .bar-fill  { height:100%; border-radius:4px; }
  .bar-amt   { font-family:var(--mono); font-size:10px; color:var(--text-2); width:56px; text-align:right; flex-shrink:0; }

  /* Budget row */
  .bgt-row   { margin-bottom:13px; }
  .bgt-row:last-child { margin-bottom:0; }
  .bgt-head  { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
  .bgt-name  { font-size:13px; font-weight:600; color:var(--text-1); }
  .bgt-nums  { font-family:var(--mono); font-size:11px; color:var(--text-2); display:flex; align-items:center; gap:6px; }
  .bgt-muted { color:var(--text-3); }
  .bgt-track { background:#1e2535; border-radius:4px; height:6px; overflow:hidden; }
  .bgt-fill  { height:100%; border-radius:4px; }
  .bgt-over  { font-size:10px; color:var(--red); font-weight:600; margin-top:3px; }

  /* Transaction item */
  .tx-item  { display:flex; align-items:center; gap:10px; padding:9px 0;
              border-bottom:1px solid var(--border); }
  .tx-item:last-child  { border-bottom:none; }
  .tx-icon  { width:34px; height:34px; border-radius:10px; display:flex; align-items:center;
              justify-content:center; font-size:14px; flex-shrink:0; }
  .tx-info  { flex:1; min-width:0; }
  .tx-name  { font-size:12px; font-weight:600; color:var(--text-1);
              white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tx-cat   { font-size:10px; color:var(--text-3); margin-top:1px; }
  .tx-amt   { font-family:var(--mono); font-size:13px; font-weight:500; flex-shrink:0; }

  /* Goal item */
  .goal-item { display:flex; align-items:center; gap:10px; padding:10px 12px;
               background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:8px;
               border:1px solid var(--border); }
  .goal-item:last-child { margin-bottom:0; }
  .goal-info  { flex:1; min-width:0; }
  .goal-name  { font-size:13px; font-weight:700; color:var(--text-1); margin-bottom:3px; }
  .goal-prog  { font-family:var(--mono); font-size:10px; color:var(--text-2); }
  .goal-dl    { font-size:9px; color:var(--text-3); margin-top:2px; }

  /* Income allocation */
  .alloc-bar  { display:flex; height:10px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:10px; }
  .alloc-seg  { height:100%; border-radius:4px; }
  .alloc-leg  { display:flex; flex-wrap:wrap; gap:8px 16px; }
  .alloc-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-2); }
  .alloc-dot  { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
  .alloc-lbl  { font-weight:500; }
  .alloc-pct  { font-family:var(--mono); color:var(--text-3); margin-left:2px; }

  /* Login */
  .ft-login-box {
    background: rgba(13,155,118,0.08); border: 1px solid rgba(13,155,118,0.25);
    border-radius: 10px; padding: 12px 14px; font-size: 11px;
    color: var(--text-2); line-height: 1.7; margin-top: 8px;
  }

  /* AI strip */
  .ai-strip {
    background: linear-gradient(135deg,#0a6b52 0%,#0d9b76 100%);
    border-radius: 12px; padding: 14px 16px;
    display: flex; align-items: flex-start; gap: 12px;
    margin-bottom: 16px; box-shadow: 0 2px 14px rgba(13,155,118,.2);
  }
  .ai-icon { font-size:15px; background:rgba(255,255,255,.15); border-radius:8px;
             padding:5px 7px; line-height:1; flex-shrink:0; margin-top:2px; }
  .ai-body { flex:1; }
  .ai-tag  { font-size:9px; font-weight:700; letter-spacing:.8px; color:rgba(255,255,255,.6);
             text-transform:uppercase; margin-bottom:4px; }
  .ai-text { font-size:13px; font-weight:500; color:#fff; line-height:1.6; }
  .ai-text b { font-weight:700; }
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────
CATEGORY_COLORS = {
    "Food & Dining":    "#f87171",
    "Transport":        "#3b82f6",
    "Groceries":        "#0d9b76",
    "Bills & Utilities":"#8b5cf6",
    "Shopping":         "#fbbf24",
    "Health":           "#fb923c",
    "Entertainment":    "#ec4899",
    "Education":        "#34d399",
    "Other":            "#64748b",
    "Salary":           "#0d9b76",
    "Freelance":        "#3b82f6",
    "Other Income":     "#34d399",
}
CATEGORY_ICONS = {
    "Food & Dining":    "🍜", "Transport":        "🚗",
    "Groceries":        "🛒", "Bills & Utilities":"📱",
    "Shopping":         "🛍️", "Health":           "💊",
    "Entertainment":    "🎮", "Education":        "📚",
    "Other":            "📁", "Salary":           "💼",
    "Freelance":        "💻", "Other Income":     "💰",
    "Dining Out":       "🍽️", "Personal Care":   "💆",
    "Investment":       "📊", "Savings":          "🏦",
}

# Plotly base — NO xaxis/yaxis here to avoid duplicate-kwarg conflict
PLOTLY_BASE = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font_family="Plus Jakarta Sans",
    font_color="#94a3b8",
    title_font_color="#f1f5f9",
    colorway=["#0d9b76","#3b82f6","#8b5cf6","#fbbf24","#f87171","#34d399","#ec4899"],
)
GRID = dict(gridcolor="#1e2535", zerolinecolor="#1e2535", linecolor="#1e2535")


def cat_color(name: str) -> str:
    return CATEGORY_COLORS.get(name, "#64748b")

def cat_icon(name: str) -> str:
    return CATEGORY_ICONS.get(name, "📁")

def fmt_idr(amount: float, compact: bool = False) -> str:
    abs_amt = abs(amount)
    neg = "−" if amount < 0 else ""
    if compact and abs_amt >= 1_000_000:
        return f"{neg}Rp {abs_amt/1_000_000:.1f}jt"
    if compact and abs_amt >= 1_000:
        return f"{neg}Rp {int(abs_amt/1_000)}K"
    return f"{neg}Rp {int(abs_amt):,}".replace(",", ".")


# ─────────────────────────────────────────
# DB CONNECTION
# ─────────────────────────────────────────
@st.cache_resource
def get_engine():
    url = os.getenv("DATABASE_URL_SYNC")
    if not url:
        st.error("DATABASE_URL_SYNC not set. Add it in Streamlit Cloud → Settings → Secrets.")
        st.stop()
    return create_engine(url, pool_pre_ping=True)


# ─────────────────────────────────────────
# DATA FETCHERS
# ─────────────────────────────────────────
@st.cache_data(ttl=120)
def fetch_transactions(user_id: int, month: int, year: int) -> pd.DataFrame:
    with get_engine().connect() as conn:
        df = pd.read_sql(text("""
            SELECT id, amount::float, type, category, subcategory, note,
                   date::date AS date
            FROM transactions
            WHERE user_id = :uid
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
            ORDER BY date DESC, id DESC
        """), conn, params={"uid": user_id, "month": month, "year": year})
    df["date"] = pd.to_datetime(df["date"])
    return df


@st.cache_data(ttl=120)
def fetch_all_transactions(user_id: int) -> pd.DataFrame:
    with get_engine().connect() as conn:
        df = pd.read_sql(text("""
            SELECT amount::float, type, category, date::date AS date
            FROM transactions
            WHERE user_id = :uid
            ORDER BY date
        """), conn, params={"uid": user_id})
    df["date"] = pd.to_datetime(df["date"])
    return df


@st.cache_data(ttl=120)
def fetch_budgets(user_id: int, month: int, year: int) -> pd.DataFrame:
    with get_engine().connect() as conn:
        return pd.read_sql(text("""
            SELECT b.category, b.amount as budget,
                   COALESCE(SUM(t.amount), 0) as actual
            FROM budgets b
            LEFT JOIN transactions t
                ON t.user_id = b.user_id
               AND t.category = b.category
               AND t.type = 'expense'
               AND EXTRACT(MONTH FROM t.date) = b.month
               AND EXTRACT(YEAR FROM t.date) = b.year
            WHERE b.user_id = :uid AND b.month = :month AND b.year = :year
            GROUP BY b.category, b.amount
        """), conn, params={"uid": user_id, "month": month, "year": year})


@st.cache_data(ttl=120)
def fetch_goals(user_id: int) -> pd.DataFrame:
    with get_engine().connect() as conn:
        return pd.read_sql(text("""
            SELECT name, target_amount, saved_amount, deadline
            FROM goals WHERE user_id = :uid
        """), conn, params={"uid": user_id})


# ─────────────────────────────────────────
# HTML COMPONENT BUILDERS
# ─────────────────────────────────────────
def kpi_card(label: str, value: str, sub: str, accent: str, sub_color: str = "var(--text-3)") -> str:
    return f"""
    <div class="kpi-card">
      <div class="kpi-accent" style="background:{accent}"></div>
      <div class="kpi-label">{_html.escape(label)}</div>
      <div class="kpi-value">{_html.escape(value)}</div>
      <div class="kpi-sub" style="color:{sub_color}">{_html.escape(sub)}</div>
    </div>"""


def ai_strip_html(parts: list) -> str:
    inner = "".join(f"<b>{_html.escape(t)}</b>" if bold else _html.escape(t) for bold, t in parts)
    return f"""
    <div class="ai-strip">
      <div class="ai-icon">✦</div>
      <div class="ai-body">
        <div class="ai-tag">AI Insight</div>
        <div class="ai-text">{inner}</div>
      </div>
    </div>"""


def category_bars_html(rows: list, max_amount: float) -> str:
    items = ""
    for r in rows:
        pct = round(r["amount"] / max_amount * 100) if max_amount else 0
        items += f"""
        <div class="bar-row">
          <span class="bar-emoji">{cat_icon(r["name"])}</span>
          <span class="bar-label">{_html.escape(r["name"])}</span>
          <div class="bar-track"><div class="bar-fill" style="width:{pct}%;background:{r['color']}"></div></div>
          <span class="bar-amt">{_html.escape(fmt_idr(r['amount'], compact=True))}</span>
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">Per Kategori</div>{items}</div>'


def budget_rows_html(budgets: list) -> str:
    items = ""
    for b in budgets:
        raw_pct   = b["actual"] / b["budget"] * 100 if b["budget"] else 0
        pct       = min(round(raw_pct), 100)
        over      = b["actual"] > b["budget"]
        warn      = raw_pct > 80
        bar_color = "#f87171" if over else ("#fbbf24" if warn else "#0d9b76")
        indicator = "🔴" if over else ("🟡" if warn else "🟢")
        over_html = (f'<div class="bgt-over">Melebihi {_html.escape(fmt_idr(b["actual"]-b["budget"], compact=True))}</div>'
                     if over else "")
        items += f"""
        <div class="bgt-row">
          <div class="bgt-head">
            <span class="bgt-name">{_html.escape(b['name'])}</span>
            <span class="bgt-nums">
              {_html.escape(fmt_idr(b['actual'], compact=True))}
              <span class="bgt-muted">/ {_html.escape(fmt_idr(b['budget'], compact=True))}</span>
              {indicator}
            </span>
          </div>
          <div class="bgt-track"><div class="bgt-fill" style="width:{pct}%;background:{bar_color}"></div></div>
          {over_html}
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">Budget vs Aktual</div>{items}</div>'


def tx_list_html(txns: list, title: str = "Transaksi Terbaru") -> str:
    items = ""
    for t in txns:
        is_inc    = t["type"] == "income"
        bg        = "rgba(13,155,118,0.15)" if is_inc else "rgba(248,113,113,0.15)"
        amt_color = "#34d399" if is_inc else "#f87171"
        prefix    = "+" if is_inc else "−"
        items += f"""
        <div class="tx-item">
          <div class="tx-icon" style="background:{bg}">{cat_icon(t['category'])}</div>
          <div class="tx-info">
            <div class="tx-name">{_html.escape(t['note'] or t['category'])}</div>
            <div class="tx-cat">{_html.escape(t['category'])} · {_html.escape(str(t.get('date',''))[:10])}</div>
          </div>
          <div class="tx-amt" style="color:{amt_color}">{prefix}{_html.escape(fmt_idr(t['amount'], compact=True))}</div>
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">{_html.escape(title)}</div>{items}</div>'


def _goal_ring_svg(pct: int, color: str) -> str:
    r, cx, cy = 17, 21, 21
    circ = 2 * math.pi * r
    dash = f"{circ * pct / 100:.2f} {circ:.2f}"
    return f"""<svg width="42" height="42" viewBox="0 0 42 42">
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#1e2535" stroke-width="4"/>
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="4"
        stroke-dasharray="{dash}" stroke-linecap="round" transform="rotate(-90 {cx} {cy})"/>
      <text x="{cx}" y="{cy+3.5}" text-anchor="middle" font-size="8.5"
        font-weight="600" fill="{color}" font-family="DM Mono,monospace">{pct}%</text>
    </svg>"""


def goal_list_html(goals: list) -> str:
    goal_colors = ["#0d9b76", "#3b82f6", "#8b5cf6", "#fbbf24"]
    items = ""
    for i, g in enumerate(goals):
        pct   = min(round(g["saved"] / g["target"] * 100), 100) if g["target"] else 0
        color = goal_colors[i % len(goal_colors)]
        dl    = f"🎯 {g['deadline']}" if g.get("deadline") else ""
        items += f"""
        <div class="goal-item">
          {_goal_ring_svg(pct, color)}
          <div class="goal-info">
            <div class="goal-name">{_html.escape(g['name'])}</div>
            <div class="goal-prog">{_html.escape(fmt_idr(g['saved'], compact=True))} / {_html.escape(fmt_idr(g['target'], compact=True))}</div>
            <div class="goal-dl">{_html.escape(dl)}</div>
          </div>
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">Savings Goals</div>{items}</div>'


def income_alloc_html(expense: float, income: float) -> str:
    if income <= 0:
        return ""
    exp_pct = min(round(expense / income * 100), 100)
    sav_pct = max(0, min(20, 100 - exp_pct))
    inv_pct = max(0, min(10, 100 - exp_pct - sav_pct))
    rem_pct = max(0, 100 - exp_pct - sav_pct - inv_pct)
    segs = [
        (exp_pct, "#f87171", "Pengeluaran"),
        (sav_pct, "#0d9b76", "Tabungan"),
        (inv_pct, "#3b82f6", "Investasi"),
        (rem_pct, "#fbbf24", "Sisa"),
    ]
    bar = "".join(f'<div class="alloc-seg" style="flex-basis:{p}%;background:{c}"></div>'
                  for p, c, _ in segs if p > 0)
    leg = "".join(f'<div class="alloc-item"><span class="alloc-dot" style="background:{c}"></span>'
                  f'<span class="alloc-lbl">{_html.escape(lbl)}</span>'
                  f'<span class="alloc-pct">{p}%</span></div>'
                  for p, c, lbl in segs if p > 0)
    return f'<div class="ga-card"><div class="ga-card-title">Alokasi Income</div><div class="alloc-bar">{bar}</div><div class="alloc-leg">{leg}</div></div>'


# ─────────────────────────────────────────
# PLOTLY CHART BUILDERS
# ─────────────────────────────────────────
def donut_chart(by_cat: pd.DataFrame) -> go.Figure:
    cats   = by_cat["category"].tolist()
    amts   = by_cat["amount"].tolist()
    colors = [cat_color(c) for c in cats]
    total  = sum(amts)
    fig = go.Figure(go.Pie(
        labels=cats, values=amts, hole=0.68,
        marker=dict(colors=colors, line=dict(color="#0f1117", width=2)),
        textinfo="none",
        hovertemplate="%{label}: <b>Rp %{value:,.0f}</b> (%{percent})<extra></extra>",
    ))
    fig.update_layout(
        **PLOTLY_BASE, height=260,
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=True,
        legend=dict(font=dict(size=11), bgcolor="rgba(0,0,0,0)"),
        annotations=[dict(
            text=f"<b>{fmt_idr(total, compact=True)}</b>",
            x=0.5, y=0.5, font=dict(size=13, family="DM Mono", color="#f1f5f9"),
            showarrow=False,
        )],
    )
    return fig


def bar_chart_monthly(df_all: pd.DataFrame) -> go.Figure:
    df_all = df_all.copy()
    df_all["date"] = pd.to_datetime(df_all["date"])
    df_all["period"] = df_all["date"].dt.to_period("M")
    monthly = df_all.groupby(["period", "type"])["amount"].sum().reset_index()
    monthly = monthly.sort_values("period")
    monthly["month_year"] = monthly["period"].dt.strftime("%b %Y")
    months_ordered = list(monthly["month_year"].unique())

    inc = monthly[monthly["type"] == "income"]
    exp = monthly[monthly["type"] == "expense"]
    fig = go.Figure([
        go.Bar(name="Pemasukan",   x=inc["month_year"], y=inc["amount"],
               marker_color="#0d9b76", marker_line_width=0),
        go.Bar(name="Pengeluaran", x=exp["month_year"], y=exp["amount"],
               marker_color="#f87171", marker_line_width=0),
    ])
    fig.update_layout(
        **PLOTLY_BASE,
        barmode="group", height=300,
        margin=dict(l=0, r=0, t=32, b=0),
        title=dict(text="Pemasukan vs Pengeluaran per Bulan", font=dict(size=12), x=0),
        xaxis=dict(**GRID, showgrid=False, tickfont=dict(size=11),
                   categoryorder="array", categoryarray=months_ordered),
        yaxis=dict(**GRID, tickfont=dict(size=10)),
        legend=dict(font=dict(size=11), bgcolor="rgba(0,0,0,0)"),
    )
    return fig


def line_chart_category(df_exp_all: pd.DataFrame) -> go.Figure:
    df_exp_all = df_exp_all.copy()
    df_exp_all["date"] = pd.to_datetime(df_exp_all["date"])
    df_exp_all["period"] = df_exp_all["date"].dt.to_period("M")
    cat_monthly = df_exp_all.groupby(["period", "category"])["amount"].sum().reset_index()
    cat_monthly = cat_monthly.sort_values("period")
    cat_monthly["month_year"] = cat_monthly["period"].dt.strftime("%b %Y")
    months_ordered = list(cat_monthly["month_year"].unique())

    fig = px.line(
        cat_monthly, x="month_year", y="amount", color="category",
        markers=True, color_discrete_map=CATEGORY_COLORS,
    )
    fig.update_layout(
        **PLOTLY_BASE, height=300,
        margin=dict(l=0, r=0, t=32, b=0),
        title=dict(text="Tren Pengeluaran per Kategori", font=dict(size=12), x=0),
        xaxis=dict(**GRID, showgrid=False, tickfont=dict(size=11),
                   categoryorder="array", categoryarray=months_ordered),
        yaxis=dict(**GRID, tickfont=dict(size=10)),
        legend=dict(font=dict(size=10), bgcolor="rgba(0,0,0,0)"),
    )
    return fig


def area_chart_daily(df: pd.DataFrame) -> go.Figure:
    tmp = df[df["type"] == "expense"].copy()
    tmp["day"] = pd.to_datetime(tmp["date"]).dt.normalize()
    daily = tmp.groupby("day")["amount"].sum().reset_index().sort_values("day")

    n_days = len(daily)
    mode = "lines+markers" if n_days <= 7 else "lines"

    fig = go.Figure(go.Scatter(
        x=daily["day"], y=daily["amount"],
        mode=mode, fill="tozeroy",
        line=dict(color="#0d9b76", width=2),
        marker=dict(color="#0d9b76", size=5),
        fillcolor="rgba(13,155,118,0.10)",
        hovertemplate="%{x|%d %b}: <b>Rp %{y:,.0f}</b><extra></extra>",
    ))
    fig.update_layout(
        **PLOTLY_BASE, height=200,
        margin=dict(l=0, r=0, t=0, b=0),
        xaxis=dict(
            **GRID, tickformat="%d %b", tickfont=dict(size=10),
            dtick="D1", ticklabelmode="instant",
        ),
        yaxis=dict(**GRID, tickfont=dict(size=10), tickformat=",.0f"),
        showlegend=False,
    )
    return fig


# ─────────────────────────────────────────
# LOGIN PAGE
# ─────────────────────────────────────────
def render_login():
    st.markdown("""
    <div style='max-width:440px; margin:60px auto; text-align:center;'>
      <div style='display:inline-flex; align-items:center; justify-content:center;
                  width:56px; height:56px; background:#0d9b76; border-radius:14px;
                  font-size:26px; font-weight:700; color:#fff; margin-bottom:12px;'>G</div>
      <div style='font-size:26px; font-weight:700; color:#f1f5f9; margin-bottom:4px;'>Gajian Aman</div>
      <div style='font-size:13px; color:#64748b; margin-bottom:32px;'>Keuangan digital Indonesia</div>
    </div>
    """, unsafe_allow_html=True)

    col = st.columns([1, 2, 1])[1]
    with col:
        user_id = st.number_input("Telegram ID", min_value=1, step=1)
        if st.button("Masuk →", use_container_width=True, type="primary"):
            with get_engine().connect() as conn:
                user = conn.execute(
                    text("SELECT user_id, name FROM users WHERE user_id = :uid"),
                    {"uid": int(user_id)}
                ).fetchone()
            if user:
                st.session_state["user_id"]   = user.user_id
                st.session_state["user_name"] = user.name
                st.rerun()
            else:
                st.error("User ID tidak ditemukan. Pastikan kamu sudah kirim /start ke bot dulu.")

        st.markdown("""
        <div class='ft-login-box' style='text-align:left; margin-top:16px;'>
          <b>📱 Cara dapat Telegram ID:</b><br>
          1. Buka Telegram<br>
          2. Cari bot <b>@SimpleID_Bot</b><br>
          3. Kirim <code>/start</code> ke bot tersebut<br>
          4. Copy angka ID yang muncul<br>
          5. Paste di kolom Telegram ID di atas
        </div>
        """, unsafe_allow_html=True)


# ─────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────
def render_sidebar(user_name: str):
    with st.sidebar:
        st.markdown(f"""
        <div style='padding: 12px 0 16px;'>
          <div style='display:flex; align-items:center; gap:10px; margin-bottom:4px;'>
            <div style='width:36px; height:36px; background:#0d9b76; border-radius:10px;
                        display:flex; align-items:center; justify-content:center;
                        font-size:18px; font-weight:700; color:#fff; flex-shrink:0;'>G</div>
            <div>
              <div style='font-size:15px; font-weight:700; color:#f1f5f9;'>Gajian Aman</div>
              <div style='font-size:10px; color:#64748b;'>Halo, {_html.escape(user_name)} 👋</div>
            </div>
          </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("---")

        today = date.today()
        month = st.selectbox("📅 Bulan", range(1, 13), index=today.month - 1,
                             format_func=lambda m: calendar.month_name[m])
        year_options = list(range(2024, today.year + 2))
        year  = st.selectbox("📆 Tahun", year_options, index=year_options.index(today.year))

        st.markdown("---")

        page = st.radio("Navigasi", [
            "🏠 Overview",
            "💸 Pengeluaran",
            "🎯 Budget",
            "🏆 Goals",
            "📋 Riwayat",
            "📈 Tren",
        ], label_visibility="collapsed")

        st.markdown("<br>", unsafe_allow_html=True)

        st.markdown("""
        <div style='font-size:11px; color:#475569; text-align:center; margin-bottom:8px;'>
          📡 Connected to Supabase<br>🤖 Powered by Claude Haiku
        </div>
        """, unsafe_allow_html=True)

        if st.button("🚪 Logout", use_container_width=True):
            del st.session_state["user_id"]
            del st.session_state["user_name"]
            st.rerun()

    return int(month), int(year), page


# ─────────────────────────────────────────
# PAGE: OVERVIEW
# ─────────────────────────────────────────
def page_overview(df: pd.DataFrame, month: int, year: int, user_id: int):
    month_name = calendar.month_name[month]
    df_exp = df[df["type"] == "expense"]
    df_inc = df[df["type"] == "income"]
    total_expense = float(df_exp["amount"].sum())
    total_income  = float(df_inc["amount"].sum())
    net = total_income - total_expense

    # AI strip
    food_amt = float(df_exp[df_exp["category"] == "Food & Dining"]["amount"].sum())
    if total_expense > 0 and food_amt > 0:
        food_pct = round(food_amt / total_expense * 100)
        strip_parts = [(False, "Pengeluaran "), (True, "Food & Dining"),
                       (False, f" menyumbang {food_pct}% total pengeluaran bulan ini. Cek detail untuk potensi penghematan!")]
    else:
        strip_parts = [(False, "Semua pengeluaran bulan "), (True, month_name),
                       (False, " sudah tercatat. Pantau terus agar keuanganmu tetap sehat! 💪")]
    st.markdown(ai_strip_html(strip_parts), unsafe_allow_html=True)

    # KPI
    expense_pct = round(total_expense / total_income * 100) if total_income else 0
    net_color   = "#34d399" if net >= 0 else "#f87171"
    k1, k2, k3, k4 = st.columns(4)
    k1.markdown(kpi_card("💚 Pemasukan",   fmt_idr(total_income),
                         f"{len(df_inc)} transaksi", "#0d9b76"), unsafe_allow_html=True)
    k2.markdown(kpi_card("🔴 Pengeluaran", fmt_idr(total_expense),
                         f"{expense_pct}% dari income", "#f87171"), unsafe_allow_html=True)
    k3.markdown(kpi_card("💰 Saldo Bersih", fmt_idr(abs(net)),
                         ("✅ Surplus" if net >= 0 else "⚠️ Defisit") + f" {fmt_idr(abs(net), compact=True)}",
                         "#3b82f6", sub_color=net_color), unsafe_allow_html=True)
    k4.markdown(kpi_card("📋 Transaksi",   f"{len(df)} tx",
                         f"{month_name} {year}", "#8b5cf6"), unsafe_allow_html=True)

    st.markdown("<div style='height:16px'></div>", unsafe_allow_html=True)

    # Overview table
    st.markdown("<div style='font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.6px; margin-bottom:8px;'>Tabel Semua Transaksi Bulan Ini</div>", unsafe_allow_html=True)
    if not df.empty:
        df_tbl = df.copy()
        df_tbl["Tanggal"]  = pd.to_datetime(df_tbl["date"]).dt.strftime("%d %b %Y")
        df_tbl["Jenis"]    = df_tbl["type"].map({"income": "💚 Pemasukan", "expense": "🔴 Pengeluaran"})
        df_tbl["Nominal"]  = df_tbl.apply(
            lambda r: f"+{fmt_idr(float(r['amount']))}" if r["type"] == "income"
                      else f"-{fmt_idr(float(r['amount']))}", axis=1)
        df_tbl["Catatan"]  = df_tbl["note"].fillna("-")
        st.dataframe(df_tbl[["Tanggal","Jenis","category","Catatan","Nominal"]]
                     .rename(columns={"category":"Kategori"}),
                     use_container_width=True, hide_index=True)
    else:
        st.info("Belum ada transaksi bulan ini.")

    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)

    # Category bars + donut
    if not df_exp.empty:
        by_cat = (df_exp.groupby("category")["amount"]
                  .sum().sort_values(ascending=False).reset_index())
        cat_rows = [{"name": r["category"], "amount": float(r["amount"]),
                     "color": cat_color(r["category"])} for _, r in by_cat.iterrows()]
        max_amt = max(r["amount"] for r in cat_rows)

        col_bars, col_donut = st.columns([1.6, 1])
        with col_bars:
            st.markdown(category_bars_html(cat_rows, max_amt), unsafe_allow_html=True)
        with col_donut:
            st.plotly_chart(donut_chart(by_cat), use_container_width=True,
                            config={"displayModeBar": False})

    # Daily trend
    if not df_exp.empty:
        st.markdown("<div style='font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.6px; margin-bottom:4px;'>Tren Pengeluaran Harian</div>", unsafe_allow_html=True)
        st.plotly_chart(area_chart_daily(df), use_container_width=True, config={"displayModeBar": False})

    # Budget vs actual
    df_bgt = fetch_budgets(user_id, month, year)
    if not df_bgt.empty:
        bgt_data = [{"name": r["category"], "budget": float(r["budget"]), "actual": float(r["actual"])}
                    for _, r in df_bgt.iterrows()]
        st.markdown(budget_rows_html(bgt_data), unsafe_allow_html=True)

    # Transactions + Goals
    col_tx, col_gl = st.columns(2)
    with col_tx:
        tx_data = [{"type": r["type"], "category": r["category"],
                    "note": r["note"], "amount": float(r["amount"]), "date": str(r["date"])[:10]}
                   for _, r in df.head(6).iterrows()]
        if tx_data:
            st.markdown(tx_list_html(tx_data), unsafe_allow_html=True)
    with col_gl:
        df_goals = fetch_goals(user_id)
        if not df_goals.empty:
            goals_data = [{"name": g["name"], "saved": float(g["saved_amount"]),
                           "target": float(g["target_amount"]),
                           "deadline": str(g["deadline"]) if g["deadline"] else ""}
                          for _, g in df_goals.iterrows()]
            st.markdown(goal_list_html(goals_data), unsafe_allow_html=True)

    st.markdown(income_alloc_html(total_expense, total_income), unsafe_allow_html=True)


# ─────────────────────────────────────────
# PAGE: PENGELUARAN
# ─────────────────────────────────────────
def page_pengeluaran(df_exp: pd.DataFrame, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(f"### 💸 Pengeluaran — {month_name} {year}")

    if df_exp.empty:
        st.info("Belum ada pengeluaran bulan ini.")
        return

    by_cat = (df_exp.groupby("category")["amount"]
              .sum().sort_values(ascending=False).reset_index())
    total = float(by_cat["amount"].sum())

    # KPI
    c1, c2, c3 = st.columns(3)
    c1.markdown(kpi_card("Total Pengeluaran", fmt_idr(total), f"{len(df_exp)} transaksi", "#f87171"),
                unsafe_allow_html=True)
    top_cat = by_cat.iloc[0]
    c2.markdown(kpi_card("Kategori Terbesar", top_cat["category"],
                         fmt_idr(float(top_cat["amount"])), cat_color(top_cat["category"])),
                unsafe_allow_html=True)
    avg = total / len(df_exp) if len(df_exp) else 0
    c3.markdown(kpi_card("Rata-rata per Transaksi", fmt_idr(avg), "per transaksi", "#8b5cf6"),
                unsafe_allow_html=True)

    st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)

    col_bars, col_donut = st.columns([1.6, 1])
    with col_bars:
        cat_rows = [{"name": r["category"], "amount": float(r["amount"]),
                     "color": cat_color(r["category"])} for _, r in by_cat.iterrows()]
        st.markdown(category_bars_html(cat_rows, max(r["amount"] for r in cat_rows)),
                    unsafe_allow_html=True)
    with col_donut:
        st.plotly_chart(donut_chart(by_cat), use_container_width=True,
                        config={"displayModeBar": False})

    st.markdown("---")
    st.markdown("**Detail per Kategori**")
    for _, row in by_cat.iterrows():
        with st.expander(f"{cat_icon(row['category'])} {row['category']} — {fmt_idr(float(row['amount']), compact=True)}"):
            sub = df_exp[df_exp["category"] == row["category"]][["date", "note", "amount"]].copy()
            sub = sub.sort_values("date", ascending=False)
            sub["amount"] = sub["amount"].apply(lambda x: fmt_idr(float(x)))
            st.dataframe(sub, use_container_width=True, hide_index=True)


# ─────────────────────────────────────────
# PAGE: BUDGET
# ─────────────────────────────────────────
def page_budget(user_id: int, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(f"### 🎯 Budget vs Aktual — {month_name} {year}")

    df_bgt = fetch_budgets(user_id, month, year)
    if df_bgt.empty:
        st.info("Belum ada budget. Set via bot: `/budget food 500000`")
        return

    bgt_data = [{"name": r["category"], "budget": float(r["budget"]), "actual": float(r["actual"])}
                for _, r in df_bgt.iterrows()]
    st.markdown(budget_rows_html(bgt_data), unsafe_allow_html=True)

    total_budget = float(df_bgt["budget"].sum())
    total_actual = float(df_bgt["actual"].sum())
    pct_used = round(total_actual / total_budget * 100) if total_budget else 0
    remaining = total_budget - total_actual

    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
    c1, c2, c3 = st.columns(3)
    c1.markdown(kpi_card("Total Budget",   fmt_idr(total_budget, compact=True), "bulan ini", "#3b82f6"),
                unsafe_allow_html=True)
    c2.markdown(kpi_card("Total Terpakai", fmt_idr(total_actual, compact=True), f"{pct_used}% terpakai",
                         "#f87171" if pct_used > 100 else "#fbbf24" if pct_used > 80 else "#0d9b76"),
                unsafe_allow_html=True)
    c3.markdown(kpi_card("Sisa Budget",    fmt_idr(abs(remaining), compact=True),
                         "aman" if remaining >= 0 else "defisit",
                         "#0d9b76" if remaining >= 0 else "#f87171"),
                unsafe_allow_html=True)


# ─────────────────────────────────────────
# PAGE: GOALS
# ─────────────────────────────────────────
def page_goals(user_id: int):
    st.markdown("### 🏆 Savings Goals")

    df_goals = fetch_goals(user_id)
    if df_goals.empty:
        st.info("Belum ada savings goal. Tambahkan via bot: `/goal add Liburan 5000000`")
        return

    goals_data = [{"name": g["name"], "saved": float(g["saved_amount"]),
                   "target": float(g["target_amount"]),
                   "deadline": str(g["deadline"]) if g["deadline"] else ""}
                  for _, g in df_goals.iterrows()]
    st.markdown(goal_list_html(goals_data), unsafe_allow_html=True)

    st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
    for g in goals_data:
        pct = min(round(g["saved"] / g["target"] * 100), 100) if g["target"] else 0
        with st.expander(f"🎯 {g['name']} — {pct}%"):
            c1, c2, c3 = st.columns(3)
            c1.metric("Terkumpul", fmt_idr(g["saved"], compact=True))
            c2.metric("Target",    fmt_idr(g["target"], compact=True))
            c3.metric("Progress",  f"{pct}%")
            if g["deadline"]:
                st.caption(f"📅 Deadline: {g['deadline']}")


# ─────────────────────────────────────────
# PAGE: RIWAYAT
# ─────────────────────────────────────────
def page_riwayat(df: pd.DataFrame, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(f"### 📋 Riwayat Transaksi — {month_name} {year}")

    if df.empty:
        st.info("Belum ada transaksi bulan ini.")
        return

    cat_filter = st.multiselect("Filter Kategori", options=sorted(df["category"].unique()))
    type_filter = st.radio("Jenis", ["Semua", "Pengeluaran", "Pemasukan"], horizontal=True)

    display = df.copy()
    if cat_filter:
        display = display[display["category"].isin(cat_filter)]
    if type_filter == "Pengeluaran":
        display = display[display["type"] == "expense"]
    elif type_filter == "Pemasukan":
        display = display[display["type"] == "income"]

    display = display.sort_values("date", ascending=False).copy()
    display["Nominal"] = display.apply(
        lambda r: f"+{fmt_idr(float(r['amount']))}" if r["type"] == "income"
                  else f"-{fmt_idr(float(r['amount']))}", axis=1)
    display["Jenis"] = display["type"].map({"expense": "🔴 Pengeluaran", "income": "💚 Pemasukan"})
    display["Tanggal"] = pd.to_datetime(display["date"]).dt.strftime("%d %b %Y")
    display["Catatan"] = display["note"].fillna("-")

    st.dataframe(
        display[["Tanggal", "Jenis", "category", "Catatan", "Nominal"]]
        .rename(columns={"category": "Kategori"}),
        use_container_width=True, hide_index=True,
    )

    st.caption(f"Total: {len(display)} transaksi ditampilkan")


# ─────────────────────────────────────────
# PAGE: TREN
# ─────────────────────────────────────────
def page_tren(user_id: int):
    st.markdown("### 📈 Tren Keuangan")

    df_all = fetch_all_transactions(user_id)
    if df_all.empty:
        st.info("Belum cukup data untuk analisis tren.")
        return

    st.plotly_chart(bar_chart_monthly(df_all), use_container_width=True,
                    config={"displayModeBar": False})

    df_exp_all = df_all[df_all["type"] == "expense"].copy()
    if not df_exp_all.empty:
        st.plotly_chart(line_chart_category(df_exp_all), use_container_width=True,
                        config={"displayModeBar": False})

    # Summary insight
    tmp = df_all.copy()
    tmp["period"] = tmp["date"].dt.to_period("M")
    monthly_net = tmp.groupby(["period", "type"])["amount"].sum().unstack(fill_value=0)
    if "income" in monthly_net.columns and "expense" in monthly_net.columns:
        monthly_net["net"] = monthly_net["income"] - monthly_net["expense"]
        best_period = monthly_net["net"].idxmax()
        best_label  = pd.Period(best_period, "M").strftime("%b %Y")
        best_val    = float(monthly_net.loc[best_period, "net"])
        st.markdown(
            f"<div class='ga-card'><div class='ga-card-title'>Insight</div>"
            f"<span style='color:#94a3b8; font-size:13px;'>Bulan terbaik kamu: "
            f"<b style='color:#34d399;'>{best_label}</b> dengan saldo bersih "
            f"<b style='color:#34d399;'>{fmt_idr(best_val)}</b></span></div>",
            unsafe_allow_html=True,
        )


# ─────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────
def main():
    if "user_id" not in st.session_state:
        render_login()
        return

    user_id   = st.session_state["user_id"]
    user_name = st.session_state["user_name"]

    month, year, page = render_sidebar(user_name)

    df         = fetch_transactions(user_id, month, year)
    df_expense = df[df["type"] == "expense"]

    if page == "🏠 Overview":
        page_overview(df, month, year, user_id)
    elif page == "💸 Pengeluaran":
        page_pengeluaran(df_expense, month, year)
    elif page == "🎯 Budget":
        page_budget(user_id, month, year)
    elif page == "🏆 Goals":
        page_goals(user_id)
    elif page == "📋 Riwayat":
        page_riwayat(df, month, year)
    elif page == "📈 Tren":
        page_tren(user_id)


if __name__ == "__main__":
    main()
