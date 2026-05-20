# Gajian Aman — Comprehensive Refinement Plan (Path B)

**Duration:** 4–5 weeks (60–80 engineering hours)  
**Scope:** Align all 39 pages to design spec, animations, dark mode, accessibility, optimization  
**Quality Target:** Production-ready (Lighthouse ≥85, zero critical bugs, WCAG AA compliance)

---

## Current State Assessment

### ✅ What's Already Built (High Quality)
- **Auth System:** Login, AuthCallback, LinkTelegram pages + useAuth hook
- **Core Pages (7):** Overview, Pengeluaran, Pemasukan, Budget, Goals, Riwayat, Laporan
- **Analytics Pages (5):** Tren, SpendingPatterns, Forecasting, MonthlyReport, BudgetRecommendations
- **Management Pages (7):** Recurring, SmartAlerts, Kalender, Wallet, Langganan, SplitBill, Profile
- **Category System:** CategoryBrowser, CategoryDetail, CategoryManager
- **AI Assistant:** Asisten page
- **Public Pages (10):** Landing, Onboarding, CaraKerja, Fitur, Keamanan, Testimonial, FAQ, Blog, TentangKami, SyaratKetentuan, KebijakanPrivasi

### ⚠️ What Needs Refinement
1. **Design System Alignment** — Ensure all pages use consistent tokens (colors, spacing, typography)
2. **Component Standardization** — Compound components (TransactionRow, BudgetCard, GoalCard) used consistently
3. **Animations** — Motion library properly integrated (page transitions, modals, loading states)
4. **Dark Mode** — Theme switching with localStorage persistence
5. **Responsive Design** — Mobile-first (375px–1920px) with proper safe areas
6. **Accessibility** — ARIA labels, keyboard navigation, color contrast (WCAG AA)
7. **Data Binding** — Real-time subscriptions, loading states, error handling
8. **Performance** — Bundle optimization, code-splitting, lazy loading

---

## Week-by-Week Refinement Plan

### Week 1 (Already Completed) ✅
- [x] Fixed TypeScript errors (27 issues)
- [x] Verified build pipeline
- [x] Confirmed dev server running
- [x] Identified scope (39 pages)

---

## Week 2: Core Pages Refinement & Design System Alignment

### Goals
✅ Audit all core financial pages (7) against design spec  
✅ Standardize component usage  
✅ Implement design tokens consistently  
✅ Fix responsive design issues

### Daily Breakdown

**Day 1: Design Token Audit (6 hours)**
- [ ] Audit all pages for hardcoded colors/spacing (should use CSS variables)
- [ ] Create `lib/design-tokens.ts` exporting theme values
- [ ] Update tailwind.config.ts to match FINTRACK_FRONTEND_IMPLEMENTATION_SPECS.md
- [ ] Run global find/replace on hardcoded values
- [ ] Verify: All colors come from `theme.css` variables or Tailwind tokens
- **Deliverable:** Design tokens audit report

**Day 2: Compound Components Implementation (8 hours)**
- [ ] Create/refine `components/CompoundComponents.tsx`:
  - [ ] `<TransactionRow variant='default'|'compact'|'expanded'>`
  - [ ] `<BudgetCard variant='compact'|'expanded'>`
  - [ ] `<GoalCard variant='default'|'detailed'>`
  - [ ] `<CategoryChart variant='pie'|'donut'|'bar'>`
- [ ] Update all pages to use compound components instead of inline layouts
- [ ] Test props and variants
- **Deliverable:** Compound components library with Storybook stories (optional)

**Day 3: Core Pages Refinement — Overview (8 hours)**
- [ ] `pages/Overview.tsx`:
  - [ ] Summary cards (Income, Expense, Balance) with proper spacing
  - [ ] Daily spending bar chart with responsive sizing
  - [ ] Category pie chart (donut style)
  - [ ] Recent transactions list using `<TransactionRow>`
  - [ ] FAB + TransactionModal integration
  - [ ] Loading states with skeleton screens
  - [ ] Verify responsive on 375px, 768px, 1024px
