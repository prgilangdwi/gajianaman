# Phase 3 Manual Testing Checklist

**Date:** 2026-05-20  
**Tester:** QA  
**Environment:** Local dev (port 5178) → Vercel preview (before production)

---

## Pre-Testing Setup

### Environment Validation
- [ ] Frontend dev server running: `npm run dev` (port 5178)
- [ ] Supabase connection working (check with existing data load)
- [ ] Browser DevTools open (F12)
  - [ ] Network tab visible
  - [ ] Console tab visible
  - [ ] No existing errors
- [ ] Logged in with test user account
- [ ] Test user has transactions in May 2026

### Browser Setup
- [ ] Clear browser cache
- [ ] Clear localStorage
- [ ] Disable cache in Network tab (DevTools settings)
- [ ] Throttle network to "Fast 3G" to simulate real conditions (optional)

---

## Test 1: Healthy Path (API Generates Insights)

**Objective:** Verify insights API successfully generates personalized insights

**Steps:**
1. [ ] Open browser to http://localhost:5178/overview
2. [ ] Observe AI Insight Feed card
3. [ ] Wait for loading state to appear: "Menganalisis transaksi Anda..."
4. [ ] Wait for loading to complete (should show 2-3 insights)

**Expected Results:**
- [ ] Loading state visible for 1-3 seconds
- [ ] 2-3 insights appear in AI Insight Feed
- [ ] Each insight shows: emoji + title + body text
- [ ] Insight cards have colored left borders (severity colors)
- [ ] Insights appear with staggered animation
- [ ] No console errors

**Verification:**
- [ ] Check Network tab: See GET `/api/insights?month=5&year=2026` request
- [ ] Check Response: Valid JSON array with 2-3 objects
- [ ] Check Status: 200 OK
- [ ] Each object has: emoji, title, body, severity, priority

**Pass Criteria:** ✅ All checks pass, no errors

**Result:** _______ (PASS/FAIL)

---

## Test 2: Insight Content Quality

**Objective:** Verify insights are contextually relevant and actionable

**Steps:**
1. [ ] Review the 3 insights that appeared in Test 1
2. [ ] Read each insight title and body text
3. [ ] Assess relevance to your financial data (you know your transactions)

**Expected Results:**
- [ ] Insights mention actual categories you spent on (e.g., "Food spending increased")
- [ ] Insights are actionable (e.g., "Consider reducing X category")
- [ ] Insights avoid generic statements
- [ ] Text is grammatically correct Indonesian
- [ ] Insights make sense for your spending patterns

**Example Good Insight:**
```
emoji: 📈
title: Pengeluaran Transportasi
body: Biaya transportasi naik 40% dari bulan lalu.
severity: warning
priority: high
```

**Example Bad Insight:**
```
emoji: 💡
title: Insight
body: Anda memiliki transaksi
severity: info
priority: low
```

**Pass Criteria:** ✅ Insights are personalized, relevant, actionable

**Result:** _______ (PASS/FAIL)

---

## Test 3: Cache Hit (Second Load)

**Objective:** Verify caching works correctly - second load should be instant

**Steps:**
1. [ ] Note the response time from Test 1 (look at Network tab)
2. [ ] Click elsewhere on the page (e.g., Pengeluaran tab)
3. [ ] Click back to Overview tab
4. [ ] Observe AI Insight Feed loading

**Expected Results:**
- [ ] First load (Test 1): ~2-3 seconds (including loading state)
- [ ] Second load (Test 3): <100ms (no loading state, instant)
- [ ] Same 3 insights appear
- [ ] No new API call made

**Verification:**
- [ ] Check Network tab: See `/api/insights` request
- [ ] Response time: Check timing breakdown
  - [ ] First request: 2000-3000ms
  - [ ] Second request: <100ms (cache hit from Supabase)
- [ ] Network tab: Should NOT see second API call

**Pass Criteria:** ✅ Cache hit works, second load is instant

**Result:** _______ (PASS/FAIL)

---

## Test 4: Empty State (No Transactions)

**Objective:** Verify graceful handling when user has no transactions

**Steps:**
1. [ ] Use month/year filter to select a month with NO transactions
   - [ ] Try previous months (Jan, Feb, Mar 2026 if available)
   - [ ] Or a future month with no data
2. [ ] Observe AI Insight Feed

