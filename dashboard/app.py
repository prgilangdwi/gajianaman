# dashboard/app.py
# Streamlit personal finance dashboard

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from sqlalchemy import create_engine, text
from datetime import date
import calendar
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL_SYNC")
engine = create_engine(DB_URL)

# ─── Page Config ────────────────────────
st.set_page_config(
    page_title="FinTrack Dashboard",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .metric-card {
        background: #1e1e2e;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
    }
    .stMetric { background: #f8f9fa; border-radius: 8px; padding: 12px; }
</style>
""", unsafe_allow_html=True)


# ─── Auth (simple user_id login) ────────
def login():
    st.title("💰 FinTrack Dashboard")
    st.subheader("Login dengan Telegram User ID")
    user_id = st.number_input("Telegram User ID", min_value=1, step=1)
    if st.button("Masuk"):
        with engine.connect() as conn:
            user = conn.execute(
                text("SELECT user_id, name FROM users WHERE user_id = :uid"),
                {"uid": user_id}
            ).fetchone()
        if user:
            st.session_state["user_id"] = user.user_id
            st.session_state["user_name"] = user.name
            st.rerun()
        else:
            st.error("User ID tidak ditemukan. Pastikan kamu sudah /start bot dulu.")


# ─── Data Fetchers ───────────────────────
@st.cache_data(ttl=300)
def fetch_transactions(user_id: int, month: int, year: int):
    with engine.connect() as conn:
        df = pd.read_sql(text("""
            SELECT amount, type, category, subcategory, note, date
            FROM transactions
            WHERE user_id = :uid
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
            ORDER BY date
        """), conn, params={"uid": user_id, "month": month, "year": year})
    return df


@st.cache_data(ttl=300)
def fetch_all_transactions(user_id: int):
    with engine.connect() as conn:
        df = pd.read_sql(text("""
            SELECT amount, type, category, date,
                   EXTRACT(MONTH FROM date) as month,
                   EXTRACT(YEAR FROM date) as year
            FROM transactions
            WHERE user_id = :uid
            ORDER BY date
        """), conn, params={"uid": user_id})
    return df


@st.cache_data(ttl=300)
def fetch_budgets(user_id: int, month: int, year: int):
    with engine.connect() as conn:
        df = pd.read_sql(text("""
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
    return df


@st.cache_data(ttl=300)
def fetch_goals(user_id: int):
    with engine.connect() as conn:
        df = pd.read_sql(text("""
            SELECT name, target_amount, saved_amount, deadline
            FROM goals WHERE user_id = :uid
        """), conn, params={"uid": user_id})
    return df


# ─── Main Dashboard ──────────────────────
def main():
    if "user_id" not in st.session_state:
        login()
        return

    user_id = st.session_state["user_id"]
    user_name = st.session_state["user_name"]

    # Sidebar
    with st.sidebar:
        st.title(f"👋 {user_name}")
        st.divider()

        today = date.today()
        month = st.selectbox("Bulan", range(1, 13), index=today.month - 1,
                             format_func=lambda m: calendar.month_name[m])
        year = st.selectbox("Tahun", range(2024, today.year + 1), index=0)
        st.divider()

        page = st.radio("📊 Halaman", [
            "🏠 Overview",
            "💸 Pengeluaran",
            "🎯 Budget",
            "🏆 Goals",
            "📋 Riwayat",
            "📈 Tren"
        ])

        if st.button("🔓 Logout"):
            del st.session_state["user_id"]
            del st.session_state["user_name"]
            st.rerun()

    # Load data
    df = fetch_transactions(user_id, month, year)
    df_expense = df[df["type"] == "expense"]
    df_income = df[df["type"] == "income"]

    total_expense = df_expense["amount"].sum()
    total_income = df_income["amount"].sum()
    net = total_income - total_expense
    month_name = calendar.month_name[month]

    # ── Page: Overview ────────────────────
    if page == "🏠 Overview":
        st.title(f"💰 Overview — {month_name} {year}")

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("💚 Pemasukan", f"Rp {total_income:,.0f}".replace(",", "."))
        col2.metric("🔴 Pengeluaran", f"Rp {total_expense:,.0f}".replace(",", "."))
        col3.metric("💰 Saldo Bersih", f"Rp {net:,.0f}".replace(",", "."),
                    delta=f"{'Surplus' if net >= 0 else 'Defisit'}",
                    delta_color="normal" if net >= 0 else "inverse")
        col4.metric("📝 Transaksi", len(df))

        st.divider()
        col_a, col_b = st.columns(2)

        with col_a:
            if not df_expense.empty:
                fig = px.pie(
                    df_expense.groupby("category")["amount"].sum().reset_index(),
                    values="amount", names="category",
                    title="Pengeluaran per Kategori",
                    color_discrete_sequence=px.colors.qualitative.Set3
                )
                fig.update_traces(textposition="inside", textinfo="percent+label")
                st.plotly_chart(fig, use_container_width=True)

        with col_b:
            if not df.empty:
                daily = df_expense.groupby("date")["amount"].sum().reset_index()
                fig2 = px.bar(daily, x="date", y="amount",
                              title="Pengeluaran Harian",
                              color_discrete_sequence=["#ef4444"])
                fig2.update_layout(xaxis_title="Tanggal", yaxis_title="Amount (IDR)")
                st.plotly_chart(fig2, use_container_width=True)

    # ── Page: Pengeluaran ─────────────────
    elif page == "💸 Pengeluaran":
        st.title(f"💸 Pengeluaran — {month_name} {year}")

        if df_expense.empty:
            st.info("Belum ada pengeluaran bulan ini.")
            return

        by_cat = df_expense.groupby("category")["amount"].sum().sort_values(ascending=False).reset_index()

        fig = px.bar(by_cat, x="category", y="amount",
                     title="Total Pengeluaran per Kategori",
                     color="amount",
                     color_continuous_scale="Reds")
        fig.update_layout(showlegend=False, xaxis_title="", yaxis_title="IDR")
        st.plotly_chart(fig, use_container_width=True)

        st.subheader("Detail per Kategori")
        for _, row in by_cat.iterrows():
            with st.expander(f"📁 {row['category']} — Rp {row['amount']:,.0f}".replace(",", ".")):
                sub = df_expense[df_expense["category"] == row["category"]][["date", "subcategory", "note", "amount"]]
                sub = sub.sort_values("date", ascending=False)
                sub["amount"] = sub["amount"].apply(lambda x: f"Rp {x:,.0f}".replace(",", "."))
                st.dataframe(sub, use_container_width=True, hide_index=True)

    # ── Page: Budget ──────────────────────
    elif page == "🎯 Budget":
        st.title(f"🎯 Budget vs Aktual — {month_name} {year}")

        df_budget = fetch_budgets(user_id, month, year)

        if df_budget.empty:
            st.info("Belum ada budget. Set budget via bot: `/budget food 500000`")
            return

        df_budget["pct"] = (df_budget["actual"] / df_budget["budget"] * 100).clip(upper=150)
        df_budget["remaining"] = df_budget["budget"] - df_budget["actual"]
        df_budget["status"] = df_budget["pct"].apply(
            lambda p: "🔴 Over" if p > 100 else ("🟡 Warning" if p > 80 else "🟢 OK")
        )

        for _, row in df_budget.iterrows():
            pct = min(row["pct"], 100)
            col1, col2 = st.columns([3, 1])
            with col1:
                st.markdown(f"**{row['status']} {row['category']}**")
                st.progress(pct / 100)
                st.caption(
                    f"Rp {row['actual']:,.0f} / Rp {row['budget']:,.0f} ({row['pct']:.0f}%)".replace(",", ".")
                )
            with col2:
                remaining = row["remaining"]
                label = "Sisa" if remaining >= 0 else "Lebih"
                color = "green" if remaining >= 0 else "red"
                st.markdown(f"<p style='color:{color};font-weight:bold'>{label}: Rp {abs(remaining):,.0f}</p>".replace(",", "."),
                            unsafe_allow_html=True)
            st.divider()

    # ── Page: Goals ───────────────────────
    elif page == "🏆 Goals":
        st.title("🏆 Savings Goals")

        df_goals = fetch_goals(user_id)

        if df_goals.empty:
            st.info("Belum ada savings goal. Tambahkan via bot: `/goal add Liburan 5000000`")
            return

        for _, g in df_goals.iterrows():
            pct = min(float(g["saved_amount"]) / float(g["target_amount"]) * 100, 100) if g["target_amount"] > 0 else 0
            st.subheader(f"🎯 {g['name']}")
            st.progress(pct / 100)
            col1, col2, col3 = st.columns(3)
            col1.metric("Terkumpul", f"Rp {g['saved_amount']:,.0f}".replace(",", "."))
            col2.metric("Target", f"Rp {g['target_amount']:,.0f}".replace(",", "."))
            col3.metric("Progress", f"{pct:.1f}%")
            if g["deadline"]:
                st.caption(f"📅 Deadline: {g['deadline']}")
            st.divider()

    # ── Page: Riwayat ─────────────────────
    elif page == "📋 Riwayat":
        st.title(f"📋 Riwayat Transaksi — {month_name} {year}")

        if df.empty:
            st.info("Belum ada transaksi bulan ini.")
            return

        display = df[["date", "type", "category", "subcategory", "note", "amount"]].copy()
        display["amount"] = display["amount"].apply(lambda x: f"Rp {x:,.0f}".replace(",", "."))
        display["type"] = display["type"].map({"expense": "🔴 Pengeluaran", "income": "💚 Pemasukan"})
        display = display.sort_values("date", ascending=False)

        cat_filter = st.multiselect("Filter Kategori", options=df["category"].unique())
        if cat_filter:
            display = display[display["category"].isin(cat_filter)]

        st.dataframe(display, use_container_width=True, hide_index=True)

    # ── Page: Tren ────────────────────────
    elif page == "📈 Tren":
        st.title("📈 Tren Keuangan (3 Bulan Terakhir)")

        df_all = fetch_all_transactions(user_id)
        if df_all.empty:
            st.info("Belum cukup data untuk analisis tren.")
            return

        df_all["date"] = pd.to_datetime(df_all["date"])
        df_all["month_year"] = df_all["date"].dt.strftime("%b %Y")

        monthly = df_all.groupby(["month_year", "type"])["amount"].sum().reset_index()

        fig = px.bar(monthly, x="month_year", y="amount", color="type",
                     barmode="group",
                     title="Pemasukan vs Pengeluaran per Bulan",
                     color_discrete_map={"expense": "#ef4444", "income": "#22c55e"})
        st.plotly_chart(fig, use_container_width=True)

        # Category trend
        df_exp_all = df_all[df_all["type"] == "expense"]
        cat_monthly = df_exp_all.groupby(["month_year", "category"])["amount"].sum().reset_index()

        fig2 = px.line(cat_monthly, x="month_year", y="amount", color="category",
                       title="Tren Pengeluaran per Kategori",
                       markers=True)
        st.plotly_chart(fig2, use_container_width=True)


if __name__ == "__main__":
    main()