- [ ] Test data flows: useTransactions, useMonthFilter
- [ ] Verify real-time updates
- **Deliverable:** Overview page fully refined and tested

**Day 4: Core Pages Refinement — Pengeluaran & Pemasukan (8 hours)**
- [ ] `pages/Pengeluaran.tsx`:
  - [ ] Category filter buttons with active state
  - [ ] Category cards showing totals, counts, percentages
  - [ ] Transaction list filtered by category
  - [ ] Sort options (amount, date)
  - [ ] Pagination or infinite scroll if needed
- [ ] `pages/Pemasukan.tsx`:
  - [ ] Same structure as Pengeluaran
  - [ ] Income-specific icons/colors
- [ ] Verify responsive, loading states, empty states
- **Deliverable:** Both spending pages refined

**Day 5: Core Pages Refinement — Budget & Goals (8 hours)**
- [ ] `pages/Budget.tsx`:
  - [ ] Add Budget modal (category + amount form)
  - [ ] Budget cards using `<BudgetCard>` compound
  - [ ] Progress bars with warning colors
  - [ ] Over-budget indicators
  - [ ] Edit/delete budget actions
- [ ] `pages/Goals.tsx`:
  - [ ] Add Goal modal (name, target, deadline form)
  - [ ] Goal cards using `<GoalCard>` compound
  - [ ] Progress tracking with deadline countdown
  - [ ] Savings contribution tracking
- [ ] Both pages: loading states, error handling, empty states
- **Deliverable:** Budget & Goals pages fully functional

**Day 6: Responsive Design Audit (6 hours)**
- [ ] Test all 7 core pages on:
  - [ ] 375px mobile (iPhone SE)
  - [ ] 768px tablet (iPad)
  - [ ] 1024px desktop
  - [ ] 1920px large desktop
- [ ] Fix:
  - [ ] Horizontal scrolling issues
  - [ ] Touch target sizes (<44px issues)
  - [ ] Text overflow/truncation
  - [ ] Safe area padding (notch, Dynamic Island)
  - [ ] Bottom nav visibility/accessibility
- [ ] Test on real device (iPhone/Android) if possible
- **Deliverable:** Responsive design verified, all breakpoints working

**Day 7: Testing & Integration (8 hours)**
- [ ] End-to-end user flows:
  - [ ] Login → home → add transaction → see in Pengeluaran → Budget shows progress
  - [ ] Change month → all data updates
  - [ ] Real-time: two tabs, add in one, see in other
- [ ] Error scenarios:
  - [ ] Network failure → show error message
  - [ ] Invalid form input → show validation errors
  - [ ] Empty states → proper messaging
- [ ] Performance:
  - [ ] Pages load <2s on 4G
  - [ ] No janky animations
  - [ ] Smooth scrolling
- **Deliverable:** Core 7 pages fully tested and refined

### Week 2 Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Refactoring breaks existing functionality | Keep git history, test after each change |
| Responsive issues hard to fix without device | Use DevTools device emulation + real device testing |
| Real-time subscriptions not syncing | Verify Supabase RLS policies and channel setup |

### Week 2 Deliverables
- ✅ All 7 core pages match design spec
- ✅ Compound components standardized
- ✅ Design tokens consistently applied
- ✅ Responsive design verified (375px–1920px)
- ✅ Real-time data sync working
- ✅ Loading/error/empty states implemented

---

## Week 3: Analytics & Management Pages + Animations

### Goals
✅ Refine analytics pages (5) — charts, data display  
✅ Implement full Motion animations across app  
✅ Implement dark mode with theme switching  
✅ Add loading skeletons and transitions

### Daily Breakdown

**Day 1: Analytics Pages — Tren & SpendingPatterns (8 hours)**
- [ ] `pages/Tren.tsx`:
  - [ ] 3-month line chart (income, expense, net)
  - [ ] Summary stats (average, highest, trend)
  - [ ] Top categories table
  - [ ] Month/year range selector
  - [ ] Verify recharts responsive