**Expected Results:**
- [ ] No loading state appears (empty data doesn't need API call)
- [ ] Message appears: "Tambah lebih banyak transaksi untuk mendapatkan rekomendasi AI"
- [ ] Message is centered and readable
- [ ] No console errors

**Verification:**
- [ ] Check Network tab: No API call made (optimize for empty state)
- [ ] Check Console: No errors or warnings

**Pass Criteria:** ✅ Empty state displays with helpful message

**Result:** _______ (PASS/FAIL)

**Note:** If API is called, that's okay - just verify proper empty array response

---

## Test 5: Error Handling (Graceful Degradation)

**Objective:** Verify app doesn't break if insights API fails

**Steps:**
1. [ ] Open DevTools → Network tab
2. [ ] Right-click on `/api/insights` request → Mock response → "Fail"
   - OR: Go back to Overview, let it load, then temporarily remove VITE_ANTHROPIC_API_KEY from .env
3. [ ] Refresh the page
4. [ ] Observe AI Insight Feed

**Expected Results:**
- [ ] Loading state appears briefly
- [ ] After loading completes, insights appear (from fallback calculation)
- [ ] Fallback shows client-side insights (buildInsightFeed output)
- [ ] No crash or error message displayed
- [ ] Page is still usable

**Alternative Path:**
- [ ] If client-side insights are empty, empty state message shows
- [ ] Still no error visible to user

**Verification:**
- [ ] Check Console: May see error logged (that's fine)
- [ ] Check: No red error message on page
- [ ] Page remains functional

**Pass Criteria:** ✅ API failure doesn't break UI, fallback works

**Result:** _______ (PASS/FAIL)

---

## Test 6: Responsive Design

**Objective:** Verify insights render correctly at all screen sizes

### Test 6a: Mobile (375px)
**Steps:**
1. [ ] Open DevTools → Device Emulation
2. [ ] Select iPhone SE (375px width)
3. [ ] Refresh page, wait for insights to load

**Expected Results:**
- [ ] AI Insight Feed card is readable
- [ ] Insight cards stack vertically
- [ ] Emoji, title, body are all visible
- [ ] Text doesn't overflow
- [ ] No horizontal scroll

**Verification:**
- [ ] Take screenshot of each insight card
- [ ] Check: Title + body text visible
- [ ] Check: No clipped or overlapped content

**Pass Criteria:** ✅ Mobile layout correct

**Result:** _______ (PASS/FAIL)

### Test 6b: Tablet (768px)
**Steps:**
1. [ ] Change device to iPad (768px)
2. [ ] Refresh page

**Expected Results:**
- [ ] Same as mobile, but with more horizontal space
- [ ] Cards may show side-by-side if space allows
- [ ] Still readable and aligned

**Pass Criteria:** ✅ Tablet layout correct

**Result:** _______ (PASS/FAIL)

### Test 6c: Desktop (1024px+)
**Steps:**
1. [ ] Remove device emulation (back to full screen)
2. [ ] Resize window to 1200px+ width
3. [ ] Refresh page

**Expected Results:**
- [ ] AI Insight Feed card uses full width
- [ ] Insights display with proper spacing
- [ ] Animations smooth

**Pass Criteria:** ✅ Desktop layout correct

**Result:** _______ (PASS/FAIL)

---

## Test 7: Loading State UX

**Objective:** Verify loading state provides good user feedback

**Steps:**
1. [ ] Throttle network to "Slow 4G" in DevTools
2. [ ] Clear cache
3. [ ] Refresh page
4. [ ] Watch AI Insight Feed during load

**Expected Results:**
- [ ] Loading message appears: "Menganalisis transaksi Anda..."
- [ ] Text has animation (subtle pulse or opacity fade)
- [ ] Message appears for 2-5 seconds (varies based on API speed)
- [ ] Message disappears when insights appear
- [ ] Smooth transition from loading to insights

**Verification:**
- [ ] Loading state is visible (not hidden)
- [ ] Animation is subtle (not distracting)
- [ ] Transition to insights is smooth

**Pass Criteria:** ✅ Loading state is clear and animated

**Result:** _______ (PASS/FAIL)

---

## Test 8: Animation & Accessibility

**Objective:** Verify animations respect user preferences

**Steps:**
1. [ ] Open System Settings → Accessibility → Display
2. [ ] Enable "Reduce motion"
3. [ ] Refresh page (with Network throttle if possible)
4. [ ] Observe AI Insight Feed

**Expected Results:**
- [ ] Insights still appear
- [ ] No animation (cards appear instantly)
- [ ] Content is still readable
- [ ] No performance issues

**Alternative (if OS doesn't support):**
1. [ ] Open DevTools → Rendering → Emulate CSS media feature prefers-reduced-motion: reduce
2. [ ] Refresh page
3. [ ] Same results as above

**Verification:**
- [ ] Check: Insights appear without animation delay
- [ ] Check: No jank or lag

**Pass Criteria:** ✅ Reduced motion respected, no animation

**Result:** _______ (PASS/FAIL)

---

## Test 9: Multi-User Isolation

**Objective:** Verify each user sees their own insights, not other users'

**Steps (if possible):**
1. [ ] Get two test user accounts (or create via Telegram bot)
2. [ ] Log in as User A
3. [ ] Go to Overview, note the insights
4. [ ] Log out
5. [ ] Log in as User B
6. [ ] Go to Overview, note the insights

**Expected Results:**
- [ ] User A's insights are different from User B's
- [ ] Insights match each user's transaction patterns
- [ ] No cross-user data leakage

**Verification:**
- [ ] Compare insight content
- [ ] User A should see insights relevant to User A's spending
- [ ] User B should see different insights

**Pass Criteria:** ✅ Insights are properly isolated per user

**Result:** _______ (PASS/FAIL)

**Note:** If only one test user available, skip this test

---

## Test 10: Console & Network Summary

**Objective:** Final verification - no errors or warnings

**Steps:**
1. [ ] Go back to Overview page (fresh state)
2. [ ] Open DevTools → Console tab
3. [ ] Scroll through console output
4. [ ] Check Network tab for all requests

**Expected Results:**
- [ ] Console: No red errors
- [ ] Console: No warnings about missing dependencies
- [ ] Network: All requests are 200 OK (green)
- [ ] Network: No requests are 4xx or 5xx (red)
- [ ] Network: `/api/insights` completes successfully

**Verification:**
- [ ] Screenshot of Console (should be clean)
- [ ] Screenshot of Network tab (all green)

**Pass Criteria:** ✅ No errors or failed requests

**Result:** _______ (PASS/FAIL)

---

## Summary & Sign-Off

### Overall Results
```
Test 1 (Healthy Path):           [  ] ✅ PASS  [  ] ❌ FAIL
Test 2 (Content Quality):         [  ] ✅ PASS  [  ] ❌ FAIL
Test 3 (Cache Hit):               [  ] ✅ PASS  [  ] ❌ FAIL
Test 4 (Empty State):             [  ] ✅ PASS  [  ] ❌ FAIL
Test 5 (Error Handling):          [  ] ✅ PASS  [  ] ❌ FAIL
Test 6 (Responsive Design):       [  ] ✅ PASS  [  ] ❌ FAIL
Test 7 (Loading State):           [  ] ✅ PASS  [  ] ❌ FAIL
Test 8 (Accessibility):           [  ] ✅ PASS  [  ] ❌ FAIL
Test 9 (Multi-User Isolation):    [  ] ✅ PASS  [  ] ❌ FAIL
Test 10 (Console/Network):        [  ] ✅ PASS  [  ] ❌ FAIL
```

### Notes & Issues Found
```
Issue #1: ________________________________
Severity: [  ] Critical  [  ] Major  [  ] Minor
Impact: ______________________________
Workaround: ___________________________

Issue #2: ________________________________
Severity: [  ] Critical  [  ] Major  [  ] Minor
Impact: ______________________________
Workaround: ___________________________
```

### Tester Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**Time Spent:** _________________  
**Status:** [  ] PASS ALL  [  ] PASS WITH ISSUES  [  ] FAIL  

**Recommendation:**
```
[ ] Ready for Vercel deployment
[ ] Ready for production with issues noted
[ ] Needs fixes before deployment
```

**Comments:**
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Deployment Readiness

Based on test results:
- [ ] All tests pass → Ready for Vercel preview deployment
- [ ] Issues found but minor → Ready for preview with notes
- [ ] Critical issues → Hold for fixes before preview

**Next Step:** 
- If all pass → Deploy to Vercel preview URL
- If issues → Notify dev team with issue details

---

**Testing Complete: ______ (Y/N)**  
**Date Completed:** ________________
