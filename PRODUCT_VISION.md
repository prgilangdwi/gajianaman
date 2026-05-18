# Gajian Aman — Final Product Vision

## Section 21: Long-Term Vision & Strategic Roadmap

*Gajian Aman (Safe Paycheck) is the financial companion for Indonesian salaried workers who deserve to know where their money goes.*

---

## 1. Mission Statement

**"Empower Indonesian salaried workers to take control of their finances through AI-powered transaction logging, intelligent budgeting, and actionable insights—all in one place: web, Telegram, and beyond."**

Our belief: Financial literacy shouldn't be complicated. Your money tracking shouldn't be either.

---

## 2. Core Value Proposition

### For the User
- **Effortless Tracking**: Catat via Telegram, laporan di web. No friction.
- **AI That Actually Helps**: Not just categorizing—predicting, recommending, warning.
- **Privacy First**: Your data never leaves Supabase (Singapore). Not sold, not tracked.
- **Indonesian-First**: Designed for Indo income patterns, holidays, and behavior.
- **Affordable**: Free tier is full-featured. Premium is optional, not mandatory.

### For the Team
- **Building in Public**: Transparent roadmap, open feedback, user-driven.
- **Technical Excellence**: Clean code, async-first, scalable infrastructure.
- **Sustainable Growth**: Free + paid tiers = recurring revenue without compromising free users.

---

## 3. Product Pillars (Current)

### Pillar 1: Effortless Entry
- **Telegram Bot**: Fast, casual, always-in-pocket transaction logging
- **Web Dashboard**: Detailed entry, upload receipts, backdate transactions
- **AI Categorization**: Just type naturally; AI understands context

**Current State**: ✅ Launched (Telegram bot + web forms)  
**Next**: Mobile app entry points, voice input, photo receipt parsing

### Pillar 2: Intelligent Insights
- **Dashboard**: Income vs. expense, category breakdown, trend lines
- **Laporan (Reports)**: Monthly summaries, downloadable PDF/CSV
- **AI Budget Recommendation**: Personalized budget suggestions based on spending
- **Smart Alerts**: "Spending unusually high in X category"

**Current State**: ✅ Core analytics complete, alerts in beta  
**Next**: Predictive budget (forecast 3 months ahead), anomaly detection

### Pillar 3: Goals & Control
- **Savings Goals**: Set targets, track progress, celebrate milestones
- **Budget Management**: Per-category limits, month-over-month tracking
- **Recurring Transactions**: Auto-detect salary, subscriptions, rent
- **Risk Profile**: Classify spending as essential (rent), comfort (food), luxury (gadgets)

**Current State**: ✅ Goals & budget core complete  
**Next**: Recurring prediction, debt tracking (credit card, loans)

### Pillar 4: Social Features (Early Stage)
- **Split Bill**: Share expenses, settle up via WhatsApp
- **Shared Wallets**: Multiple users on one wallet (couples, roommates, family)

**Current State**: ✅ Split Bill launched  
**Next**: Shared wallet, expense sharing notifications

---

## 4. Long-Term Vision (12-36 Months)

### Phase 1: Consolidation & Monetization (0-6 months)
**Goal:** Maximize free tier engagement, launch Pro/Premium tiers, establish revenue.

**Features:**
- ✅ Recurring transaction auto-detection
- ✅ Multi-month netting & trend analysis
- ✅ Enhanced split bill with settle-up flows
- ✅ Admin dashboard (for future B2B expansion)
- ✅ Subscription tiers (Gratis, Starter, Pro)

**Metrics:**
- DAU (Daily Active Users) from Telegram
- Free → Paid conversion rate (target: 5-10%)
- Revenue per user (target: $5-10/month on paid)

### Phase 2: Intelligence & Automation (6-12 months)
**Goal:** Move from logging to prediction; reduce user effort; increase actionability.

**Features:**
- **Smart Reminders**: "You usually spend Rp X in food this week, currently at Rp Y"
- **Category Prediction**: Auto-suggest category based on merchant + history
- **Spending Forecast**: "At current pace, you'll spend Rp 15M this month"
- **Bill Detection**: Parse incoming bank SMS for transactions
- **Subscription Tracker**: Alert for recurring charges, find hidden subscriptions

