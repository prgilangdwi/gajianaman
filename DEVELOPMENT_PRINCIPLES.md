# Gajian Aman — Technical Development Principles

## Section 20: Development Philosophy & Best Practices

This document outlines the core principles, patterns, and best practices used in building Gajian Aman. These principles guide architectural decisions, code quality standards, and team collaboration.

---

## 1. Architecture Philosophy

### Separation of Concerns
- **Frontend** (React): User interface, state management, routing
- **Backend** (Python bot + Vercel functions): Business logic, database operations, AI integration
- **Database** (Supabase PostgreSQL): Single source of truth for all data
- **External Services**: Telegram API, Google OAuth, Anthropic API

**Benefit:** Clear ownership, easier testing, scalable independent components

### Database-Centric Design
All business logic flows through `db/operations.py` — no inline SQL elsewhere.
- **Single source of truth** for all queries
- **Consistent error handling** across the app
- **Easy audit trail** and compliance
- **Simplified migrations** and schema changes

```python
# ✅ GOOD: All DB queries go through operations.py
from db.operations import get_user, insert_transaction

# ❌ AVOID: Direct SQL in handler code
result = session.execute(text("SELECT ..."))
```

### Progressive Enhancement
- Core features work without JavaScript
- Advanced features enhance the experience when available
- Graceful degradation for older browsers/devices

---

## 2. Frontend Principles

### Component Design
- **UI components** in `src/components/ui/` from shadcn (Radix primitives)
- **Domain components** in `src/components/` (TransactionModal, Layout, etc.)
- **Pages** are route-specific and use hooks for data

**Structure:**
```
src/
├── components/
│   ├── ui/              ← Reusable Radix primitives (don't edit)
│   ├── Layout.tsx       ← App shell and navigation
│   ├── TransactionModal.tsx
│   └── ...
├── pages/
│   ├── Overview.tsx     ← Route components
│   ├── Laporan.tsx
│   └── ...
├── hooks/
│   ├── useAuth.ts       ← Global state & context
│   ├── useTransactions.ts
│   └── ...
└── lib/
    ├── supabase.ts      ← Types & client setup
    └── utils.ts         ← Helpers
```

### Data Flow: Hooks → Pages → Components
```typescript
// ✅ GOOD: Hook provides data
const { transactions } = useTransactions(month, year);
const filtered = transactions.filter(...);

// ❌ AVOID: Fetching in component
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/...')  // Don't do this
  }, [])
}
```

### Styling
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **CSS variables** in `src/styles/theme.css` for theming
- **Consistent spacing**: Use scale (0.5rem, 1rem, 2rem, etc.)
- **Responsive-first**: Mobile layout, then `sm:`, `md:`, `lg:` breakpoints

**Dark mode:** Automatic via `prefers-color-scheme` or user preference

### State Management
- **Hooks & Context** for global state (Auth, MonthFilter, Privacy)
- **Local `useState`** for component-level UI state
- **React Query / SWR alternatives** for caching (optional future optimization)

No Redux — hooks + context are sufficient for this scale.

---

## 3. Backend Principles (Python Bot)

### Async-First Design
- All DB operations use `async/await` with SQLAlchemy AsyncSession
- All handlers are async functions
- PgBouncer-compatible (no prepared statement caching)

```python
# ✅ GOOD: Async operation
async def handle_add_transaction(user_id: int, note: str):
    async with session() as s:
        await insert_transaction(s, user_id, ...)

# ❌ AVOID: Blocking operations in async context
import requests  # Blocks the event loop
requests.get(url)
```

### Error Handling
- Validate input at entry point (command handler)
- Return human-friendly error messages to user (Indonesian)
- Log technical errors for debugging
- Never expose internal state to users

```python
# ✅ GOOD: User-friendly error
try:
    amount = int(user_input)
except ValueError:
    await update.message.reply_text("Jumlah harus angka, contoh: 25000")

# ❌ AVOID: Technical error message
await update.message.reply_text(f"ValueError: invalid literal for int()")
```

