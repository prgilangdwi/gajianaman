# dashboard/app.py
import html
import calendar
import os
import math
from datetime import date

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DB_URL = os.getenv("DATABASE_URL_SYNC")
engine = create_engine(DB_URL)

# ─── Design tokens (mirrors gajian_aman_dashboard.html) ──────────────────────
COLORS = {
    "income":  "#1D9E75",
    "expense": "#E24B4A",
    "warning": "#EF9F27",
    "info":    "#378ADD",
    "purple":  "#7F77DD",
    "coral":   "#D85A30",
    "neutral": "#888780",
}
CATEGORY_COLORS = {
    "Food & Dining":    "#E24B4A",
    "Transport":        "#378ADD",
    "Groceries":        "#1D9E75",
    "Bills & Utilities":"#7F77DD",
    "Shopping":         "#EF9F27",
    "Health":           "#D85A30",
    "Entertainment":    "#533AB7",
    "Education":        "#0F6E56",
    "Other":            "#888780",
}
CATEGORY_ICONS = {
    "Food & Dining":    "🍜",
    "Transport":        "🚗",
    "Groceries":        "🛒",
    "Bills & Utilities":"📱",
    "Shopping":         "🛍️",
    "Health":           "💊",
    "Entertainment":    "🎮",
    "Education":        "📚",
    "Other":            "📁",
}

def cat_color(name: str) -> str:
    return CATEGORY_COLORS.get(name, "#888780")

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