- [ ] `pages/SpendingPatterns.tsx`:
  - [ ] Category breakdown pie chart
  - [ ] Spending by day-of-week bar chart
  - [ ] Spending by hour heatmap (if data available)
  - [ ] Top transaction categories list
- [ ] Test: Charts render with real data, responsive, tooltips work
- **Deliverable:** Analytics pages with working charts

**Day 2: Analytics Pages — Forecasting & BudgetRecommendations (8 hours)**
- [ ] `pages/Forecasting.tsx`:
  - [ ] 6-month projection line chart
  - [ ] Scenario builder (if, then predictions)
  - [ ] Risk assessment display
  - [ ] Recommendations list
- [ ] `pages/BudgetRecommendations.tsx`:
  - [ ] AI-generated budget recommendations
  - [ ] Priority indicators (critical, high, medium)
  - [ ] Apply/dismiss actions
  - [ ] Savings estimates
- [ ] Test: All calculations correct, UI responsive
- **Deliverable:** Advanced analytics pages complete

**Day 3: Management Pages — Recurring, SmartAlerts, Kalender (8 hours)**
- [ ] `pages/Recurring.tsx`:
  - [ ] Recurring bills list
  - [ ] Add/edit recurring form
  - [ ] Next due date display
  - [ ] Reminders setup
  - [ ] Archive completed
- [ ] `pages/SmartAlerts.tsx`:
  - [ ] Alert rules list
  - [ ] Create alert modal
  - [ ] Priority badges
  - [ ] Dismiss/acknowledge actions
- [ ] `pages/Kalender.tsx`:
  - [ ] Calendar view of transactions
  - [ ] Click to see day details
  - [ ] Recurring event indicators
  - [ ] Month navigation
- [ ] Test: All CRUD operations, interactions
- **Deliverable:** Management pages functional

**Day 4: Motion Animations Implementation (10 hours)**
- [ ] Audit all pages for animation opportunities:
  - [ ] Page transitions (fade + slide)
  - [ ] Modal enter/exit (slide up from bottom)
  - [ ] List item animations (stagger)
  - [ ] Loading states (skeleton pulse)
  - [ ] Hover effects (subtle scale, glow)
- [ ] Implement using Motion library:
  - [ ] Update `lib/transitions.ts` with all animation variants
  - [ ] Apply `<AnimatePresence>` to routes
  - [ ] Apply `<motion.div>` to cards, modals, buttons
  - [ ] Use `transition={{ staggerChildren: 0.05 }}` for lists
- [ ] Test:
  - [ ] No jank or stuttering
  - [ ] Prefers-reduced-motion respected
  - [ ] Smooth 60fps animations
- [ ] Performance: Ensure animations don't slow page load
- **Deliverable:** Full Motion animation suite implemented

**Day 5: Dark Mode Implementation (10 hours)**
- [ ] Create theme switching system:
  - [ ] `lib/theme.ts` with useTheme hook
  - [ ] LocalStorage persistence (`gajian_aman_theme`)
  - [ ] System preference detection (prefers-color-scheme)
  - [ ] Theme toggle component
- [ ] Update CSS:
  - [ ] Add `@media (prefers-color-scheme: dark)` to all components
  - [ ] Update theme.css with dark mode variable values
  - [ ] Test contrast ratios ≥4.5:1 (WCAG AA)
- [ ] Update pages:
  - [ ] Add theme toggle in header/sidebar
  - [ ] Ensure all text/background colors work in dark
  - [ ] Test charts in dark mode
- [ ] Test:
  - [ ] Toggle switching works
  - [ ] Persistence works (reload → theme preserved)
  - [ ] All pages readable in both modes
- **Deliverable:** Full dark mode support

**Day 6: Loading Skeletons & Transitions (8 hours)**
- [ ] Create skeleton components:
  - [ ] `<TransactionRowSkeleton>`
  - [ ] `<CardSkeleton>`
  - [ ] `<ChartSkeleton>`
  - [ ] `<TableRowSkeleton>`
- [ ] Implement in all data-fetching pages:
  - [ ] Show skeleton while `isLoading`
  - [ ] Fade to content when ready
  - [ ] Use Motion for smooth transition