**Integration Points:**
- Bank SMS parsing (for automatic transaction pulls)
- E-invoice (Faktur Pajak) integration for business users
- WhatsApp bot integration (alongside Telegram)

**Metrics:**
- % of transactions auto-categorized (target: 70%+)
- User engagement (target: 4x/week interaction)
- Forecast accuracy (target: >85% within ±10%)

### Phase 3: Community & Monetization (12-18 months)
**Goal:** Build community, enable user-to-user features, expand revenue streams.

**Features:**
- **Shared Wallets**: Couples, roommates, families manage joint budgets
- **Community Challenges**: "Save 20% this month" with leaderboards (anonymous)
- **Affiliate Program**: Recommend financial products (insurance, investment)
- **API for Partners**: Integrate with payroll systems, accounting software
- **White-Label Version**: For corporate employee benefits programs

**Revenue Streams:**
- Subscription (Starter, Pro, Premium)
- Affiliate commissions (insurance, investment products)
- B2B white-label licensing
- Optional data analytics (anonymized, aggregated) for financial institutions

**Metrics:**
- Monthly Active Users (target: 50K)
- Paid tier adoption (target: 20K users)
- Annual Recurring Revenue (target: $100K)

### Phase 4: Ecosystem Expansion (18-36 months)
**Goal:** Become the financial OS for Indonesian workers.

**Features:**
- **Investment Tracker**: Portfolio tracking, dividend notifications
- **Debt Manager**: Track loans, EMIs, payment schedules
- **Insurance Hub**: Policy management, claims tracking, renewal alerts
- **Payslip Parser**: Auto-extract salary, tax, deductions from payslips
- **Mobile App**: Native iOS/Android with offline-first sync
- **Telegram Mini App**: Desktop-like experience within Telegram
- **SMS-Based Logging**: Support basic entry via SMS (for low-connectivity areas)

**Integrations:**
- Bank APIs (BCA, Mandiri, BRI Open Banking)
- Investment platforms (Stockbit, Investree)
- Insurance providers (Asuransi Umum, Prudential)
- Payroll systems (Talenta, Accurate)

**Market Expansion:**
- Launch in Malaysia (Bahasa Malay version)
- Launch in Philippines (English version)
- Explore B2B partnerships (HR platforms, fintech integrations)

**Metrics:**
- DAU across all platforms (web, bot, mobile app): 100K+
- Expanded feature adoption: >60% of users tracking investments
- Regional expansion: 20% of users from outside Indonesia

---

## 5. Strategic Priorities

### Near-Term (0-3 months)
1. ✅ Complete Major Update V2 PRD (all sections)
2. ✅ Launch dynamic landing page
3. 🔲 Execute database migrations (transactions, recurring, aggregates)
4. 🔲 Set admin account & license system
5. 🔲 Launch Starter tier (9,900 IDR/month)
6. 🔲 Set up payment processor (Stripe, Doku, or iPaymu)

### Medium-Term (3-6 months)
1. 🔲 Achieve 5K monthly active users
2. 🔲 10% free-to-paid conversion
3. 🔲 Implement recurring transaction detection
4. 🔲 Launch "Smart Alerts" feature
5. 🔲 Partner with 1-2 fintech companies
6. 🔲 Establish support process (email, Discord)

### Long-Term (6-12 months)
1. 🔲 Launch mobile app (iOS/Android)
2. 🔲  20K monthly active users
3. 🔲 $10K MRR (Monthly Recurring Revenue)
4. 🔲 Expand to Malaysia & Philippines
5. 🔲 Integrate with 3+ bank APIs
6. 🔲 Launch community features (shared wallets, challenges)

---

## 6. Success Metrics (North Star)

### User Engagement
- **DAU (Daily Active Users)**: Target 50K by end of Year 1
- **Retention**: 50% of users return weekly
- **Feature Adoption**: 80% of users try Premium features
- **NPS (Net Promoter Score)**: Target >50 (excellent)

### Financial Health
- **MRR (Monthly Recurring Revenue)**: Target $50K by end of Year 1
- **Churn Rate**: <5% monthly (typical for fintech)
- **Customer Acquisition Cost (CAC)**: <$5 per user
- **Lifetime Value (LTV)**: >$100 per paying user