### AI Integration (Claude Haiku)
- Use synchronous calls (wrapped with `asyncio.to_thread()` if needed)
- Always include confidence levels in output
- Validate AI output before using in business logic
- Cache results to avoid repeated API calls

```python
# categorize_transaction() returns:
{
  "category": "Food & Dining",
  "type": "expense",
  "confidence": "high",  # high | medium | low
  "reason": "Mentions 'makan' (eating)"
}
```

### Handler Structure
```
bot/handlers/
├── commands.py    ← /start, /add, /income, /summary, /goal, /budget, /history
├── messages.py    ← Inline text parsing
├── callbacks.py   ← Button callbacks (inline keyboards)
└── photos.py      ← Receipt image parsing flow
```

Each handler is a `ConversationHandler` or simple command handler with clear state transitions.

---

## 4. Database Principles

### Schema Design
- **Immutable PKs**: user_id (Telegram BIGINT), id (SERIAL/UUID)
- **Soft deletes optional**: Use `is_active` flag instead of DELETE
- **Denormalization for performance**: Pre-computed aggregates in separate tables
- **Proper indexing**: Always index foreign keys and filtered queries

### Query Performance
- Always include `WHERE user_id = ...` (multi-tenant safety)
- Use prepared statements (though disabled for PgBouncer compatibility)
- Analyze slow queries with `EXPLAIN`
- Keep indexes minimal

```sql
-- ✅ GOOD: Indexed query with WHERE user_id
SELECT * FROM transactions 
WHERE user_id = $1 AND date >= $2
ORDER BY date DESC;

-- ❌ AVOID: Full scan without WHERE user_id
SELECT * FROM transactions ORDER BY date DESC;
```

### Migrations
- One feature = one migration file
- Idempotent: Use `IF NOT EXISTS`, `DROP IF EXISTS`
- Include rollback instructions as comments
- Test locally before pushing to production

```sql
-- ✅ GOOD: Idempotent migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;

-- ❌ AVOID: Fails on re-run
ALTER TABLE users ADD COLUMN email TEXT;
```

---

## 5. Code Quality Standards

### Naming Conventions
- **Files**: `PascalCase.tsx` (React), `snake_case.py` (Python)
- **Functions**: `camelCase` (JS), `snake_case` (Python)
- **Constants**: `UPPER_SNAKE_CASE`
- **Classes**: `PascalCase`
- **DOM IDs**: `kebab-case`

### Comments & Documentation
- **Code is self-documenting**: Use clear names, not comments
- **Comment the WHY, not the WHAT**: If behavior is unexpected, explain why
- **Update comments when code changes** — stale comments are worse than none
- **JSDoc for public APIs**, docstrings for Python modules

```typescript
// ✅ GOOD: Clear variable name
const monthAbbreviations = ['Jan', 'Feb', ...];

// ❌ AVOID: Need comment to understand
const m = ['Jan', 'Feb', ...]; // month names

// ✅ GOOD: Comment explains non-obvious decision
// PgBouncer in transaction mode doesn't support prepared statements,
// so we clear the statement cache
const engine = create_async_engine(..., statement_cache_size=0)
```

### Testing
- **Unit tests** for utilities and pure functions
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows (login, add transaction)
- Test locally before pushing

```bash
pytest tests/  # Run all tests
pytest -v tests/test_operations.py  # Specific module
```

---

## 6. Security Best Practices

### Authentication
- Telegram: Validate token cryptographically
- Google OAuth: Use Supabase OAuth provider
- Sessions: Store in browser `localStorage`, validate on each request

```typescript
// Check auth before rendering protected routes
const user = useAuth();
if (!user) return <Navigate to="/login" />;
```

### Database Security
- Never expose raw SQL errors to users
- Always escape/parameterize queries
- Use Row-Level Security (RLS) in Supabase for multi-tenant isolation
- Regularly audit access logs

### API Security
- Validate all user input (amount, category, date)
- Rate-limit requests by user_id
- Don't log sensitive data (amounts, personally identifiable info)
- Use HTTPS everywhere (Vercel enforces this)