# ─── Page config ─────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Gajian Aman",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Global CSS ──────────────────────────────────────────────────────────────
st.markdown("""
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
    --green:#1D9E75; --green-lt:#E6F7F1; --green-dk:#0F6E56;
    --red:#E24B4A;   --red-lt:#FDEAEA;
    --amber:#EF9F27; --blue:#378ADD;
    --bg:#F5F6F8;    --surface:#FFFFFF; --border:#E8E9EC;
    --text-1:#1A1A2E; --text-2:#5A5C6B; --text-3:#9EA0AD;
    --font:'Plus Jakarta Sans',sans-serif;
    --mono:'DM Mono',monospace;
}

/* ── Typography base ── */
html, body, [class*="css"] { font-family: var(--font) !important; }

/* ── App background ── */
.stApp { background: var(--bg) !important; }
section[data-testid="stSidebar"] { background: var(--surface) !important; border-right: 1px solid var(--border); }

/* ── Hide default Streamlit chrome ── */
#MainMenu, footer, header { visibility: hidden; }
.block-container { padding-top: 1.5rem !important; max-width: 1200px; }

/* ── Sidebar ── */
.sidebar-logo { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
.sidebar-icon { width:36px; height:36px; background:var(--green); border-radius:10px;
                display:flex; align-items:center; justify-content:center; font-size:18px;
                box-shadow:0 2px 8px rgba(29,158,117,.25); flex-shrink:0; }
.sidebar-appname { font-size:16px; font-weight:700; color:var(--text-1); }
.sidebar-sub { font-size:10px; color:var(--text-3); }

/* ── AI Strip ── */
.ai-strip {
    background: linear-gradient(135deg,#0F6E56 0%,#1D9E75 100%);
    border-radius: 14px; padding: 14px 16px;
    display: flex; align-items: flex-start; gap: 12px;
    margin-bottom: 16px; cursor: pointer; overflow: hidden;
    box-shadow: 0 2px 14px rgba(29,158,117,.22);
    transition: filter .15s;
}
.ai-strip:hover { filter: brightness(1.05); }
.ai-icon { font-size:15px; background:rgba(255,255,255,.18); border-radius:8px;
           padding:5px 7px; line-height:1; flex-shrink:0; margin-top:2px; }
.ai-body { flex:1; }
.ai-tag  { font-size:9px; font-weight:700; letter-spacing:.8px; color:rgba(255,255,255,.6);
           text-transform:uppercase; margin-bottom:4px; }
.ai-text { font-size:13px; font-weight:500; color:#fff; line-height:1.6; }
.ai-text b { font-weight:700; }
.ai-cta  { font-size:10px; color:rgba(255,255,255,.65); margin-top:6px; }

/* ── KPI card ── */
.kpi-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 14px 14px 14px 17px;
    position: relative; overflow: hidden;
}
.kpi-accent { position:absolute; top:0; left:0; width:3px; height:100%; border-radius:3px 0 0 3px; }
.kpi-label  { font-size:9px; font-weight:700; color:var(--text-3); text-transform:uppercase;
              letter-spacing:.7px; margin-bottom:6px; }
.kpi-value  { font-family:var(--mono); font-size:22px; font-weight:500; color:var(--text-1); line-height:1.1; }
.kpi-sub    { font-size:10px; color:var(--text-3); margin-top:4px; }

/* ── Section card ── */
.ga-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 16px; margin-bottom: 10px;
}
.ga-card-title { font-size:10px; font-weight:700; color:var(--text-3);
                 text-transform:uppercase; letter-spacing:.6px; margin-bottom:14px; }

/* ── Category bar row ── */
.bar-row   { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.bar-row:last-child { margin-bottom:0; }
.bar-emoji { font-size:13px; width:20px; text-align:center; flex-shrink:0; }
.bar-label { font-size:12px; font-weight:500; color:var(--text-2); flex:1; min-width:0;
             white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bar-track { background:#F0F1F3; border-radius:4px; height:6px; overflow:hidden; flex-shrink:0; width:80px; }
.bar-fill  { height:100%; border-radius:4px; transition:width .85s cubic-bezier(.4,0,.2,1); }
.bar-amt   { font-family:var(--mono); font-size:10px; color:var(--text-2); width:48px; text-align:right; flex-shrink:0; }

/* ── Budget row ── */
.bgt-row   { margin-bottom:13px; }
.bgt-row:last-child { margin-bottom:0; }
.bgt-head  { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
.bgt-name  { font-size:13px; font-weight:600; color:var(--text-1); }
.bgt-nums  { font-family:var(--mono); font-size:11px; color:var(--text-2); display:flex; align-items:center; gap:6px; }
.bgt-muted { color:#C8CAD6; }
.bgt-track { background:#F0F1F3; border-radius:4px; height:6px; overflow:hidden; }
.bgt-fill  { height:100%; border-radius:4px; transition:width .9s cubic-bezier(.4,0,.2,1); }
.bgt-over  { font-size:10px; color:var(--red); font-weight:600; margin-top:3px; }

/* ── Transaction item ── */
.tx-item  { display:flex; align-items:center; gap:10px; padding:9px 0;
            border-bottom:1px solid #F3F4F6; }
.tx-item:last-child  { border-bottom:none; padding-bottom:0; }
.tx-item:first-child { padding-top:0; }
.tx-icon  { width:34px; height:34px; border-radius:10px; display:flex; align-items:center;
            justify-content:center; font-size:14px; flex-shrink:0; }
.tx-info  { flex:1; min-width:0; }
.tx-name  { font-size:12px; font-weight:600; color:var(--text-1);
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tx-cat   { font-size:10px; color:var(--text-3); margin-top:1px; }
.tx-amt   { font-family:var(--mono); font-size:13px; font-weight:500; flex-shrink:0; }

/* ── Goal item ── */
.goal-item { display:flex; align-items:center; gap:10px; padding:10px 12px;
             background:#FAFBFC; border-radius:10px; margin-bottom:8px;
             border:1px solid var(--border); }
.goal-item:last-child { margin-bottom:0; }
.goal-info  { flex:1; min-width:0; }
.goal-name  { font-size:13px; font-weight:700; color:var(--text-1); margin-bottom:3px; }
.goal-prog  { font-family:var(--mono); font-size:10px; color:var(--text-2); }
.goal-dl    { font-size:9px; color:var(--text-3); margin-top:2px; }

/* ── Income allocation ── */
.alloc-bar  { display:flex; height:10px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:10px; }
.alloc-seg  { height:100%; border-radius:4px; }
.alloc-leg  { display:flex; flex-wrap:wrap; gap:8px 16px; }
.alloc-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--text-2); }
.alloc-dot  { width:8px; height:8px; border-radius:2px; flex-shrink:0; }
.alloc-lbl  { font-weight:500; }
.alloc-pct  { font-family:var(--mono); color:var(--text-3); margin-left:2px; }

/* ── Login card ── */
.login-wrap { max-width:400px; margin:80px auto; text-align:center; }
.login-icon { font-size:48px; margin-bottom:8px; }
.login-name { font-size:26px; font-weight:700; color:var(--text-1); }
.login-sub  { font-size:13px; color:var(--text-3); margin-top:4px; }

/* ── Plotly chart wrapper ── */
.js-plotly-plot .plotly { font-family: var(--font) !important; }

/* ── Page header ── */
.page-header { font-size:20px; font-weight:700; color:var(--text-1); margin-bottom:16px; }
.page-sub    { font-size:12px; color:var(--text-3); margin-top:2px; }

/* ── Divider ── */
.ga-divider { height:1px; background:var(--border); margin:12px 0; }
</style>
""", unsafe_allow_html=True)


