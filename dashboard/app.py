# dashboard/app.py
# Gajian Aman — Streamlit Dashboard (multi-page, light green theme)

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

st.set_page_config(
    page_title="Gajian Aman",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────
# CSS
# ─────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
  }
  .stApp {
    background: linear-gradient(180deg, #B5ECA2 0%, #F0FBE8 28%, #F0FBE8 100%) !important;
  }
  #MainMenu, footer, header { visibility: hidden; }
  .block-container {
    padding: 1.5rem 1rem !important;
    max-width: 1200px !important;
    margin: 0 auto !important;
  }

  /* Sidebar */
  section[data-testid="stSidebar"] {
    background: #1B4332 !important;
    border-right: none !important;
  }
  section[data-testid="stSidebar"] * { color: rgba(255,255,255,0.85) !important; }
  section[data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p {
    color: rgba(255,255,255,0.45) !important;
    font-size: 10px !important;
  }

  /* Column gap */
  [data-testid="column"] { padding: 6px !important; }

  /* Buttons */
  .stButton > button {
    background: #6DC641 !important; color: #fff !important;
    border: none !important; border-radius: 12px !important;
    font-weight: 700 !important;
  }
  .stButton > button:hover { background: #5cb530 !important; }

  /* Inputs — main content only (not sidebar) */
  input[type="number"] { text-align: center !important; }
  .main .stSelectbox [data-baseweb="select"] > div,
  .main .stMultiSelect [data-baseweb="select"] > div {
    border-radius: 10px !important; border-color: #D1FAE5 !important;
    background: #fff !important;
  }

  /* Sidebar selectbox — dark bg so white text is readable */
  section[data-testid="stSidebar"] .stSelectbox [data-baseweb="select"] > div,
  section[data-testid="stSidebar"] .stMultiSelect [data-baseweb="select"] > div {
    background: rgba(255,255,255,0.14) !important;
    border-color: rgba(255,255,255,0.22) !important;
    border-radius: 10px !important;
  }
  section[data-testid="stSidebar"] .stSelectbox [data-baseweb="select"] span,
  section[data-testid="stSidebar"] .stSelectbox [data-baseweb="select"] div,
  section[data-testid="stSidebar"] .stSelectbox svg {
    color: #fff !important; fill: rgba(255,255,255,0.6) !important;
  }

  /* Dataframe */
  .stDataFrame { border-radius: 16px !important; overflow: hidden !important; }

  /* Expander */
  details summary {
    background: #fff !important; border-radius: 12px !important;
    font-weight: 600 !important; color: #1A1A1A !important;
  }

  /* Radio / selectbox label */
  .stRadio label, .stSelectbox label { color: rgba(255,255,255,0.6) !important; }

  /* Mobile */
  @media (max-width: 768px) {
    .block-container { padding: 0.75rem !important; }
    [data-testid="stHorizontalBlock"] { flex-wrap: wrap !important; gap: 4px !important; }
    [data-testid="column"] {
      min-width: min(100%, 160px) !important;
      padding: 4px !important;
    }
    /* Single-column KPI stack on very small screens */
    @media (max-width: 480px) {
      [data-testid="column"] { min-width: 100% !important; }
    }
  }
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────
CARD = {
    "dark":    {"bg": "#1B4332", "text": "#FFFFFF", "muted": "rgba(255,255,255,0.6)"},
    "yellow":  {"bg": "#F5C842", "text": "#1A1A1A", "muted": "rgba(26,26,26,0.55)"},
    "orange":  {"bg": "#F07A3A", "text": "#FFFFFF", "muted": "rgba(255,255,255,0.65)"},
    "teal":    {"bg": "#4DC9C2", "text": "#1A1A1A", "muted": "rgba(26,26,26,0.55)"},
    "green":   {"bg": "#A8D96C", "text": "#1A1A1A", "muted": "rgba(26,26,26,0.55)"},
    "gray":    {"bg": "#E8E8E8", "text": "#1A1A1A", "muted": "rgba(26,26,26,0.5)"},
    "white":   {"bg": "#FFFFFF", "text": "#1A1A1A", "muted": "#6B7280"},
    "primary": {"bg": "#6DC641", "text": "#FFFFFF", "muted": "rgba(255,255,255,0.65)"},
}

CATEGORY_COLORS = {
    "Food & Dining":    "#F07A3A",
    "Transport":        "#4DC9C2",
    "Groceries":        "#6DC641",
    "Bills & Utilities":"#1B4332",
    "Shopping":         "#F5C842",
    "Health":           "#A8D96C",
    "Entertainment":    "#F07A3A",
    "Education":        "#4DC9C2",
    "Other":            "#9CA3AF",
    "Salary":           "#6DC641",
    "Freelance":        "#4DC9C2",
    "Other Income":     "#A8D96C",
    "Dining Out":       "#F07A3A",
    "Personal Care":    "#A8D96C",
    "Investment":       "#1B4332",
    "Savings":          "#6DC641",
}
CATEGORY_CARD_KEY = {
    "Food & Dining":    "orange",
    "Transport":        "teal",
    "Groceries":        "green",
    "Bills & Utilities":"dark",
    "Shopping":         "yellow",
    "Health":           "green",
    "Entertainment":    "yellow",
    "Education":        "teal",
    "Other":            "gray",
    "Salary":           "primary",
    "Freelance":        "teal",
    "Other Income":     "green",
    "Investment":       "dark",
    "Savings":          "primary",
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
_CARD_CYCLE = ["orange", "teal", "green", "yellow", "dark", "primary", "gray"]

PLOTLY_BASE = dict(
    font_family="Plus Jakarta Sans",
    font_color="#6B7280",
    title_font_color="#1A1A1A",
    colorway=["#6DC641","#F07A3A","#4DC9C2","#F5C842","#1B4332","#A8D96C","#9CA3AF"],
)
_TRANSPARENT = dict(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
_WHITE_BG    = dict(paper_bgcolor="#FFFFFF",        plot_bgcolor="#FFFFFF")
GRID = dict(gridcolor="#E8E8E8", zerolinecolor="#E8E8E8", linecolor="#E8E8E8")


def cat_color(name: str) -> str:
    return CATEGORY_COLORS.get(name, "#9CA3AF")

def cat_icon(name: str) -> str:
    return CATEGORY_ICONS.get(name, "📁")

def cat_card(name: str, idx: int = 0) -> dict:
    key = CATEGORY_CARD_KEY.get(name, _CARD_CYCLE[idx % len(_CARD_CYCLE)])
    return CARD[key]

def fmt_idr(amount: float, compact: bool = False) -> str:
    abs_amt = abs(amount)
    neg = "−" if amount < 0 else ""
    if compact and abs_amt >= 1_000_000:
        return f"{neg}Rp {abs_amt/1_000_000:.1f}jt"
    if compact and abs_amt >= 1_000:
        return f"{neg}Rp {int(abs_amt/1_000)}K"
    return f"{neg}Rp {int(abs_amt):,}".replace(",", ".")


# ─────────────────────────────────────────
# DB
# ─────────────────────────────────────────
@st.cache_resource
def get_engine():
    url = os.getenv("DATABASE_URL_SYNC")
    if not url:
        st.error("DATABASE_URL_SYNC not set. Add it in Streamlit Cloud → Settings → Secrets.")
        st.stop()
    return create_engine(url, pool_pre_ping=True)


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
# HTML BUILDERS
# ─────────────────────────────────────────
def metric_card(label: str, value: str, sub: str, style: str = "white", icon: str = "") -> str:
    c = CARD[style]
    return f"""
    <div style="background:{c['bg']};border-radius:20px;padding:22px 20px;
                box-shadow:0 2px 12px rgba(0,0,0,0.07);color:{c['text']};
                min-height:118px;display:flex;flex-direction:column;justify-content:space-between;">
      <div style="font-size:11px;font-weight:600;color:{c['muted']};
                  text-transform:uppercase;letter-spacing:0.6px;">{icon} {_html.escape(label)}</div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.1;margin-top:6px;">
        {_html.escape(value)}
      </div>
      <div style="font-size:11px;color:{c['muted']};margin-top:6px;">{_html.escape(sub)}</div>
    </div>"""


def status_badge(label: str, healthy: bool = True) -> str:
    bg = "#6DC641" if healthy else "#F07A3A"
    return (f'<span style="display:inline-block;background:{bg};color:#fff;'
            f'border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;'
            f'letter-spacing:0.5px;">{_html.escape(label)}</span>')


def page_header(title: str, subtitle: str, badge: str = "", badge_ok: bool = True) -> str:
    b = f'<div style="margin-top:8px;">{status_badge(badge, badge_ok)}</div>' if badge else ""
    return f"""
    <div style="margin-bottom:20px;">
      <div style="font-size:24px;font-weight:800;color:#1A1A1A;">{_html.escape(title)}</div>
      <div style="font-size:13px;color:#6B7280;margin-top:2px;">{_html.escape(subtitle)}</div>
      {b}
    </div>"""


def section_label(text: str) -> str:
    return (f'<div style="font-size:11px;font-weight:700;color:#6B7280;'
            f'text-transform:uppercase;letter-spacing:0.7px;margin:20px 0 10px;">'
            f'{_html.escape(text)}</div>')


def white_card_wrap(inner_html: str) -> str:
    return (f'<div style="background:#FFFFFF;border-radius:20px;padding:18px;'
            f'box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:12px;">{inner_html}</div>')


def bento_categories_html(rows: list, total: float) -> str:
    tiles = ""
    for i, r in enumerate(rows):
        c   = cat_card(r["name"], i)
        pct = round(r["amount"] / total * 100) if total else 0
        tiles += f"""
        <div style="background:{c['bg']};border-radius:20px;padding:18px;
                    color:{c['text']};box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <div style="font-size:10px;font-weight:600;color:{c['muted']};
                      text-transform:uppercase;letter-spacing:0.5px;">
            {cat_icon(r['name'])} {_html.escape(r['name'])}
          </div>
          <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;
                      margin-top:10px;line-height:1.1;">
            {_html.escape(fmt_idr(r['amount'], compact=True))}
          </div>
          <div style="margin-top:10px;background:rgba(0,0,0,0.15);border-radius:8px;
                      height:4px;overflow:hidden;">
            <div style="width:{pct}%;height:100%;background:{c['text']};
                        opacity:0.45;border-radius:8px;"></div>
          </div>
          <div style="font-size:10px;color:{c['muted']};margin-top:5px;">{pct}% dari total</div>
        </div>"""
    return (f'<div style="display:grid;grid-template-columns:repeat(2,1fr);'
            f'gap:10px;margin-bottom:4px;">{tiles}</div>')


def budget_rows_html(budgets: list) -> str:
    items = ""
    for b in budgets:
        raw_pct   = b["actual"] / b["budget"] * 100 if b["budget"] else 0
        pct       = min(round(raw_pct), 100)
        over      = b["actual"] > b["budget"]
        warn      = raw_pct > 80
        bar_color = "#6DC641" if not over and not warn else ("#F5C842" if warn else "#F07A3A")
        indicator = "✅" if not over and not warn else ("⚠️" if warn else "🔴")
        over_txt  = (f'<div style="font-size:10px;color:#F07A3A;font-weight:600;margin-top:5px;">'
                     f'Melebihi {_html.escape(fmt_idr(b["actual"]-b["budget"],compact=True))}</div>'
                     if over else
                     f'<div style="font-size:10px;color:#6B7280;margin-top:5px;">{pct}% terpakai</div>')
        items += f"""
        <div style="background:#F9FBF7;border-radius:14px;padding:14px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;color:#1A1A1A;">
              {cat_icon(b['name'])} {_html.escape(b['name'])}
            </span>
            <span style="font-size:11px;color:#6B7280;">
              {indicator} {_html.escape(fmt_idr(b['actual'],compact=True))} / {_html.escape(fmt_idr(b['budget'],compact=True))}
            </span>
          </div>
          <div style="background:#E8E8E8;border-radius:10px;height:6px;overflow:hidden;">
            <div style="width:{pct}%;height:100%;background:{bar_color};border-radius:10px;
                        position:relative;">
              <div style="position:absolute;right:-4px;top:-3px;width:12px;height:12px;
                          background:{bar_color};border:2px solid #fff;border-radius:50%;"></div>
            </div>
          </div>
          {over_txt}
        </div>"""
    return white_card_wrap(
        f'<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;'
        f'letter-spacing:0.6px;margin-bottom:12px;">Budget vs Aktual</div>{items}'
    )


def tx_list_html(txns: list, title: str = "Transaksi Terbaru") -> str:
    items = ""
    for t in txns:
        is_inc  = t["type"] == "income"
        icon_bg = "#D1FAE5" if is_inc else "#FDE8D8"
        amt_col = "#1B4332" if is_inc else "#F07A3A"
        prefix  = "+" if is_inc else "−"
        items += f"""
        <div style="display:flex;align-items:center;gap:10px;
                    padding:10px 0;border-bottom:1px solid #F0FBE8;">
          <div style="width:36px;height:36px;border-radius:12px;background:{icon_bg};
                      display:flex;align-items:center;justify-content:center;
                      font-size:15px;flex-shrink:0;">{cat_icon(t['category'])}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;color:#1A1A1A;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              {_html.escape(t['note'] or t['category'])}
            </div>
            <div style="font-size:10px;color:#6B7280;margin-top:1px;">
              {_html.escape(t['category'])} · {_html.escape(str(t.get('date',''))[:10])}
            </div>
          </div>
          <div style="font-size:13px;font-weight:700;color:{amt_col};flex-shrink:0;">
            {prefix}{_html.escape(fmt_idr(t['amount'], compact=True))}
          </div>
        </div>"""
    return white_card_wrap(
        f'<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;'
        f'letter-spacing:0.6px;margin-bottom:8px;">{_html.escape(title)}</div>{items}'
    )


def _goal_ring_svg(pct: int, color: str) -> str:
    r, cx, cy = 17, 21, 21
    circ = 2 * math.pi * r
    dash = f"{circ * pct / 100:.2f} {circ:.2f}"
    return (f'<svg width="44" height="44" viewBox="0 0 42 42">'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#E8E8E8" stroke-width="4.5"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="4.5"'
            f' stroke-dasharray="{dash}" stroke-linecap="round" transform="rotate(-90 {cx} {cy})"/>'
            f'<text x="{cx}" y="{cy+3.5}" text-anchor="middle" font-size="8" font-weight="700"'
            f' fill="{color}" font-family="Plus Jakarta Sans,sans-serif">{pct}%</text></svg>')


def goal_list_html(goals: list) -> str:
    colors = ["#6DC641","#4DC9C2","#F07A3A","#F5C842","#1B4332"]
    items  = ""
    for i, g in enumerate(goals):
        pct   = min(round(g["saved"] / g["target"] * 100), 100) if g["target"] else 0
        color = colors[i % len(colors)]
        dl    = f"📅 {g['deadline']}" if g.get("deadline") else "Tanpa deadline"
        left  = max(0, g["target"] - g["saved"])
        items += f"""
        <div style="display:flex;align-items:center;gap:12px;
                    padding:12px 0;border-bottom:1px solid #F0FBE8;">
          {_goal_ring_svg(pct, color)}
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;color:#1A1A1A;">
              {_html.escape(g['name'])}
            </div>
            <div style="font-size:10px;color:#6B7280;margin-top:2px;">
              {_html.escape(fmt_idr(g['saved'],compact=True))} / {_html.escape(fmt_idr(g['target'],compact=True))}
            </div>
            <div style="background:#E8E8E8;border-radius:8px;height:4px;
                        overflow:hidden;margin-top:6px;">
              <div style="width:{pct}%;height:100%;background:{color};border-radius:8px;"></div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:10px;color:#6B7280;">{_html.escape(dl)}</div>
            <div style="font-size:10px;font-weight:600;color:#1A1A1A;margin-top:4px;">
              Sisa {_html.escape(fmt_idr(left,compact=True))}
            </div>
          </div>
        </div>"""
    return white_card_wrap(
        f'<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;'
        f'letter-spacing:0.6px;margin-bottom:6px;">Savings Goals</div>{items}'
    )


def income_alloc_html(expense: float, income: float) -> str:
    if income <= 0:
        return ""
    exp_pct = min(round(expense / income * 100), 100)
    remaining = max(0, 100 - exp_pct)
    sav_pct = min(remaining, 30)
    inv_pct = min(remaining - sav_pct, 10)
    rem_pct = max(0, remaining - sav_pct - inv_pct)
    segs = [
        (exp_pct, "#F07A3A", "Pengeluaran"),
        (sav_pct, "#6DC641", "Tabungan"),
        (inv_pct, "#4DC9C2", "Investasi"),
        (rem_pct, "#F5C842", "Sisa"),
    ]
    bar = "".join(
        f'<div style="flex-basis:{p}%;background:{c};height:100%;border-radius:6px;"></div>'
        for p, c, _ in segs if p > 0
    )
    leg = "".join(
        f'<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#1A1A1A;">'
        f'<div style="width:8px;height:8px;border-radius:2px;background:{c};flex-shrink:0;"></div>'
        f'<span style="font-weight:600;">{_html.escape(lbl)}</span>'
        f'<span style="color:#6B7280;font-size:10px;margin-left:2px;">{p}%</span></div>'
        for p, c, lbl in segs if p > 0
    )
    return white_card_wrap(
        f'<div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;'
        f'letter-spacing:0.6px;margin-bottom:12px;">Alokasi Income</div>'
        f'<div style="display:flex;height:10px;border-radius:6px;overflow:hidden;'
        f'gap:2px;margin-bottom:10px;">{bar}</div>'
        f'<div style="display:flex;flex-wrap:wrap;gap:8px 16px;">{leg}</div>'
    )


# ─────────────────────────────────────────
# PLOTLY CHARTS
# ─────────────────────────────────────────
def donut_chart(by_cat: pd.DataFrame) -> go.Figure:
    cats   = by_cat["category"].tolist()
    amts   = by_cat["amount"].tolist()
    colors = [cat_color(c) for c in cats]
    total  = sum(amts)
    fig = go.Figure(go.Pie(
        labels=cats, values=amts, hole=0.70,
        marker=dict(colors=colors, line=dict(color="#FFFFFF", width=3)),
        textinfo="none",
        hovertemplate="%{label}: <b>Rp %{value:,.0f}</b> (%{percent})<extra></extra>",
    ))
    fig.update_layout(
        **PLOTLY_BASE, **_WHITE_BG,
        height=260,
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=True,
        legend=dict(font=dict(size=11, color="#1A1A1A"), bgcolor="rgba(0,0,0,0)"),
        annotations=[dict(
            text=f"<b>{fmt_idr(total, compact=True)}</b>",
            x=0.5, y=0.5,
            font=dict(size=14, family="Plus Jakarta Sans", color="#1A1A1A"),
            showarrow=False,
        )],
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
        line=dict(color="#6DC641", width=2.5, shape="spline"),
        marker=dict(color="#6DC641", size=6, line=dict(color="#FFFFFF", width=2)),
        fillcolor="rgba(109,198,65,0.12)",
        hovertemplate="%{x|%d %b}: <b>Rp %{y:,.0f}</b><extra></extra>",
    ))
    fig.update_layout(
        **PLOTLY_BASE, **_TRANSPARENT, height=180,
        margin=dict(l=0, r=0, t=0, b=0),
        xaxis=dict(**GRID, tickformat="%d %b", tickfont=dict(size=10, color="#6B7280"),
                   dtick="D1", ticklabelmode="instant", showgrid=False),
        yaxis=dict(**GRID, tickfont=dict(size=10, color="#6B7280"), tickformat=",.0f"),
        showlegend=False,
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
               marker=dict(color="#6DC641", line=dict(width=0))),
        go.Bar(name="Pengeluaran", x=exp["month_year"], y=exp["amount"],
               marker=dict(color="#F07A3A", line=dict(width=0))),
    ])
    fig.update_layout(
        **PLOTLY_BASE, **_WHITE_BG,
        barmode="group", height=300,
        margin=dict(l=0, r=0, t=32, b=0),
        title=dict(text="Pemasukan vs Pengeluaran per Bulan", font=dict(size=12, color="#1A1A1A"), x=0),
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
        markers=True, color_discrete_map=CATEGORY_COLORS, line_shape="spline",
    )
    fig.update_traces(line=dict(width=2.5), marker=dict(size=5))
    fig.update_layout(
        **PLOTLY_BASE, **_WHITE_BG,
        height=300,
        margin=dict(l=0, r=0, t=32, b=0),
        title=dict(text="Tren Pengeluaran per Kategori", font=dict(size=12, color="#1A1A1A"), x=0),
        xaxis=dict(**GRID, showgrid=False, tickfont=dict(size=11),
                   categoryorder="array", categoryarray=months_ordered),
        yaxis=dict(**GRID, tickfont=dict(size=10)),
        legend=dict(font=dict(size=10), bgcolor="rgba(0,0,0,0)"),
    )
    return fig


# ─────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────
def render_login():
    st.markdown("""
    <div style='max-width:400px;margin:60px auto;text-align:center;'>
      <div style='display:inline-flex;align-items:center;justify-content:center;
                  width:64px;height:64px;background:#6DC641;border-radius:20px;
                  font-size:30px;font-weight:800;color:#fff;margin-bottom:16px;
                  box-shadow:0 6px 24px rgba(109,198,65,0.4);'>G</div>
      <div style='font-size:28px;font-weight:800;color:#1A1A1A;margin-bottom:4px;'>Gajian Aman</div>
      <div style='font-size:13px;color:#6B7280;margin-bottom:36px;'>Keuangan digital Indonesia</div>
    </div>
    """, unsafe_allow_html=True)

    col = st.columns([1, 2, 1])[1]
    with col:
        uid = st.number_input("Telegram ID", min_value=1, step=1)
        if st.button("Masuk →", use_container_width=True, type="primary"):
            with get_engine().connect() as conn:
                user = conn.execute(
                    text("SELECT user_id, name FROM users WHERE user_id = :uid"),
                    {"uid": int(uid)}
                ).fetchone()
            if user:
                st.session_state["user_id"]   = user.user_id
                st.session_state["user_name"] = user.name
                st.rerun()
            else:
                st.error("User ID tidak ditemukan. Pastikan sudah /start ke bot dulu.")
        st.markdown("""
        <div style='background:#F0FFF4;border:1px solid #D1FAE5;border-radius:14px;
                    padding:14px 16px;font-size:11px;color:#1A1A1A;line-height:1.8;
                    text-align:left;margin-top:16px;'>
          <b>📱 Cara dapat Telegram ID:</b><br>
          1. Buka Telegram → cari <b>@SimpleID_Bot</b><br>
          2. Kirim <code>/start</code><br>
          3. Copy angka ID → paste di atas
        </div>
        """, unsafe_allow_html=True)


# ─────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────
def render_sidebar(user_name: str):
    with st.sidebar:
        st.markdown(f"""
        <div style='padding:12px 0 16px;'>
          <div style='display:flex;align-items:center;gap:10px;'>
            <div style='width:38px;height:38px;background:#6DC641;border-radius:12px;
                        display:flex;align-items:center;justify-content:center;
                        font-size:18px;font-weight:800;color:#fff;flex-shrink:0;'>G</div>
            <div>
              <div style='font-size:15px;font-weight:700;color:#fff;'>Gajian Aman</div>
              <div style='font-size:10px;color:rgba(255,255,255,0.45);'>
                Halo, {_html.escape(user_name)} 👋
              </div>
            </div>
          </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown('<hr style="border-color:rgba(255,255,255,0.12);margin:0 0 12px;">', unsafe_allow_html=True)

        today = date.today()
        month = st.selectbox("Bulan", range(1, 13), index=today.month - 1,
                             format_func=lambda m: calendar.month_name[m])
        year_opts = list(range(2024, today.year + 2))
        year = st.selectbox("Tahun", year_opts, index=year_opts.index(today.year))

        st.markdown('<hr style="border-color:rgba(255,255,255,0.12);margin:12px 0;">', unsafe_allow_html=True)

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
        <div style='font-size:10px;color:rgba(255,255,255,0.3);text-align:center;margin-bottom:8px;'>
          Powered by Claude · Supabase
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
    month_name    = calendar.month_name[month]
    df_exp        = df[df["type"] == "expense"]
    df_inc        = df[df["type"] == "income"]
    total_expense = float(df_exp["amount"].sum())
    total_income  = float(df_inc["amount"].sum())
    net           = total_income - total_expense
    healthy       = net >= 0
    expense_pct   = round(total_expense / total_income * 100) if total_income else 0

    st.markdown(page_header(
        "Ringkasan Keuangan", f"{month_name} {year}",
        "SEHAT ✓" if healthy else "DEFISIT ⚠️", healthy,
    ), unsafe_allow_html=True)

    # KPI cards
    k1, k2, k3, k4 = st.columns(4)
    k1.markdown(metric_card("Pemasukan",    fmt_idr(total_income, compact=True),
                            f"{len(df_inc)} transaksi", "teal", "💚"),    unsafe_allow_html=True)
    k2.markdown(metric_card("Pengeluaran",  fmt_idr(total_expense, compact=True),
                            f"{expense_pct}% dari income", "orange", "🔴"), unsafe_allow_html=True)
    k3.markdown(metric_card("Saldo Bersih", fmt_idr(abs(net), compact=True),
                            "Surplus" if healthy else "Defisit",
                            "dark" if healthy else "orange", "💰"),        unsafe_allow_html=True)
    k4.markdown(metric_card("Transaksi",    f"{len(df)} tx",
                            "bulan ini", "yellow", "📋"),                  unsafe_allow_html=True)

    # Overview table
    st.markdown(section_label("Semua Transaksi Bulan Ini"), unsafe_allow_html=True)
    if not df.empty:
        df_tbl = df.copy()
        df_tbl["Tanggal"] = pd.to_datetime(df_tbl["date"]).dt.strftime("%d %b %Y")
        df_tbl["Jenis"]   = df_tbl["type"].map({"income":"💚 Pemasukan","expense":"🔴 Pengeluaran"})
        df_tbl["Nominal"] = df_tbl.apply(
            lambda r: f"+{fmt_idr(float(r['amount']))}" if r["type"]=="income"
                      else f"−{fmt_idr(float(r['amount']))}", axis=1)
        df_tbl["Catatan"] = df_tbl["note"].fillna("—")
        st.dataframe(
            df_tbl[["Tanggal","Jenis","category","Catatan","Nominal"]]
            .rename(columns={"category":"Kategori"}),
            use_container_width=True, hide_index=True,
        )
    else:
        st.info("Belum ada transaksi bulan ini.")

    # Category bento + donut
    if not df_exp.empty:
        by_cat = (df_exp.groupby("category")["amount"]
                  .sum().sort_values(ascending=False).reset_index())
        cat_rows = [{"name": r["category"], "amount": float(r["amount"])}
                    for _, r in by_cat.iterrows()]

        st.markdown(section_label("Pengeluaran per Kategori"), unsafe_allow_html=True)
        col_b, col_d = st.columns([1.4, 1])
        with col_b:
            st.markdown(bento_categories_html(cat_rows, total_expense), unsafe_allow_html=True)
        with col_d:
            st.markdown(
                '<div style="background:#FFFFFF;border-radius:20px;padding:12px;'
                'box-shadow:0 2px 12px rgba(0,0,0,0.06);">',
                unsafe_allow_html=True,
            )
            st.plotly_chart(donut_chart(by_cat), use_container_width=True,
                            config={"displayModeBar": False})
            st.markdown('</div>', unsafe_allow_html=True)

    # Daily trend
    if not df_exp.empty:
        st.markdown(section_label("Tren Pengeluaran Harian"), unsafe_allow_html=True)
        st.markdown(
            '<div style="background:#FFFFFF;border-radius:20px;padding:16px;'
            'box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:12px;">',
            unsafe_allow_html=True,
        )
        st.plotly_chart(area_chart_daily(df), use_container_width=True,
                        config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

    # Budget vs actual
    df_bgt = fetch_budgets(user_id, month, year)
    if not df_bgt.empty:
        st.markdown(section_label("Budget"), unsafe_allow_html=True)
        bgt_list = [{"name": r["category"], "budget": float(r["budget"]),
                     "actual": float(r["actual"])} for _, r in df_bgt.iterrows()]
        st.markdown(budget_rows_html(bgt_list), unsafe_allow_html=True)

    # Recent txns + goals side by side
    col_tx, col_gl = st.columns(2)
    with col_tx:
        tx_data = [{"type": r["type"], "category": r["category"],
                    "note": r["note"], "amount": float(r["amount"]),
                    "date": str(r["date"])[:10]} for _, r in df.head(6).iterrows()]
        if tx_data:
            st.markdown(tx_list_html(tx_data), unsafe_allow_html=True)
    with col_gl:
        df_goals = fetch_goals(user_id)
        if not df_goals.empty:
            goals_list = [{"name": g["name"], "saved": float(g["saved_amount"]),
                           "target": float(g["target_amount"]),
                           "deadline": str(g["deadline"]) if g["deadline"] else ""}
                          for _, g in df_goals.iterrows()]
            st.markdown(goal_list_html(goals_list), unsafe_allow_html=True)

    if total_income > 0:
        st.markdown(income_alloc_html(total_expense, total_income), unsafe_allow_html=True)


# ─────────────────────────────────────────
# PAGE: PENGELUARAN
# ─────────────────────────────────────────
def page_pengeluaran(df_exp: pd.DataFrame, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(page_header("Pengeluaran", f"{month_name} {year}"), unsafe_allow_html=True)

    if df_exp.empty:
        st.info("Belum ada pengeluaran bulan ini.")
        return

    by_cat  = df_exp.groupby("category")["amount"].sum().sort_values(ascending=False).reset_index()
    total   = float(by_cat["amount"].sum())
    top_cat = by_cat.iloc[0]
    avg     = total / len(df_exp) if len(df_exp) else 0

    c1, c2, c3 = st.columns(3)
    c1.markdown(metric_card("Total Pengeluaran", fmt_idr(total, compact=True),
                            f"{len(df_exp)} transaksi", "orange", "🔴"), unsafe_allow_html=True)
    c2.markdown(metric_card("Kategori Terbesar", top_cat["category"],
                            fmt_idr(float(top_cat["amount"]), compact=True),
                            "dark", "📊"), unsafe_allow_html=True)
    c3.markdown(metric_card("Rata-rata / Transaksi", fmt_idr(avg, compact=True),
                            "per transaksi", "yellow", "📉"), unsafe_allow_html=True)

    st.markdown(section_label("Per Kategori"), unsafe_allow_html=True)
    cat_rows = [{"name": r["category"], "amount": float(r["amount"])} for _, r in by_cat.iterrows()]
    col_b, col_d = st.columns([1.4, 1])
    with col_b:
        st.markdown(bento_categories_html(cat_rows, total), unsafe_allow_html=True)
    with col_d:
        st.markdown(
            '<div style="background:#FFFFFF;border-radius:20px;padding:12px;'
            'box-shadow:0 2px 12px rgba(0,0,0,0.06);">',
            unsafe_allow_html=True,
        )
        st.plotly_chart(donut_chart(by_cat), use_container_width=True,
                        config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown(section_label("Detail per Kategori"), unsafe_allow_html=True)
    for _, row in by_cat.iterrows():
        with st.expander(f"{cat_icon(row['category'])} {row['category']} — "
                         f"{fmt_idr(float(row['amount']), compact=True)}"):
            sub = df_exp[df_exp["category"] == row["category"]][["date","note","amount"]].copy()
            sub = sub.sort_values("date", ascending=False)
            sub["Tanggal"] = pd.to_datetime(sub["date"]).dt.strftime("%d %b %Y")
            sub["Nominal"] = sub["amount"].apply(lambda x: fmt_idr(float(x)))
            st.dataframe(
                sub[["Tanggal","note","Nominal"]].rename(columns={"note":"Catatan"}),
                use_container_width=True, hide_index=True,
            )


# ─────────────────────────────────────────
# PAGE: BUDGET
# ─────────────────────────────────────────
def page_budget(user_id: int, month: int, year: int):
    month_name = calendar.month_name[month]
    st.markdown(page_header("Budget vs Aktual", f"{month_name} {year}"), unsafe_allow_html=True)

    df_bgt = fetch_budgets(user_id, month, year)
    if df_bgt.empty:
        st.info("Belum ada budget. Set via bot: `/budget food 500000`")
        return

    bgt_list = [{"name": r["category"], "budget": float(r["budget"]),
                 "actual": float(r["actual"])} for _, r in df_bgt.iterrows()]
    st.markdown(budget_rows_html(bgt_list), unsafe_allow_html=True)

    total_budget = float(df_bgt["budget"].sum())
    total_actual = float(df_bgt["actual"].sum())
    pct_used     = round(total_actual / total_budget * 100) if total_budget else 0
    remaining    = total_budget - total_actual

    c1, c2, c3 = st.columns(3)
    c1.markdown(metric_card("Total Budget",   fmt_idr(total_budget, compact=True),
                            "bulan ini", "teal", "📊"), unsafe_allow_html=True)
    c2.markdown(metric_card("Terpakai",       fmt_idr(total_actual, compact=True),
                            f"{pct_used}% dari budget",
                            "orange" if pct_used > 100 else "yellow" if pct_used > 80 else "green",
                            "📉"), unsafe_allow_html=True)
    c3.markdown(metric_card("Sisa Budget",    fmt_idr(abs(remaining), compact=True),
                            "aman" if remaining >= 0 else "defisit",
                            "dark" if remaining >= 0 else "orange",
                            "✅" if remaining >= 0 else "⚠️"), unsafe_allow_html=True)


# ─────────────────────────────────────────
# PAGE: GOALS
# ─────────────────────────────────────────
def page_goals(user_id: int):
    st.markdown(page_header("Savings Goals", "Pantau progress tabunganmu"), unsafe_allow_html=True)

    df_goals = fetch_goals(user_id)
    if df_goals.empty:
        st.info("Belum ada savings goal. Tambahkan via bot: `/goal add Liburan 5000000`")
        return

    goals_list = [{"name": g["name"], "saved": float(g["saved_amount"]),
                   "target": float(g["target_amount"]),
                   "deadline": str(g["deadline"]) if g["deadline"] else ""}
                  for _, g in df_goals.iterrows()]
    st.markdown(goal_list_html(goals_list), unsafe_allow_html=True)

    st.markdown(section_label("Detail"), unsafe_allow_html=True)
    for g in goals_list:
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
    st.markdown(page_header("Riwayat Transaksi", f"{month_name} {year}"), unsafe_allow_html=True)

    if df.empty:
        st.info("Belum ada transaksi bulan ini.")
        return

    col_f1, col_f2 = st.columns([2, 1])
    with col_f1:
        cat_filter  = st.multiselect("Filter Kategori", options=sorted(df["category"].unique()))
    with col_f2:
        type_filter = st.radio("Jenis", ["Semua","Pengeluaran","Pemasukan"], horizontal=True)

    display = df.copy()
    if cat_filter:
        display = display[display["category"].isin(cat_filter)]
    if type_filter == "Pengeluaran":
        display = display[display["type"] == "expense"]
    elif type_filter == "Pemasukan":
        display = display[display["type"] == "income"]

    display = display.sort_values("date", ascending=False).copy()
    display["Nominal"] = display.apply(
        lambda r: f"+{fmt_idr(float(r['amount']))}" if r["type"]=="income"
                  else f"−{fmt_idr(float(r['amount']))}", axis=1)
    display["Jenis"]   = display["type"].map({"expense":"🔴 Pengeluaran","income":"💚 Pemasukan"})
    display["Tanggal"] = pd.to_datetime(display["date"]).dt.strftime("%d %b %Y")
    display["Catatan"] = display["note"].fillna("—")

    st.dataframe(
        display[["Tanggal","Jenis","category","Catatan","Nominal"]]
        .rename(columns={"category":"Kategori"}),
        use_container_width=True, hide_index=True,
    )
    st.caption(f"{len(display)} transaksi ditampilkan")


# ─────────────────────────────────────────
# PAGE: TREN
# ─────────────────────────────────────────
def page_tren(user_id: int):
    st.markdown(page_header("Tren Keuangan", "Perkembangan keuangan dari waktu ke waktu"),
                unsafe_allow_html=True)

    df_all = fetch_all_transactions(user_id)
    if df_all.empty:
        st.info("Belum cukup data untuk analisis tren.")
        return

    st.markdown(
        '<div style="background:#FFFFFF;border-radius:20px;padding:20px;'
        'box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:12px;">',
        unsafe_allow_html=True,
    )
    st.plotly_chart(bar_chart_monthly(df_all), use_container_width=True,
                    config={"displayModeBar": False})
    st.markdown('</div>', unsafe_allow_html=True)

    df_exp_all = df_all[df_all["type"] == "expense"].copy()
    if not df_exp_all.empty:
        st.markdown(
            '<div style="background:#FFFFFF;border-radius:20px;padding:20px;'
            'box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:12px;">',
            unsafe_allow_html=True,
        )
        st.plotly_chart(line_chart_category(df_exp_all), use_container_width=True,
                        config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

    # Best month insight
    tmp = df_all.copy()
    tmp["period"] = tmp["date"].dt.to_period("M")
    monthly_net = tmp.groupby(["period","type"])["amount"].sum().unstack(fill_value=0)
    if "income" in monthly_net.columns and "expense" in monthly_net.columns:
        monthly_net["net"] = monthly_net["income"] - monthly_net["expense"]
        best_period = monthly_net["net"].idxmax()
        best_label  = pd.Period(best_period, "M").strftime("%b %Y")
        best_val    = float(monthly_net.loc[best_period, "net"])
        st.markdown(f"""
        <div style="background:#1B4332;border-radius:20px;padding:20px;color:#fff;">
          <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.45);
                      text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">
            ✦ Best Month
          </div>
          <span style="font-size:14px;">Bulan terbaik:
            <b style="color:#6DC641;">{best_label}</b> dengan saldo bersih
            <b style="color:#6DC641;">{fmt_idr(best_val)}</b>
          </span>
        </div>
        """, unsafe_allow_html=True)


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

    if   page == "🏠 Overview":    page_overview(df, month, year, user_id)
    elif page == "💸 Pengeluaran": page_pengeluaran(df_expense, month, year)
    elif page == "🎯 Budget":      page_budget(user_id, month, year)
    elif page == "🏆 Goals":       page_goals(user_id)
    elif page == "📋 Riwayat":     page_riwayat(df, month, year)
    elif page == "📈 Tren":        page_tren(user_id)


if __name__ == "__main__":
    main()