```typescript
// ✅ GOOD: Validate before use
const amount = parseInt(input);
if (isNaN(amount) || amount <= 0) {
  throw new Error('Amount must be > 0');
}

// ❌ AVOID: Trust user input
const amount = parseInt(input);  // Could be NaN, negative, huge
```

---

## 7. Deployment & DevOps

### Git Workflow
- **Main branch** is production-ready
- **Feature branches** for new work: `feat/feature-name`
- **Bug branches** for fixes: `fix/bug-name`
- **Semantic commit messages**

```bash
git commit -m "feat(bot): add /budget command for monthly budgeting"
git commit -m "fix(frontend): correct category color for Food & Dining"
```

### Environment Variables
- **Frontend** (`frontend/.env`): Public vars only (VITE_SUPABASE_URL, etc.)
- **Backend** (`.env`): Private vars (BOT_TOKEN, ANTHROPIC_API_KEY, DATABASE_URL)
- **Never commit secrets**
- Use `.env.example` for documentation

### Deployment
- **Frontend**: Vercel (auto-deploy on main push)
- **Bot**: Railway (Python + Procfile)
- **Database**: Supabase (managed PostgreSQL)
- **Monitoring**: Sentry for errors, custom logging

---

## 8. Performance Optimization

### Frontend
- **Code splitting**: Lazy-load routes with `React.lazy()`
- **Image optimization**: Use `<OptimizedImage>` component
- **Debounce expensive operations**: Search, filters
- **Memoization**: Use `useMemo` for derived data

```typescript
// ✅ GOOD: Memoize expensive calculation
const totalExpense = useMemo(
  () => transactions.reduce((s, t) => s + t.amount, 0),
  [transactions]
);
```

### Backend
- **Index all frequently-queried columns**
- **Pre-compute aggregates** instead of calculating on-the-fly
- **Cache API responses** (Claude calls are expensive)
- **Batch operations** when possible

### Database
- **Analyze slow queries** with `EXPLAIN`
- **Archive old transactions** to separate table (optional)
- **Use denormalization** for read-heavy tables
- **Monitor connection pool** (PgBouncer limits)

---

## 9. Development Workflow

### Before Committing
1. **Run tests** locally (`npm test`, `pytest`)
2. **Check linting** (`npm run lint`)
3. **Build** locally (`npm run build`)
4. **Manual testing** in dev server
5. **Review your own code** (does it make sense?)

### Before Pushing
1. **Ensure branch is up-to-date** (`git pull origin main`)
2. **Resolve conflicts** if any
3. **Rewrite commit messages** if unclear
4. **Check that CI passes** (GitHub Actions, if configured)

### PR Review (if applicable)
- **Code review**: Logic, edge cases, naming
- **Test review**: Are tests sufficient?
- **Perf review**: Any performance regressions?
- **UX review**: Does UI match design?

---

## 10. Documentation Standards

### README.md
- What is this project?
- Quick start (clone, setup, run)
- Architecture overview
- Deployment instructions

### Inline Code
- No verbose comments; clear code is self-documenting
- Comment the WHY, not the WHAT
- Docstrings for public APIs

### Commit Messages
```
<type>(<scope>): <subject>

<body (optional)>

Co-Authored-By: <name> <email>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

---

## Summary: Design Pillars

| Pillar | Principle |
|--------|-----------|
| **Simplicity** | Choose boring tech. No unnecessary abstractions. |
| **Reliability** | All DB queries go through one place. Async-first backend. |
| **Scalability** | Denormalized reads. Pre-computed aggregates. Indexing. |
| **Security** | Validate all input. Never trust user data. Log carefully. |
| **Performance** | Profile before optimizing. Use caching wisely. Lazy-load. |
| **Maintainability** | Clear naming. Semantic commits. Single responsibility. |

---

**Last Updated:** May 2026  
**Maintained By:** Gajian Aman Team  
**For Questions:** Refer to CLAUDE.md or reach out to pr.gilangdwi@gmail.com
