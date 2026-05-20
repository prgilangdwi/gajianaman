# PHASE 05: ANALYTICS & VISUALIZATION SYSTEM
> [!IMPORTANT]
> **Duration:** 5-7 days
> **Dependencies:** Phase 04 complete (ChartCard, StatCard available)
> **Owner:** Principal Architect / Data Visualization Lead

## 1. CROSS-REFERENCE TO MASTER ROADMAP
All visualizations must be responsive and follow the Data Visualization UI Kit guidelines. Code must adhere strictly to the micro-batch rules for Claude Code execution safety.

## 2. SCOPE BOUNDARIES

### 2.1 IN-SCOPE
- Redesign `Laporan.tsx` (Monthly Report): Insights first, charts second, health score with inline explanation.
- Redesign `Tren.tsx` (Trends): Stacked area charts, time toggles, annotations.
- Redesign `Forecasting.tsx`: Methodology explanations, plain-language volatility, alerts, inline adjustments.
- Redesign `Pengeluaran.tsx` (Spending): Tab navigation, progress bars, status badges, drill-downs.
- Redesign `Pemasukan.tsx` (Income): Source breakdown, trend comparisons.
- Create reusable visualization primitives: `TrendBadge`, `ProgressBar`, `ComparisonRow`, `MetricCard`.

### 2.2 OUT-OF-SCOPE
- Navigation structure (completed in Phase 03).
- Dashboard/Overview (completed in Phase 04).
- AI Assistant backend logic (deferred to Phase 06).
- Wallet system.

## 3. PRE-FLIGHT CHECKS
- [ ] Phase 04 components (`ChartCard`, `StatCard`) are merged and tested.
- [ ] Review Figma Data Visualization UI Kit.
- [ ] Ensure Recharts is at the latest compatible version.

## 4. IMPLEMENTATION SEQUENCE (MICRO-BATCHED)

### BATCH 1: Visualization Primitives
1. Create `TrendBadge.tsx` (handles ↑/↓/→ icons automatically based on positive/negative metrics).
2. Create `ProgressBar.tsx` (semantic colors: green if safe, red if over budget).
3. Create `ComparisonRow.tsx` for side-by-side metric comparison.
4. Create `MetricCard.tsx`.

### BATCH 2: Laporan & Tren
1. Refactor `Laporan.tsx` to position insights at the top.
2. Implement health score component using a linear bar (remove old gauge).
3. Add collapsible category breakdown sections.
4. Refactor `Tren.tsx` to use a single hero stacked area chart for Income/Expense.
5. Implement 3/6/12-month time toggle.

### BATCH 3: Forecasting & Drill-downs
1. Refactor `Forecasting.tsx` to include clear textual methodology.
2. Add inline forecast adjustment capability.
3. Update `Pengeluaran.tsx` and `Pemasukan.tsx` with tabs, budgets, and comparison charts.

## 5. FILE TOUCH LIST
- `[CREATE]` `/frontend/src/components/ui/TrendBadge.tsx`
- `[CREATE]` `/frontend/src/components/ui/ProgressBar.tsx`
- `[CREATE]` `/frontend/src/components/ui/ComparisonRow.tsx`
- `[CREATE]` `/frontend/src/components/ui/MetricCard.tsx`
- `[MODIFY]` `/frontend/src/pages/Laporan.tsx`
- `[MODIFY]` `/frontend/src/pages/Tren.tsx`
- `[MODIFY]` `/frontend/src/pages/Forecasting.tsx`
- `[MODIFY]` `/frontend/src/pages/Pengeluaran.tsx`
- `[MODIFY]` `/frontend/src/pages/Pemasukan.tsx`

## 6. EXPECTED OUTPUTS
A cohesive, high-performance set of analytics pages that tell a clear financial story using modern, accessible charts and metrics.

## 7. VALIDATION STEPS
- Hovering over charts triggers Recharts tooltips instantly without lag.
- Resizing the window correctly resizes all charts.
- Negative values format correctly in currency strings and red/green `TrendBadge`s.

## 8. GIT COMMIT CHECKPOINTS
- `feat(charts): add reusable data visualization primitives`
- `refactor(analytics): redesign Laporan and Tren pages`
- `refactor(analytics): update Forecasting, Spending, and Income drill-downs`

## 9. ROLLBACK INSTRUCTIONS
1. `git checkout develop`
2. `git revert` the commits affecting the `/pages` directory.

## 10. SESSION RECAP TEMPLATE
(Use standard template from Phase 01)

## 11. ARCHITECTURE NOTES
Recharts wrappers must be strict about rendering dimensions to prevent layout shifts (CLS).

## 12. UI CONSISTENCY CHECKS
- Ensure Recharts colors reference the CSS variables created in Phase 02.

## 13. MOBILE RESPONSIVENESS CHECKS
- On screens < 768px, charts should scroll horizontally if density is too high, or switch to a simplified view.

## 14. ACCESSIBILITY CHECKS
- All SVG charts must have `role="img"` and `aria-label` describing the chart data.

## 15. TECHNICAL DEBT PREVENTION CHECKS
- Ensure no inline styles are used for chart coloring; map CSS variables directly.

## 16. CLAUDE CODE SESSION BATCHES
Session 1: Primitives.
Session 2: Laporan & Tren.
Session 3: Forecasting & Drill-downs.

## 17. FIGMA REFERENCE LINKS
- Data Visualization UI Kit.

## 18. DEPENDENCY OUTPUTS
Produces analytics views that the AI Assistant (Phase 06) will link out to for deep dives.