- [ ] Test:
  - [ ] Skeletons appear/disappear smoothly
  - [ ] No layout shift (use placeholder dimensions)
  - [ ] Loading feels responsive
- **Deliverable:** Skeleton loading states across all pages

**Day 7: Testing & Polish (8 hours)**
- [ ] Animation QA:
  - [ ] No janky transitions
  - [ ] Animations respect motion preferences
  - [ ] Performance: FPS stable at 60
- [ ] Dark mode QA:
  - [ ] All text readable in both themes
  - [ ] Charts visible in dark mode
  - [ ] Images don't look wrong
  - [ ] Contrast ≥4.5:1 verified with tool
- [ ] Loading state QA:
  - [ ] Skeletons match content dimensions
  - [ ] Transitions smooth
  - [ ] Error states clear
- [ ] Integration testing:
  - [ ] Full user flow in light + dark mode
  - [ ] All animations working
- **Deliverable:** Animations and dark mode fully polished

### Week 3 Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Animations cause performance issues | Profile with DevTools, optimize with `will-change` |
| Dark mode colors hard to get right | Use color contrast checker, test on real devices |
| Charts don't render properly in dark | Add dark-specific chart colors, test thoroughly |

### Week 3 Deliverables
- ✅ All analytics pages working (5)
- ✅ All management pages working (7)
- ✅ Full Motion animation suite implemented
- ✅ Dark mode fully functional
- ✅ Loading skeletons throughout
- ✅ Smooth transitions everywhere
- ✅ Performance verified (60fps)

---

## Week 4: Advanced Features & Refinement

### Goals
✅ AI Chat integration (Asisten page)  
✅ Advanced features (SplitBill, Image parsing)  
✅ Public pages polish (Landing, Marketing)  
✅ Accessibility (WCAG AA compliance)

### Daily Breakdown

**Day 1: Asisten (AI Chat) Page (10 hours)**
- [ ] `pages/Asisten.tsx`:
  - [ ] Message list (scrollable, latest at bottom)
  - [ ] Message bubbles (user right, assistant left)
  - [ ] Text input + send button
  - [ ] Image upload button
  - [ ] Typing indicator
  - [ ] Suggested action buttons
  - [ ] Clear conversation button
- [ ] Integration:
  - [ ] Call Claude API for conversational responses
  - [ ] Call parse-image.js for receipt parsing
  - [ ] Handle streaming responses (if available)
  - [ ] Error handling + retry logic
- [ ] Animations:
  - [ ] New messages fade in
  - [ ] Typing indicator bounces
  - [ ] Image preview shows smoothly
- [ ] Test:
  - [ ] Send message → response appears
  - [ ] Upload image → parsed result shows
  - [ ] Conversation persists in session
- **Deliverable:** AI Chat fully functional

**Day 2: Image Parsing & Receipt OCR (8 hours)**
- [ ] `frontend/api/parse-image.js`:
  - [ ] Endpoint receives base64 image
  - [ ] Calls Claude Haiku with vision
  - [ ] Returns parsed transaction data
  - [ ] Error handling
- [ ] `hooks/useImageParser.ts`:
  - [ ] Encodes image to base64
  - [ ] Calls parse-image.js
  - [ ] Handles response
  - [ ] Parses Claude JSON response
- [ ] Integration:
  - [ ] Asisten page uses hook
  - [ ] TransactionModal can accept parsed data
  - [ ] Show parsing confidence
  - [ ] Allow user to correct parsed fields
- [ ] Test:
  - [ ] Valid receipt → parsed correctly
  - [ ] Invalid image → error message
  - [ ] Integration with form pre-fill
- **Deliverable:** Image parsing fully integrated

**Day 3: SplitBill Feature (10 hours)**
- [ ] `pages/SplitBill.tsx`:
  - [ ] Create split session form
  - [ ] Add participants
  - [ ] Add items with prices
  - [ ] Automatic calculation of splits
  - [ ] Generate share link
  - [ ] Show payment summary
- [ ] `pages/SplitBillShare.tsx`:
  - [ ] View shared split session
  - [ ] Accept/confirm payment
  - [ ] Mark as paid
  - [ ] Message participants
