# dashboard/app.py
# Gajian Aman — Streamlit Dashboard
# Visual reference: Nomad Agency dark-theme finance dashboard
# Design: dark bg, glassmorphism cards, teal-green accent, DM Mono numerics

import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from datetime import date
import calendar
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────
# PAGE CONFIG — must be first Streamlit call
# ─────────────────────────────────────────
st.set_page_config(
    page_title="Gajian Aman",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─────────────────────────────────────────
# GLOBAL CSS — Nomad Agency dark theme
# ─────────────────────────────────────────
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  html, body, [class*="css"] { font-family: 'Plus Jakarta Sans', sans-serif; }
  .stApp { background-color: #0f1117; }

  section[data-testid="stSidebar"] {
    background-color: #161b27;
    border-right: 1px solid #1e2535;
  }
  section[data-testid="stSidebar"] * { color: #94a3b8 !important; }

  div[data-testid="metric-container"] {
    background: #161b27;
    border: 1px solid #1e2535;
    border-radius: 12px;
    padding: 1rem 1.25rem;
  }
  div[data-testid="metric-container"] label {
    font-size: 11px !important;
    color: #64748b !important;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  div[data-testid="metric-container"] [data-testid="stMetricValue"] {
    font-family: 'DM Mono', monospace !important;
    font-size: 22px !important;
    font-weight: 500 !important;
    color: #f1f5f9 !important;
  }
  div[data-testid="metric-container"] [data-testid="stMetricDelta"] {
    font-size: 12px !important;
  }

  h1, h2, h3 { color: #f1f5f9 !important; }
  hr { border-color: #1e2535 !important; }

  .ft-card {
    background: #161b27;
    border: 1px solid #1e2535;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 12px;
  }
  .ft-card-title {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .ft-amount-pos { color: #34d399; font-family: 'DM Mono', monospace; font-weight: 500; }
  .ft-amount-neg { color: #f87171; font-family: 'DM Mono', monospace; font-weight: 500; }
  .ft-amount-neu { color: #f1f5f9; font-family: 'DM Mono', monospace; font-weight: 500; }
  .ft-badge-up   { background: rgba(52,211,153,0.12); color: #34d399; font-size: 11px; padding: 2px 8px; border-radius: 20px; }
  .ft-badge-down { background: rgba(248,113,113,0.12); color: #f87171; font-size: 11px; padding: 2px 8px; border-radius: 20px; }
  .ft-badge-warn { background: rgba(251,191,36,0.12);  color: #fbbf24; font-size: 11px; padding: 2px 8px; border-radius: 20px; }
  .ft-tx-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid #1e2535; font-size: 13px; color: #e2e8f0;
  }
  .ft-tx-row:last-child { border-bottom: none; }
  .ft-tx-cat { font-size: 11px; color: #64748b; margin-top: 2px; }

  .ft-login-box {
    background: rgba(13,155,118,0.08);
    border: 1px solid rgba(13,155,118,0.25);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.7;
    margin-top: 8px;
  }

  /* Center text inside number input */
  input[type="number"] {
    text-align: center !important;
  }
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────
# PLOTLY THEME — dark, transparent bg
# ─────────────────────────────────────────
PLOTLY_THEME = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font_family="Plus Jakarta Sans",
    font_color="#94a3b8",
    title_font_color="#f1f5f9",
    colorway=["#0d9b76", "#3b82f6", "#8b5cf6", "#fbbf24", "#f87171", "#34d399", "#ec4899"],
    xaxis=dict(gridcolor="#1e2535", zerolinecolor="#1e2535", linecolor="#1e2535"),
    yaxis=dict(gridcolor="#1e2535", zerolinecolor="#1e2535", linecolor="#1e2535"),
)


# ─────────────────────────────────────────
# DB CONNECTION
# ─────────────────────────────────────────
@st.cache_resource
def get_engine():
    url = os.getenv("DATABASE_URL_SYNC")
    return create_engine(url, pool_pre_ping=True)


def query_df(sql: str, params: dict = None) -> pd.DataFrame:
    with get_engine().connect() as conn:
        return pd.read_sql(text(sql), conn, params=params)


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────
CATEGORY_ICON = {
    "Food & Dining": "🍜", "Groceries": "🛒", "Transport": "🚗",
    "Shopping": "🛍️", "Health": "💊", "Entertainment": "🎮",
    "Bills & Utilities": "📱", "Education": "📚", "Personal Care": "💆",
    "Dining Out": "🍽️", "Salary": "💼", "Freelance": "💻",
    "Investment Return": "📈", "Other Income": "💰", "Savings": "🏦",
    "Investment": "📊", "Other": "📁",
}

def fmt_rp(amount: float) -> str:
    return f"Rp {int(amount):,}".replace(",", ".")


# ─────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style='text-align:center; padding: 12px 0 20px;'>
      <div style='display:inline-flex; align-items:center; justify-content:center;
                  width:42px; height:42px; background:#0d9b76; border-radius:10px;
                  font-size:20px; font-weight:700; color:#fff; margin-bottom:8px;'>G</div>
      <div style='font-size:16px; font-weight:600; color:#f1f5f9;'>Gajian Aman</div>
      <div style='font-size:11px; color:#64748b;'>Personal Finance</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")

    today = date.today()
    months = [calendar.month_name[m] for m in range(1, 13)]

    sel_month = st.selectbox("📅 Bulan", months, index=today.month - 1)
    sel_year  = st.selectbox("📆 Tahun", list(range(2023, today.year + 1)), index=today.year - 2023)

    st.markdown("---")

    st.markdown("**🔐 Login**")
    sel_user = st.number_input(
        "Telegram ID",
        value=0,
        step=1,
        help="Masukkan Telegram ID kamu untuk melihat data keuanganmu.",
    )

    st.markdown("""
    <div class='ft-login-box'>
      <b>📱 Cara dapat Telegram ID:</b><br>
      1. Buka Telegram<br>
      2. Cari bot <b>@SimpleID_Bot</b><br>
      3. Kirim <code>/start</code> ke bot tersebut<br>
      4. Copy angka ID yang muncul<br>
      5. Paste di kolom Telegram ID di atas
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("""
    <div style='font-size:11px; color:#64748b; text-align:center; padding-top:8px;'>
      📡 Connected to Supabase<br>
      🤖 Powered by Claude Haiku
    </div>
    """, unsafe_allow_html=True)

month_num = months.index(sel_month) + 1


# ─────────────────────────────────────────
# DATA LOAD
# ─────────────────────────────────────────
@st.cache_data(ttl=60)
def load_summary(user_id: int, month: int, year: int):
    uid_clause = "AND user_id = :uid" if user_id else ""
    params     = {"uid": user_id or None, "m": month, "y": year}
    params_no  = {"m": month, "y": year}
    p          = params if user_id else params_no

    by_cat = query_df(f"""
        SELECT category, SUM(amount) as total, COUNT(*) as cnt
        FROM transactions
        WHERE type = 'expense'
          AND EXTRACT(MONTH FROM date) = :m
          AND EXTRACT(YEAR FROM date) = :y
          {uid_clause}
        GROUP BY category ORDER BY total DESC
    """, p)

    income = query_df(f"""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE type = 'income'
          AND EXTRACT(MONTH FROM date) = :m
          AND EXTRACT(YEAR FROM date) = :y
          {uid_clause}
    """, p)

    txs = query_df(f"""
        SELECT amount, type, category, note, date, ai_confidence
        FROM transactions
        WHERE EXTRACT(MONTH FROM date) = :m
          AND EXTRACT(YEAR FROM date) = :y
          {uid_clause}
        ORDER BY date DESC, id DESC
        LIMIT 50
    """, p)

    budgets = query_df(f"""
        SELECT b.category, b.amount as budget,
               COALESCE(SUM(t.amount), 0) as actual
        FROM budgets b
        LEFT JOIN transactions t
          ON t.category = b.category AND t.type = 'expense'
          AND EXTRACT(MONTH FROM t.date) = b.month
          AND EXTRACT(YEAR FROM t.date) = b.year
          {'AND t.user_id = b.user_id' if user_id else ''}
        WHERE b.month = :m AND b.year = :y
          {'AND b.user_id = :uid' if user_id else ''}
        GROUP BY b.category, b.amount
    """, p)

    daily = query_df(f"""
        SELECT date, SUM(amount) as total
        FROM transactions
        WHERE type = 'expense'
          AND EXTRACT(MONTH FROM date) = :m
          AND EXTRACT(YEAR FROM date) = :y
          {uid_clause}
        GROUP BY date ORDER BY date
    """, p)

    return by_cat, income, txs, budgets, daily


# ─────────────────────────────────────────
# MAIN CONTENT
# ─────────────────────────────────────────
month_label = calendar.month_name[month_num]

st.markdown(f"""
<div style='padding: 0 0 16px;'>
  <div style='font-size:22px; font-weight:700; color:#f1f5f9;'>
    Overview — {month_label} {sel_year}
  </div>
  <div style='font-size:13px; color:#64748b; margin-top:4px;'>
    Ringkasan keuangan bulanan · Gajian Aman
  </div>
</div>
""", unsafe_allow_html=True)

# Show login prompt if no Telegram ID entered
if not int(sel_user):
    st.markdown("""
    <div style='background:#161b27; border:1px solid #1e2535; border-radius:12px;
                padding:40px; text-align:center; margin-top:32px;'>
      <div style='font-size:44px; margin-bottom:12px;'>🔐</div>
      <div style='font-size:18px; font-weight:600; color:#f1f5f9; margin-bottom:8px;'>
        Masukkan Telegram ID untuk melihat data keuanganmu
      </div>
      <div style='font-size:13px; color:#64748b; line-height:1.8;'>
        Dapatkan ID kamu dengan mengirim <code>/start</code> ke <b>@SimpleID_Bot</b> di Telegram,<br>
        lalu masukkan angka ID tersebut di kolom <em>Telegram ID</em> pada sidebar.
      </div>
    </div>
    """, unsafe_allow_html=True)
    st.stop()

try:
    by_cat, income_df, txs, budgets, daily = load_summary(int(sel_user), month_num, sel_year)
except Exception as e:
    st.error(f"❌ Gagal mengambil data: {e}")
    st.stop()

total_income  = float(income_df["total"].iloc[0]) if not income_df.empty else 0
total_expense = float(by_cat["total"].sum()) if not by_cat.empty else 0
net_balance   = total_income - total_expense
tx_count      = int(txs.shape[0])
savings_pct   = (net_balance / total_income * 100) if total_income > 0 else 0


# ─── KPI METRICS ──────────────────────────────────────────────
k1, k2, k3, k4 = st.columns(4)

with k1:
    st.metric("💚 Pemasukan", fmt_rp(total_income))
with k2:
    st.metric("🔴 Pengeluaran", fmt_rp(total_expense))
with k3:
    balance_label = "✅ Surplus" if net_balance >= 0 else "⚠️ Defisit"
    st.metric("💰 Saldo Bersih", fmt_rp(abs(net_balance)), delta=f"{balance_label} {savings_pct:.1f}%")
with k4:
    st.metric("📋 Transaksi", f"{tx_count} tx")

st.markdown("<div style='height:20px'></div>", unsafe_allow_html=True)


# ─── OVERVIEW TABLE ───────────────────────────────────────────
st.markdown("<div class='ft-card-title'>Tabel Semua Transaksi Bulan Ini</div>", unsafe_allow_html=True)

if not txs.empty:
    df_table = txs.copy()
    df_table["Tanggal"]  = pd.to_datetime(df_table["date"]).dt.strftime("%d %b %Y")
    df_table["Jenis"]    = df_table["type"].map({"income": "💚 Pemasukan", "expense": "🔴 Pengeluaran"})
    df_table["Nominal"]  = df_table.apply(
        lambda r: f"+{fmt_rp(float(r['amount']))}" if r["type"] == "income"
                  else f"-{fmt_rp(float(r['amount']))}",
        axis=1,
    )
    df_table["Kategori"] = df_table["category"]
    df_table["Catatan"]  = df_table["note"].fillna("-")
    st.dataframe(
        df_table[["Tanggal", "Jenis", "Kategori", "Catatan", "Nominal"]],
        use_container_width=True,
        hide_index=True,
    )
else:
    st.markdown(
        "<div style='color:#64748b;font-size:13px;padding:16px 0;'>Belum ada transaksi bulan ini.</div>",
        unsafe_allow_html=True,
    )

st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)


# ─── ROW 1: Kategori + Donut ──────────────────────────────────
col_left, col_right = st.columns([1.7, 1])

with col_left:
    st.markdown("<div class='ft-card-title'>Pengeluaran per Kategori</div>", unsafe_allow_html=True)

    if not by_cat.empty:
        colors = ["#0d9b76", "#3b82f6", "#8b5cf6", "#fbbf24", "#f87171",
                  "#34d399", "#ec4899", "#94a3b8", "#fb923c"]
        fig_bar = go.Figure(go.Bar(
            x=by_cat["total"],
            y=by_cat["category"],
            orientation="h",
            marker_color=colors[:len(by_cat)],
            text=[fmt_rp(v) for v in by_cat["total"]],
            textposition="outside",
            textfont=dict(family="DM Mono", size=11, color="#94a3b8"),
            hovertemplate="%{y}: <b>%{x:,.0f}</b><extra></extra>",
        ))
        fig_bar.update_layout(
            **PLOTLY_THEME,
            height=260,
            margin=dict(l=0, r=80, t=0, b=0),
            bargap=0.3,
            xaxis=dict(visible=False),
            yaxis=dict(autorange="reversed", tickfont=dict(size=12)),
            showlegend=False,
        )
        st.plotly_chart(fig_bar, use_container_width=True, config={"displayModeBar": False})
    else:
        st.markdown(
            "<div style='color:#64748b;font-size:13px;padding:24px 0;'>Belum ada data pengeluaran.</div>",
            unsafe_allow_html=True,
        )

with col_right:
    st.markdown("<div class='ft-card-title'>Distribusi Pengeluaran</div>", unsafe_allow_html=True)

    if not by_cat.empty:
        colors_donut = ["#0d9b76", "#3b82f6", "#8b5cf6", "#fbbf24", "#f87171",
                        "#34d399", "#ec4899", "#94a3b8"]
        fig_donut = go.Figure(go.Pie(
            labels=by_cat["category"],
            values=by_cat["total"],
            hole=0.65,
            marker_colors=colors_donut[:len(by_cat)],
            textinfo="none",
            hovertemplate="%{label}: <b>Rp %{value:,.0f}</b><br>%{percent}<extra></extra>",
        ))
        fig_donut.update_layout(
            **PLOTLY_THEME,
            height=240,
            margin=dict(l=0, r=0, t=0, b=0),
            showlegend=False,
            annotations=[dict(
                text=f"<b>{fmt_rp(total_expense)}</b>",
                x=0.5, y=0.5, font=dict(size=13, family="DM Mono", color="#f1f5f9"),
                showarrow=False,
            )],
        )
        st.plotly_chart(fig_donut, use_container_width=True, config={"displayModeBar": False})

st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)


# ─── ROW 2: Daily Trend + Budget ──────────────────────────────
col_trend, col_budget = st.columns([1.7, 1])

with col_trend:
    st.markdown("<div class='ft-card-title'>Tren Pengeluaran Harian</div>", unsafe_allow_html=True)

    if not daily.empty:
        fig_area = go.Figure()
        fig_area.add_trace(go.Scatter(
            x=daily["date"], y=daily["total"],
            mode="lines",
            fill="tozeroy",
            line=dict(color="#0d9b76", width=2),
            fillcolor="rgba(13,155,118,0.10)",
            hovertemplate="%{x|%d %b}: <b>Rp %{y:,.0f}</b><extra></extra>",
        ))
        fig_area.update_layout(
            **PLOTLY_THEME,
            height=200,
            margin=dict(l=0, r=0, t=0, b=0),
            xaxis=dict(tickformat="%d %b", tickfont=dict(size=10)),
            yaxis=dict(tickfont=dict(size=10), tickformat=",.0f"),
            showlegend=False,
        )
        st.plotly_chart(fig_area, use_container_width=True, config={"displayModeBar": False})
    else:
        st.markdown(
            "<div style='color:#64748b;font-size:13px;padding:24px 0;'>Belum ada data harian.</div>",
            unsafe_allow_html=True,
        )

with col_budget:
    st.markdown("<div class='ft-card-title'>Budget vs Aktual</div>", unsafe_allow_html=True)

    if not budgets.empty:
        for _, row in budgets.iterrows():
            pct = min((row["actual"] / row["budget"] * 100), 110) if row["budget"] > 0 else 0
            color = "#f87171" if pct > 100 else ("#fbbf24" if pct > 80 else "#0d9b76")
            status = "🔴" if pct > 100 else ("🟡" if pct > 80 else "🟢")
            icon = CATEGORY_ICON.get(row["category"], "📁")
            st.markdown(f"""
            <div style='margin-bottom:12px;'>
              <div style='display:flex; justify-content:space-between; font-size:12px; color:#94a3b8; margin-bottom:4px;'>
                <span>{status} {icon} {row["category"]}</span>
                <span style='font-family:DM Mono,monospace;'>{pct:.0f}%</span>
              </div>
              <div style='background:#1e2535; border-radius:4px; height:5px;'>
                <div style='width:{min(pct,100):.0f}%; background:{color}; height:5px; border-radius:4px;'></div>
              </div>
              <div style='font-size:10px; color:#475569; margin-top:3px; font-family:DM Mono,monospace;'>
                {fmt_rp(row["actual"])} / {fmt_rp(row["budget"])}
              </div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown(
            "<div style='color:#64748b;font-size:13px;'>Belum ada budget. Gunakan /budget di bot.</div>",
            unsafe_allow_html=True,
        )

st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)


# ─── RECENT TRANSACTIONS ──────────────────────────────────────
st.markdown("<div class='ft-card-title'>Transaksi Terbaru</div>", unsafe_allow_html=True)

if not txs.empty:
    html_rows = ""
    for _, tx in txs.head(20).iterrows():
        icon = CATEGORY_ICON.get(tx["category"], "📁")
        is_income = tx["type"] == "income"
        amt_class = "ft-amount-pos" if is_income else "ft-amount-neg"
        sign = "+" if is_income else "−"
        conf_badge = {"high": "✅", "medium": "⚠️", "low": "❓"}.get(tx.get("ai_confidence", "high"), "✅")
        date_str = pd.to_datetime(tx["date"]).strftime("%d %b")
        html_rows += f"""
        <div class='ft-tx-row'>
          <div>
            <div>{icon} {tx["note"] or tx["category"]} <span style='font-size:10px;color:#475569;'>{conf_badge}</span></div>
            <div class='ft-tx-cat'>{tx["category"]} · {date_str}</div>
          </div>
          <div class='{amt_class}'>{sign}{fmt_rp(float(tx["amount"]))}</div>
        </div>
        """
    st.markdown(f"<div class='ft-card'>{html_rows}</div>", unsafe_allow_html=True)
else:
    st.markdown(
        "<div style='color:#64748b;font-size:13px;padding:16px 0;'>Belum ada transaksi bulan ini.</div>",
        unsafe_allow_html=True,
    )


# ─── FOOTER ───────────────────────────────────────────────────
st.markdown("---")
st.markdown("""
<div style='text-align:center; font-size:11px; color:#334155; padding:8px 0;'>
  Gajian Aman &nbsp;·&nbsp; Powered by Claude Haiku + Supabase
</div>
""", unsafe_allow_html=True)