# ─── HTML component builders ─────────────────────────────────────────────────

def ai_strip(text_parts: list[tuple]) -> str:
    """Build AI Insight strip. text_parts = [(bold, text), ...] where bold is bool."""
    inner = ""
    for bold, chunk in text_parts:
        safe = html.escape(chunk)
        inner += f"<b>{safe}</b>" if bold else safe
    return f"""
    <div class="ai-strip">
      <div class="ai-icon">✦</div>
      <div class="ai-body">
        <div class="ai-tag">AI Insight</div>
        <div class="ai-text">{inner}</div>
        <div class="ai-cta">Lihat analisis lengkap →</div>
      </div>
    </div>"""


def kpi_card(label: str, value: str, sub: str, accent_color: str, sub_color: str = "var(--text-3)") -> str:
    return f"""
    <div class="kpi-card">
      <div class="kpi-accent" style="background:{accent_color}"></div>
      <div class="kpi-label">{html.escape(label)}</div>
      <div class="kpi-value">{html.escape(value)}</div>
      <div class="kpi-sub" style="color:{sub_color}">{html.escape(sub)}</div>
    </div>"""


def category_bars(rows: list[dict], max_amount: float) -> str:
    """rows = [{name, amount, color}]"""
    items = ""
    for r in rows:
        pct = round(r["amount"] / max_amount * 100) if max_amount else 0
        icon = cat_icon(r["name"])
        items += f"""
        <div class="bar-row">
          <span class="bar-emoji">{icon}</span>
          <span class="bar-label">{html.escape(r["name"])}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:{pct}%;background:{r['color']}"></div>
          </div>
          <span class="bar-amt">{html.escape(fmt_idr(r['amount'], compact=True))}</span>
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">Per Kategori</div>{items}</div>'


def budget_rows(budgets: list[dict]) -> str:
    items = ""
    for b in budgets:
        raw_pct   = b["actual"] / b["budget"] * 100 if b["budget"] else 0
        pct       = min(round(raw_pct), 100)
        over      = b["actual"] > b["budget"]
        warn      = raw_pct > 80
        bar_color = "#E24B4A" if over else ("#EF9F27" if warn else "#1D9E75")
        indicator = "🔴" if over else ("🟡" if warn else "🟢")
        over_html = ""
        if over:
            diff = b["actual"] - b["budget"]
            over_html = f'<div class="bgt-over">Melebihi budget {html.escape(fmt_idr(diff, compact=True))}</div>'
        items += f"""
        <div class="bgt-row">
          <div class="bgt-head">
            <span class="bgt-name">{html.escape(b['name'])}</span>
            <span class="bgt-nums">
              {html.escape(fmt_idr(b['actual'], compact=True))}
              <span class="bgt-muted">/ {html.escape(fmt_idr(b['budget'], compact=True))}</span>
              {indicator}
            </span>
          </div>
          <div class="bgt-track">
            <div class="bgt-fill" style="width:{pct}%;background:{bar_color}"></div>
          </div>
          {over_html}
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">Budget vs Aktual</div>{items}</div>'