- [ ] Data:
  - [ ] Save to Supabase `split_bills` table
  - [ ] Real-time updates when participants pay
  - [ ] Share token-based access (no auth required)
- [ ] Test:
  - [ ] Create → share → participant accepts → shows paid
  - [ ] Calculations accurate
  - [ ] Share link works
- **Deliverable:** Split Bill feature complete

**Day 4: Wallet & Profile Management (8 hours)**
- [ ] `pages/Wallet.tsx`:
  - [ ] List of wallets (bank, e-wallet, cash)
  - [ ] Add wallet form
  - [ ] Edit/delete wallet
  - [ ] Balance tracking
  - [ ] Wallet icon/color selection
  - [ ] Set primary wallet
- [ ] `pages/Profile.tsx`:
  - [ ] User info display (name, email, avatar)
  - [ ] Edit profile form
  - [ ] Currency/timezone selection
  - [ ] Connected accounts (Telegram, Google)
  - [ ] Account settings
  - [ ] Logout button
- [ ] `pages/Langganan.tsx` (Subscription):
  - [ ] Current plan display
  - [ ] Plan comparison table
  - [ ] Upgrade/downgrade buttons
  - [ ] Billing history
  - [ ] Invoice download
- [ ] Test:
  - [ ] All CRUD operations
  - [ ] Form validation
  - [ ] Changes persist
- **Deliverable:** User management pages complete

**Day 5: Accessibility (WCAG AA Compliance) (10 hours)**
- [ ] Audit all pages for:
  - [ ] Missing ARIA labels
  - [ ] Keyboard navigation gaps
  - [ ] Color contrast issues
  - [ ] Alt text on images
  - [ ] Form label associations
  - [ ] Focus management in modals
- [ ] Implement fixes:
  - [ ] Add `aria-label`, `aria-describedby` where needed
  - [ ] Ensure keyboard focus visible (`:focus-visible`)
  - [ ] Test with screen reader (NVDA/JAWS on Windows)
  - [ ] Add skip links (skip to main content)
  - [ ] Ensure modals trap focus
  - [ ] All icons have label context
- [ ] Color contrast:
  - [ ] Use WebAIM contrast checker
  - [ ] Ensure text/background ≥4.5:1 (AA) for normal text
  - [ ] ≥3:1 for large text (18pt+)
  - [ ] Test in light + dark mode
- [ ] Testing:
  - [ ] Keyboard-only navigation (no mouse)
  - [ ] Tab order logical
  - [ ] Screen reader announces content correctly
  - [ ] Use axe DevTools extension
- **Deliverable:** WCAG AA compliance achieved

**Day 6: Public Pages & Marketing (8 hours)**
- [ ] `pages/Landing.tsx`:
  - [ ] Hero section with CTA
  - [ ] Feature highlights with icons
  - [ ] Testimonials carousel
  - [ ] Pricing table
  - [ ] FAQ accordion
  - [ ] Footer with links
- [ ] Other public pages (Fitur, CaraKerja, Keamanan, etc.):
  - [ ] Consistent layout/styling
  - [ ] Mobile responsive
  - [ ] Images optimized
  - [ ] SEO metadata (title, meta description)
- [ ] Test:
  - [ ] All pages accessible to unauthenticated users
  - [ ] Links work
  - [ ] Mobile responsive
- **Deliverable:** Public pages polished

**Day 7: Testing & QA (8 hours)**
- [ ] Accessibility QA:
  - [ ] Run axe DevTools on all pages
  - [ ] Test keyboard navigation
  - [ ] Screen reader testing (if possible)
  - [ ] Fix all issues found
- [ ] Feature QA:
  - [ ] AI Chat works end-to-end
  - [ ] Image parsing accurate
  - [ ] SplitBill calculations correct
  - [ ] Profile changes persist
- [ ] Browser compatibility:
  - [ ] Chrome/Edge (latest)
  - [ ] Safari (iOS 15+)
  - [ ] Firefox (latest)
- [ ] **Deliverable:** All features working, accessibility verified