### Product Quality
- **Uptime**: 99.9% (supported by Supabase + Vercel)
- **Error Rate**: <0.1% (tracked via Sentry)
- **Feature Completion**: <2 weeks from PRD to production
- **Bug Resolution**: >80% of P1 bugs fixed within 24h

### User Satisfaction
- **Support Resolution Time**: <24 hours for standard inquiries
- **Feature Request Response Rate**: 100% (acknowledge all, respond to top)
- **User Feedback Incorporation**: 20% of monthly releases are user-requested

---

## 7. Competitive Landscape

### vs. Spreadsheet
- ❌ Manual, error-prone, hard to access on mobile
- ✅ Gajian Aman: AI, mobile-first, real-time sync

### vs. YNAB (You Need A Budget)
- ❌ Designed for US market, expensive ($14/month), requires frequent input
- ✅ Gajian Aman: Indonesian-first, affordable, Telegram integration, AI categorization

### vs. Bank Apps
- ❌ Only show transactions, no budgeting, limited analytics
- ✅ Gajian Aman: Multi-wallet, budgeting, forecasting, goals

### vs. Local Competitors (Fintech)
- ❌ Most focus on lending/investment, not expense tracking
- ✅ Gajian Aman: Focused on tracking + budgeting, not lending

---

## 8. Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low adoption in free tier | Medium | High | Referral program, community building |
| High churn in paid tier | Medium | High | Feature-rich free tier, frequent updates |
| Data privacy concerns | Low | Critical | Transparent privacy policy, no third-party sales |
| Bank API integration delays | Medium | Medium | Build without APIs first, integrate later |
| Competition from larger fintech | Medium | Medium | Focus on niche (Indonesia), community moat |
| Payment processor issues | Low | Medium | Support multiple processors (Stripe + local) |

---

## 9. The "Why" Behind Gajian Aman

Indonesian salaried workers face a unique challenge:
- **Inconsistent income**: Bonus (13th month), overtime, allowances
- **Irregular expenses**: Rent, insurance, subscriptions not monthly
- **Tax complexity**: PPh 21, NPWP management
- **Social pressure**: Funding family, weddings, group meals (gotong royong)

Most financial tools are built for Western markets. Gajian Aman is built for **you**.

---

## 10. Call to Action

### For Users
**Start here:** gajian-aman.vercel.app
- Sign up with Telegram ID or Google (30 seconds)
- Log your first transaction (via web or bot)
- Invite a friend
- Share feedback

### For Contributors
**Code quality matters.** See [DEVELOPMENT_PRINCIPLES.md](./DEVELOPMENT_PRINCIPLES.md)
- Fork, feature branch, PR
- Follow semantic commits
- Tests + docs required
- We're selective about features, generous with support

### For Partners
We're open to partnerships:
- **Fintech integrations**: Bank APIs, investment platforms
- **B2B licensing**: HR platforms, corporate benefits
- **Affiliate programs**: Insurance, investment products
- **Localization**: Help us expand to Malaysia, Philippines, Vietnam

---

## Timeline

```
2024 Q4  ← You are here (Major Update V2)
  │
  ├─ Launch subscription tiers
  ├─ Hit 5K DAU
  ├─ $1K MRR
  │
2025 Q1-Q2: Intelligence & Automation
  ├─ Smart Alerts
  ├─ Spending Forecast
  ├─ Bill Detection
  │
2025 Q3-Q4: Community & Expansion
  ├─ Shared Wallets
  ├─ Mobile App (iOS/Android)
  ├─ API for Partners
  │
2026 Q1+: Ecosystem Consolidation
  ├─ 20K DAU
  ├─ $10K MRR
  ├─ Regional expansion (Malaysia, Philippines)
  └─ Become the Financial OS for Southeast Asia
```

---

## Closing: Our Philosophy

> *We're not trying to be everything to everyone. We're trying to be the best at one thing: helping Indonesian salaried workers understand and control their finances.*

Simple. Transparent. Local. Sustainable.

**Gajian Aman: Udah gajian, kamu yang kontrol.**

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Next Review:** August 2026 (quarterly)  
**Maintained By:** Gajian Aman Founding Team  
**Contact:** pr.gilangdwi@gmail.com