def transaction_list(txns: list[dict]) -> str:
    items = ""
    for t in txns:
        is_inc    = t["type"] == "income"
        bg        = "#E6F7F1" if is_inc else "#FDEAEA"
        amt_color = "#1D9E75" if is_inc else "#E24B4A"
        prefix    = "+" if is_inc else ""
        amt_str   = prefix + fmt_idr(t["amount"], compact=True)
        items += f"""
        <div class="tx-item">
          <div class="tx-icon" style="background:{bg}">{html.escape(cat_icon(t['category']))}</div>
          <div class="tx-info">
            <div class="tx-name">{html.escape(t['note'] or t['category'])}</div>
            <div class="tx-cat">{html.escape(t['category'])}</div>
          </div>
          <div class="tx-amt" style="color:{amt_color}">{html.escape(amt_str)}</div>
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">Transaksi Terbaru</div>{items}</div>'


def _goal_ring_svg(pct: int, color: str) -> str:
    r, cx, cy = 17, 21, 21
    circ = 2 * math.pi * r
    dash = f"{circ * pct / 100:.2f} {circ:.2f}"
    return f"""
    <svg width="42" height="42" viewBox="0 0 42 42">
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#EEF0F4" stroke-width="4"/>
      <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="4"
        stroke-dasharray="{dash}" stroke-linecap="round"
        transform="rotate(-90 {cx} {cy})"/>
      <text x="{cx}" y="{cy+3.5}" text-anchor="middle" font-size="8.5"
        font-weight="600" fill="{color}" font-family="DM Mono,monospace">{pct}%</text>
    </svg>"""


def goal_list(goals: list[dict]) -> str:
    items = ""
    goal_colors = [COLORS["income"], COLORS["info"], COLORS["purple"]]
    for i, g in enumerate(goals):
        pct   = min(round(g["saved"] / g["target"] * 100), 100) if g["target"] else 0
        color = goal_colors[i % len(goal_colors)]
        dl    = f"🎯 {g['deadline']}" if g.get("deadline") else ""
        items += f"""
        <div class="goal-item">
          {_goal_ring_svg(pct, color)}
          <div class="goal-info">
            <div class="goal-name">{html.escape(g['name'])}</div>
            <div class="goal-prog">{html.escape(fmt_idr(g['saved'], compact=True))} / {html.escape(fmt_idr(g['target'], compact=True))}</div>
            <div class="goal-dl">{html.escape(dl)}</div>
          </div>
        </div>"""
    return f'<div class="ga-card"><div class="ga-card-title">Savings Goals</div>{items}</div>'


def income_alloc_bar(expense: float, income: float) -> str:
    if income <= 0:
        return ""
    exp_pct  = min(round(expense / income * 100), 100)
    sav_pct  = max(0, min(20, 100 - exp_pct))
    inv_pct  = max(0, min(10, 100 - exp_pct - sav_pct))
    rem_pct  = max(0, 100 - exp_pct - sav_pct - inv_pct)
    segs = [
        (exp_pct,  "#E24B4A", "Pengeluaran"),
        (sav_pct,  "#1D9E75", "Tabungan"),
        (inv_pct,  "#378ADD", "Investasi"),
        (rem_pct,  "#EF9F27", "Sisa"),
    ]
    bar_html = "".join(
        f'<div class="alloc-seg" style="flex-basis:{p}%;background:{c}"></div>'
        for p, c, _ in segs if p > 0
    )
    leg_html = "".join(
        f'''<div class="alloc-item">
              <span class="alloc-dot" style="background:{c}"></span>
              <span class="alloc-lbl">{html.escape(lbl)}</span>
              <span class="alloc-pct">{p}%</span>
            </div>'''
        for p, c, lbl in segs if p > 0
    )
    return f"""
    <div class="ga-card">
      <div class="ga-card-title">Alokasi Income</div>
      <div class="alloc-bar">{bar_html}</div>
      <div class="alloc-leg">{leg_html}</div>
    </div>"""


# ─── Plotly helpers ───────────────────────────────────────────────────────────

PLOTLY_LAYOUT = dict(
    font_family="Plus Jakarta Sans",
    paper_bgcolor="white",
    plot_bgcolor="white",
    margin=dict(l=16, r=16, t=40, b=16),
)

def donut_chart(by_cat: pd.DataFrame) -> go.Figure:
    cats   = by_cat["category"].tolist()
    amts   = by_cat["amount"].tolist()
    colors = [cat_color(c) for c in cats]
    fig = go.Figure(go.Pie(
        labels=cats, values=amts,
        hole=0.68,
        marker=dict(colors=colors, line=dict(color="#fff", width=3)),
        textinfo="none",
        hovertemplate="%{label}<br>%{value:,.0f}<br>%{percent}<extra></extra>",
    ))
    fig.update_layout(
        **PLOTLY_LAYOUT,
        showlegend=True,
        legend=dict(font=dict(size=11), orientation="v"),
        height=260,
        title=dict(text="Porsi Pengeluaran", font=dict(size=12, color="#9EA0AD"), x=0),
    )
    return fig


def bar_chart_monthly(df_all: pd.DataFrame) -> go.Figure:
    monthly = df_all.groupby(["month_year", "type"])["amount"].sum().reset_index()
    inc = monthly[monthly["type"] == "income"]
    exp = monthly[monthly["type"] == "expense"]
    fig = go.Figure([
        go.Bar(name="Pemasukan",   x=inc["month_year"], y=inc["amount"],
               marker_color="#1D9E75", marker_line_width=0),
        go.Bar(name="Pengeluaran", x=exp["month_year"], y=exp["amount"],
               marker_color="#E24B4A", marker_line_width=0),
    ])
    fig.update_layout(
        **PLOTLY_LAYOUT,
        barmode="group",
        title=dict(text="Pemasukan vs Pengeluaran per Bulan", font=dict(size=12, color="#9EA0AD"), x=0),
        xaxis=dict(showgrid=False, tickfont=dict(size=11)),
        yaxis=dict(gridcolor="#F0F1F3", tickfont=dict(size=10)),
        legend=dict(font=dict(size=11)),
        height=300,
    )
    return fig


def line_chart_category(df_exp_all: pd.DataFrame) -> go.Figure:
    cat_monthly = df_exp_all.groupby(["month_year", "category"])["amount"].sum().reset_index()
    fig = px.line(
        cat_monthly, x="month_year", y="amount", color="category",
        markers=True,
        color_discrete_map=CATEGORY_COLORS,
    )
    fig.update_layout(
        **PLOTLY_LAYOUT,
        title=dict(text="Tren Pengeluaran per Kategori", font=dict(size=12, color="#9EA0AD"), x=0),
        xaxis=dict(showgrid=False, tickfont=dict(size=11)),
        yaxis=dict(gridcolor="#F0F1F3", tickfont=dict(size=10)),
        legend=dict(font=dict(size=10)),
        height=300,
    )
    return fig


# ─── Data fetchers ────────────────────────────────────────────────────────────

@st.cache_data(ttl=300)
def fetch_transactions(user_id: int, month: int, year: int) -> pd.DataFrame:
    with engine.connect() as conn:
        return pd.read_sql(text("""
            SELECT amount, type, category, subcategory, note, date
            FROM transactions
            WHERE user_id = :uid
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
            ORDER BY date DESC
        """), conn, params={"uid": user_id, "month": month, "year": year})


@st.cache_data(ttl=300)
def fetch_all_transactions(user_id: int) -> pd.DataFrame:
    with engine.connect() as conn:
        return pd.read_sql(text("""
            SELECT amount, type, category, date,
                   EXTRACT(MONTH FROM date) as month,
                   EXTRACT(YEAR FROM date) as year
            FROM transactions
            WHERE user_id = :uid
            ORDER BY date
        """), conn, params={"uid": user_id})


@st.cache_data(ttl=300)
def fetch_budgets(user_id: int, month: int, year: int) -> pd.DataFrame:
    with engine.connect() as conn:
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


@st.cache_data(ttl=300)
def fetch_goals(user_id: int) -> pd.DataFrame:
    with engine.connect() as conn:
        return pd.read_sql(text("""
            SELECT name, target_amount, saved_amount, deadline
            FROM goals WHERE user_id = :uid
        """), conn, params={"uid": user_id})


# ─── Login ────────────────────────────────────────────────────────────────────

def login():
    st.markdown("""
    <div class="login-wrap">
      <div class="login-icon">💰</div>
      <div class="login-name">Gajian Aman</div>
      <div class="login-sub">Keuangan digital Indonesia</div>
    </div>""", unsafe_allow_html=True)

    col = st.columns([1, 2, 1])[1]
    with col:
        st.markdown("<br>", unsafe_allow_html=True)
        user_id = st.number_input("Telegram User ID", min_value=1, step=1,
                                  label_visibility="visible")
        if st.button("Masuk →", use_container_width=True, type="primary"):
            with engine.connect() as conn:
                user = conn.execute(
                    text("SELECT user_id, name FROM users WHERE user_id = :uid"),
                    {"uid": user_id}
                ).fetchone()
            if user:
                st.session_state["user_id"]   = user.user_id
                st.session_state["user_name"] = user.name
                st.rerun()
            else:
                st.error("User ID tidak ditemukan. Pastikan kamu sudah /start bot dulu.")


# ─── Sidebar ──────────────────────────────────────────────────────────────────

def render_sidebar(user_name: str) -> tuple[int, int, str]:
    with st.sidebar:
        st.markdown(f"""
        <div class="sidebar-logo">
          <div class="sidebar-icon">💰</div>
          <div>
            <div class="sidebar-appname">Gajian Aman</div>
            <div class="sidebar-sub">Halo, {html.escape(user_name)} 👋</div>
          </div>
        </div>""", unsafe_allow_html=True)
        st.markdown("<hr style='border:none;border-top:1px solid #E8E9EC;margin:12px 0'>",
                    unsafe_allow_html=True)

        today = date.today()
        month = st.selectbox("Bulan", range(1, 13), index=today.month - 1,
                             format_func=lambda m: calendar.month_name[m])
        year  = st.selectbox("Tahun", range(2024, today.year + 2), index=0)

        st.markdown("<hr style='border:none;border-top:1px solid #E8E9EC;margin:12px 0'>",
                    unsafe_allow_html=True)

        page = st.radio("Navigasi", [
            "🏠 Overview",
            "💸 Pengeluaran",
            "🎯 Budget",
            "🏆 Goals",
            "📋 Riwayat",
            "📈 Tren",
        ], label_visibility="collapsed")

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Logout", use_container_width=True):
            del st.session_state["user_id"]
            del st.session_state["user_name"]
            st.rerun()

    return month, year, page


# ─── Pages ────────────────────────────────────────────────────────────────────

def page_overview(df: pd.DataFrame, month: int, year: int, user_id: int):
    month_name = calendar.month_name[month]
    df_exp = df[df["type"] == "expense"]
    df_inc = df[df["type"] == "income"]

    total_expense = float(df_exp["amount"].sum())
    total_income  = float(df_inc["amount"].sum())
    net           = total_income - total_expense

    # AI Strip
    food_amt = float(df_exp[df_exp["category"] == "Food & Dining"]["amount"].sum())
    if total_expense > 0 and food_amt > 0:
        food_pct = round(food_amt / total_expense * 100)
        strip_parts = [
            (False, "Pengeluaran "),
            (True,  "Food & Dining"),
            (False, f" menyumbang {food_pct}% total pengeluaran bulan ini ({fmt_idr(food_amt, compact=True)}). "),
            (False, "Cek detail untuk potensi penghematan!"),
        ]
    else:
        strip_parts = [
            (False, "Semua pengeluaran bulan "),
            (True,  month_name),
            (False, " sudah tercatat. Pantau terus agar keuanganmu tetap sehat! 💪"),
        ]
    st.markdown(ai_strip(strip_parts), unsafe_allow_html=True)

    # KPI row
    expense_pct = round(total_expense / total_income * 100) if total_income else 0
    net_color   = "var(--green)" if net >= 0 else "var(--red)"
    net_sub     = f"{'Surplus' if net >= 0 else 'Defisit'} {fmt_idr(abs(net), compact=True)}"

    k1, k2, k3 = st.columns(3)
    k1.markdown(kpi_card("Pemasukan",    fmt_idr(total_income, compact=True),
                         f"{len(df_inc)} transaksi", "#1D9E75"), unsafe_allow_html=True)
    k2.markdown(kpi_card("Pengeluaran",  fmt_idr(total_expense, compact=True),
                         f"{expense_pct}% dari income", "#E24B4A"), unsafe_allow_html=True)
    k3.markdown(kpi_card("Saldo Bersih", fmt_idr(net, compact=True),
                         net_sub, "#378ADD", sub_color=net_color), unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Category bars + Donut
    if not df_exp.empty:
        by_cat = (df_exp.groupby("category")["amount"]
                  .sum().sort_values(ascending=False).reset_index())
        cat_rows = [
            {"name": row["category"], "amount": float(row["amount"]),
             "color": cat_color(row["category"])}
            for _, row in by_cat.iterrows()
        ]
        max_amt = max(r["amount"] for r in cat_rows)

        col_left, col_right = st.columns(2)
        with col_left:
            st.markdown(category_bars(cat_rows, max_amt), unsafe_allow_html=True)
        with col_right:
            st.plotly_chart(donut_chart(by_cat), use_container_width=True,
                            config={"displayModeBar": False})

    # Budget vs Actual
    df_bgt = fetch_budgets(user_id, month, year)
    if not df_bgt.empty:
        bgt_data = [
            {"name": r["category"], "budget": float(r["budget"]), "actual": float(r["actual"])}
            for _, r in df_bgt.iterrows()
        ]
        st.markdown(budget_rows(bgt_data), unsafe_allow_html=True)

    # Transactions + Goals
    col_tx, col_gl = st.columns(2)
    with col_tx:
        recent = df.head(6)
        tx_data = [
            {"type": r["type"], "category": r["category"],
             "note": r["note"], "amount": float(r["amount"])}
            for _, r in recent.iterrows()
        ]
        st.markdown(transaction_list(tx_data), unsafe_allow_html=True)

    with col_gl:
        df_goals = fetch_goals(user_id)
        if not df_goals.empty:
            goals_data = [
                {"name": g["name"], "saved": float(g["saved_amount"]),
                 "target": float(g["target_amount"]),
                 "deadline": str(g["deadline"]) if g["deadline"] else ""}
                for _, g in df_goals.iterrows()
            ]
            st.markdown(goal_list(goals_data), unsafe_allow_html=True)

    # Income allocation
    st.markdown(income_alloc_bar(total_expense, total_income), unsafe_allow_html=True)


def page_pengeluaran(df_exp: pd.DataFrame, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(f'<div class="page-header">💸 Pengeluaran — {month_name} {year}</div>',
                unsafe_allow_html=True)

    if df_exp.empty:
        st.info("Belum ada pengeluaran bulan ini.")
        return

    by_cat = (df_exp.groupby("category")["amount"]
              .sum().sort_values(ascending=False).reset_index())

    col_bars, col_donut = st.columns(2)
    with col_bars:
        cat_rows = [{"name": r["category"], "amount": float(r["amount"]),
                     "color": cat_color(r["category"])} for _, r in by_cat.iterrows()]
        st.markdown(category_bars(cat_rows, max(r["amount"] for r in cat_rows)),
                    unsafe_allow_html=True)
    with col_donut:
        st.plotly_chart(donut_chart(by_cat), use_container_width=True,
                        config={"displayModeBar": False})

    st.markdown('<div class="ga-card"><div class="ga-card-title">Detail per Kategori</div>',
                unsafe_allow_html=True)
    for _, row in by_cat.iterrows():
        with st.expander(
            f"{cat_icon(row['category'])} {row['category']} — {fmt_idr(row['amount'], compact=True)}"
        ):
            sub = df_exp[df_exp["category"] == row["category"]][["date", "subcategory", "note", "amount"]]
            sub = sub.sort_values("date", ascending=False).copy()
            sub["amount"] = sub["amount"].apply(lambda x: fmt_idr(x))
            st.dataframe(sub, use_container_width=True, hide_index=True)
    st.markdown("</div>", unsafe_allow_html=True)


def page_budget(user_id: int, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(f'<div class="page-header">🎯 Budget vs Aktual — {month_name} {year}</div>',
                unsafe_allow_html=True)

    df_bgt = fetch_budgets(user_id, month, year)
    if df_bgt.empty:
        st.info("Belum ada budget. Set via bot: `/budget food 500000`")
        return

    bgt_data = [
        {"name": r["category"], "budget": float(r["budget"]), "actual": float(r["actual"])}
        for _, r in df_bgt.iterrows()
    ]
    st.markdown(budget_rows(bgt_data), unsafe_allow_html=True)

    # Summary metrics
    total_budget = df_bgt["budget"].sum()
    total_actual = df_bgt["actual"].sum()
    pct_used = round(total_actual / total_budget * 100) if total_budget else 0
    remaining = total_budget - total_actual

    st.markdown("<br>", unsafe_allow_html=True)
    c1, c2, c3 = st.columns(3)
    c1.markdown(kpi_card("Total Budget",   fmt_idr(total_budget, compact=True), "bulan ini", "#378ADD"),
                unsafe_allow_html=True)
    c2.markdown(kpi_card("Total Terpakai", fmt_idr(total_actual, compact=True), f"{pct_used}% terpakai",
                          "#E24B4A" if pct_used > 100 else "#EF9F27" if pct_used > 80 else "#1D9E75"),
                unsafe_allow_html=True)
    c3.markdown(kpi_card("Sisa Budget",    fmt_idr(remaining, compact=True),
                          "aman" if remaining >= 0 else "defisit",
                          "#1D9E75" if remaining >= 0 else "#E24B4A"),
                unsafe_allow_html=True)


def page_goals(user_id: int):
    st.markdown('<div class="page-header">🏆 Savings Goals</div>', unsafe_allow_html=True)

    df_goals = fetch_goals(user_id)
    if df_goals.empty:
        st.info("Belum ada savings goal. Tambahkan via bot: `/goal add Liburan 5000000`")
        return

    goals_data = [
        {"name": g["name"], "saved": float(g["saved_amount"]),
         "target": float(g["target_amount"]),
         "deadline": str(g["deadline"]) if g["deadline"] else ""}
        for _, g in df_goals.iterrows()
    ]
    st.markdown(goal_list(goals_data), unsafe_allow_html=True)

    # Detail metrics
    st.markdown("<br>", unsafe_allow_html=True)
    for g in goals_data:
        pct = min(round(g["saved"] / g["target"] * 100), 100) if g["target"] else 0
        with st.expander(f"🎯 {g['name']} — {pct}%"):
            c1, c2, c3 = st.columns(3)
            c1.metric("Terkumpul", fmt_idr(g["saved"], compact=True))
            c2.metric("Target",    fmt_idr(g["target"], compact=True))
            c3.metric("Progress",  f"{pct}%")
            if g["deadline"]:
                st.caption(f"📅 Deadline: {g['deadline']}")


def page_riwayat(df: pd.DataFrame, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(f'<div class="page-header">📋 Riwayat Transaksi — {month_name} {year}</div>',
                unsafe_allow_html=True)

    if df.empty:
        st.info("Belum ada transaksi bulan ini.")
        return

    cat_filter = st.multiselect("Filter Kategori", options=sorted(df["category"].unique()))
    display = df.copy()
    if cat_filter:
        display = display[display["category"].isin(cat_filter)]

    display["amount"] = display["amount"].apply(fmt_idr)
    display["type"]   = display["type"].map({"expense": "🔴 Pengeluaran", "income": "💚 Pemasukan"})
    display = display.sort_values("date", ascending=False)
    st.dataframe(
        display[["date", "type", "category", "subcategory", "note", "amount"]],
        use_container_width=True, hide_index=True,
    )


def page_tren(user_id: int):
    st.markdown('<div class="page-header">📈 Tren Keuangan</div>', unsafe_allow_html=True)

    df_all = fetch_all_transactions(user_id)
    if df_all.empty:
        st.info("Belum cukup data untuk analisis tren.")
        return

    df_all["date"]       = pd.to_datetime(df_all["date"])
    df_all["month_year"] = df_all["date"].dt.strftime("%b %Y")

    st.plotly_chart(bar_chart_monthly(df_all), use_container_width=True,
                    config={"displayModeBar": False})

    df_exp_all = df_all[df_all["type"] == "expense"]
    if not df_exp_all.empty:
        st.plotly_chart(line_chart_category(df_exp_all), use_container_width=True,
                        config={"displayModeBar": False})


# ─── Entry point ─────────────────────────────────────────────────────────────

def main():
    if "user_id" not in st.session_state:
        login()
        return

    user_id   = st.session_state["user_id"]
    user_name = st.session_state["user_name"]

    month, year, page = render_sidebar(user_name)

    df         = fetch_transactions(user_id, month, year)
    df_expense = df[df["type"] == "expense"]
    df_income  = df[df["type"] == "income"]

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