### Week 4 Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| AI API calls fail intermittently | Implement retry logic, fallback to manual entry |
| Image parsing unreliable | Test with diverse receipts, set confidence threshold |
| Accessibility hard to verify | Use tools (axe, WebAIM), test with real screen reader |

### Week 4 Deliverables
- ✅ AI Chat (Asisten) fully functional
- ✅ Image parsing integrated
- ✅ SplitBill feature complete
- ✅ Wallet & Profile management complete
- ✅ WCAG AA accessibility compliance
- ✅ Public pages polished
- ✅ All features tested cross-browser

---

## Week 5: Performance, Optimization & Final Polish

### Goals
✅ Bundle size optimization  
✅ Performance tuning (Lighthouse ≥85)  
✅ SEO optimization  
✅ Final QA & bug fixes  
✅ Deployment readiness

### Daily Breakdown

**Day 1: Bundle Analysis & Code Splitting (8 hours)**
- [ ] Audit bundle:
  - [ ] Run `npm run build` and analyze `dist/`
  - [ ] Use source-map-explorer to find large chunks
  - [ ] Identify unused dependencies
- [ ] Optimize:
  - [ ] Dynamic import for route pages (code-splitting)
  - [ ] Lazy-load charts library (only load on analytics pages)
  - [ ] Lazy-load PDF export library
  - [ ] Tree-shake unused Radix UI components
  - [ ] Remove unused Motion animations
- [ ] Configuration:
  - [ ] Update `vite.config.ts` for optimal chunking
  - [ ] Set `build.chunkSizeWarningLimit`
  - [ ] Enable minification
- [ ] Measure:
  - [ ] Before: X kB gzipped
  - [ ] After: < 400kB main chunk, < 100kB per route
  - [ ] Initial load < 2s on 4G
- **Deliverable:** Optimized bundle size

**Day 2: Performance Tuning (8 hours)**
- [ ] Run Lighthouse audit:
  - [ ] Performance, Accessibility, Best Practices, SEO
  - [ ] Target ≥85 on all metrics
- [ ] Optimize:
  - [ ] Image optimization (next-gen formats, responsive sizes)
  - [ ] Remove render-blocking CSS (inline critical)
  - [ ] Defer non-critical JS
  - [ ] Cache strategies (HTTP headers)
  - [ ] Minify HTML/CSS/JS
  - [ ] Remove unused CSS (PurgeCSS via Tailwind)
- [ ] Metrics to hit:
  - [ ] Largest Contentful Paint (LCP) < 2.5s
  - [ ] First Input Delay (FID) < 100ms
  - [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Test:
  - [ ] Run Lighthouse on all major pages
  - [ ] Test on slow 4G network simulation
  - [ ] Profile with DevTools Performance tab
- **Deliverable:** Lighthouse score ≥85

**Day 3: SEO & Metadata (6 hours)**
- [ ] Add metadata:
  - [ ] Update `index.html` with meta tags (title, description, og:image)
  - [ ] Per-page metadata using react-helmet (if not using framework)
  - [ ] Robots.txt for crawling
  - [ ] Sitemap.xml for discovery
- [ ] Content optimization:
  - [ ] Heading hierarchy correct (h1, h2, h3)
  - [ ] Alt text on all meaningful images
  - [ ] Internal linking strategy
  - [ ] Structured data (schema.org for organization, breadcrumbs)
- [ ] Test:
  - [ ] Lighthouse SEO score
  - [ ] Google Search Console (if deployed)
  - [ ] Meta tags visible in view-source
- **Deliverable:** SEO optimized

**Day 4: Bug Fixes & Edge Cases (8 hours)**
- [ ] Known issues:
  - [ ] Test all reported bugs
  - [ ] Fix critical issues blocking deployment
  - [ ] Document remaining known issues
- [ ] Edge cases:
  - [ ] Very large data sets (1000+ transactions)
  - [ ] Network slowness/offline
  - [ ] Concurrent user actions
  - [ ] Session expiry
  - [ ] Invalid/corrupted data from Supabase
- [ ] Error handling:
  - [ ] User-friendly error messages
  - [ ] Retry logic for failed requests
  - [ ] Fallback UI when features unavailable
- [ ] Testing:
  - [ ] Create test scenarios for each edge case
  - [ ] Verify error messages helpful
  - [ ] Verify recovery is smooth
- **Deliverable:** Critical bugs fixed, edge cases handled

**Day 5: Responsive Design Final Check (6 hours)**
- [ ] Test on all screen sizes:
  - [ ] 320px (small phone)
  - [ ] 375px (iPhone SE baseline)
  - [ ] 480px (large phone)
  - [ ] 600px (tablet)
  - [ ] 768px (iPad)
  - [ ] 1024px (desktop)
  - [ ] 1920px (large monitor)
- [ ] Test real devices:
  - [ ] iPhone (various models)
  - [ ] Android phone
  - [ ] iPad
  - [ ] Desktop browser (Chrome, Safari, Firefox)
- [ ] Fix:
  - [ ] No horizontal scrolling on any breakpoint
  - [ ] Touch targets ≥44px everywhere
  - [ ] Safe area padding correct
  - [ ] Bottom nav accessible on mobile
  - [ ] Text readable without zoom
- **Deliverable:** Responsive design verified on real devices

**Day 6: Documentation & Runbooks (8 hours)**
- [ ] Create documentation:
  - [ ] README.md (setup, development, deployment)
  - [ ] ARCHITECTURE.md (project structure, data flow)
  - [ ] CONTRIBUTING.md (code standards, PR process)
  - [ ] TROUBLESHOOTING.md (common issues, solutions)
  - [ ] DEPLOYMENT.md (Vercel setup, env vars, monitoring)
- [ ] Code documentation:
  - [ ] JSDoc comments on complex functions
  - [ ] Type documentation for custom types
  - [ ] Storybook stories for components (optional)
- [ ] Deployment runbook:
  - [ ] Pre-deployment checklist
  - [ ] Rollback procedures
  - [ ] Monitoring setup (error tracking, analytics)
  - [ ] Incident response plan
- **Deliverable:** Complete documentation

**Day 7: Final QA & Go/No-Go Decision (8 hours)**
- [ ] Final QA checklist:
  - [ ] All pages load without errors
  - [ ] All user flows work (login → add → view → analyze → budget)
  - [ ] All CRUD operations work
  - [ ] Real-time updates working
  - [ ] Auth works (Telegram, Google, linking)
  - [ ] Offline handling graceful
  - [ ] Error messages clear
  - [ ] Performance acceptable (Lighthouse ≥85)
  - [ ] Responsive on all devices
  - [ ] Accessibility verified (WCAG AA)
  - [ ] No console errors/warnings
- [ ] Sign-off:
  - [ ] Checklist 100% complete
  - [ ] Zero critical bugs
  - [ ] Zero P0 accessibility issues
  - [ ] All stakeholder requirements met
  - [ ] **GO/NO-GO decision for deployment**
- [ ] Prepare for deployment:
  - [ ] Build artifact ready
  - [ ] Environment variables documented
  - [ ] Vercel project configured
  - [ ] Domain/DNS ready
  - [ ] SSL certificate ready
  - [ ] Analytics setup ready
- **Deliverable:** Production-ready build + deployment readiness

### Week 5 Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Bundle size still too large | More aggressive code-splitting, remove unused libs |
| Performance issues hard to find | Use Chrome DevTools, lighthouse CI |
| Last-minute bugs found | Have buffer days, don't deploy until checklist 100% |

### Week 5 Deliverables
- ✅ Bundle size optimized (<400kB main)
- ✅ Lighthouse score ≥85
- ✅ SEO optimized
- ✅ All critical bugs fixed
- ✅ Responsive design verified (real devices)
- ✅ Complete documentation
- ✅ Production-ready build
- ✅ GO/NO-GO decision made

---

## Deployment & Launch (Week 6)

### Day 1: Vercel Deployment
- [ ] Create Vercel project (if not exists)
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `dist`
  - [ ] Install command: `npm install`
- [ ] Set environment variables:
  ```
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_ANTHROPIC_API_KEY
  ```
- [ ] Deploy preview build
- [ ] Test preview URL
- [ ] Deploy to production
- [ ] Verify production URL working
- **Deliverable:** Live on Vercel

### Day 2: Post-Deployment Monitoring
- [ ] Set up monitoring:
  - [ ] Sentry for error tracking
  - [ ] Vercel Analytics for performance
  - [ ] Google Analytics for user behavior
- [ ] Monitor for:
  - [ ] Error rate
  - [ ] Performance metrics
  - [ ] User issues
- [ ] Be on standby for:
  - [ ] Hotfix deployment
  - [ ] Rollback if critical issues
- **Deliverable:** Monitoring active, team on standby

### Day 3+: Feedback & Iteration
- [ ] Collect user feedback
- [ ] Monitor error logs
- [ ] Fix high-impact bugs
- [ ] Plan Phase 2 improvements
- **Deliverable:** Live product, feedback collected

---

## Quality Gates & Sign-Off

### Code Quality
- [ ] `npm run typecheck` — Zero errors
- [ ] No console warnings/errors in prod
- [ ] All imports used
- [ ] No hardcoded values (use tokens/env vars)

### Performance
- [ ] Lighthouse ≥85 (all metrics)
- [ ] Initial load <2s on 4G
- [ ] FCP <1.5s
- [ ] LCP <2.5s
- [ ] CLS <0.1

### Accessibility
- [ ] WCAG AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast ≥4.5:1
- [ ] axe DevTools: 0 violations

### Functionality
- [ ] All critical user flows work
- [ ] All CRUD operations work
- [ ] Real-time updates working
- [ ] Error scenarios handled
- [ ] Edge cases tested

### Responsive Design
- [ ] Works on 320px–1920px
- [ ] Touch targets ≥44px
- [ ] No horizontal scroll
- [ ] Safe area padding correct
- [ ] Real device testing passed

### Documentation
- [ ] README complete
- [ ] Deployment docs complete
- [ ] Code comments where needed
- [ ] Troubleshooting guide created

---

## Success Metrics

**MVP Success Criteria:**
1. ✅ Zero critical bugs at launch
2. ✅ Lighthouse score ≥85
3. ✅ WCAG AA compliance
4. ✅ All 39 pages functional
5. ✅ Real-time data sync working
6. ✅ All user flows tested
7. ✅ Mobile responsive (375px+)
8. ✅ <2s initial load time
9. ✅ <100ms First Input Delay
10. ✅ Live on Vercel

---

## Timeline Summary

| Week | Focus | Hours | Cumulative |
|------|-------|-------|-----------|
| 1 | Baseline fixes | 10 | 10 ✅ |
| 2 | Core pages refinement | 50 | 60 |
| 3 | Analytics + animations + dark mode | 60 | 120 |
| 4 | Advanced features + accessibility | 60 | 180 |
| 5 | Performance + optimization + final QA | 60 | 240 |
| 6 | Deployment + monitoring | 20 | 260 |
| **Total** | | **260 hours** | |

**For 1 full-time engineer:** 5–6 weeks (8h/day)  
**For 2 engineers (parallel work):** 2.5–3 weeks  
**For 1 engineer part-time (4h/day):** 13 weeks

---

## Next Steps

1. **Approve Plan B approach** — You've confirmed comprehensive refinement
2. **Start Week 2 immediately** — Core pages refinement (Monday)
3. **Daily standups** — Brief sync on blockers + progress
4. **Weekly demos** — Show refined pages to stakeholders
5. **Real device testing** — iPhone/Android as pages complete
6. **Deployment gate** — Final checklist before Week 6 launch

---

## Resources

- **FINTRACK_FRONTEND_IMPLEMENTATION_SPECS.md** — Technical reference for all specs
- **FINTRACK_BUILD_CHECKLIST.md** — QA checklist per phase
- **CLAUDE.md** — Project conventions
- **Package.json** — All scripts (dev, build, typecheck, test)
- **Vercel Docs** — https://vercel.com/docs

