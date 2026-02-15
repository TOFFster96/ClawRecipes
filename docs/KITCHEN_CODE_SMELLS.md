# ClawRecipes Kitchen — Code Smell Review

A code smell review of the Kitchen codebase. These are refactoring candidates, not defects. Fix based on priority and impact.

---

## 1. Server: God Object / Long Method

**File:** [kitchen/server/index.js](kitchen/server/index.js) (~690 lines)

**Smell:** `createApp()` contains 25+ route handlers in one function. All routing, validation, error handling, and middleware setup live in a single place.

**Impact:** Hard to navigate, test individual routes, or reuse route logic.

**Recommendation:** Extract route handlers into modules (e.g. `routes/teams.js`, `routes/recipes.js`, `routes/bindings.js`) and mount them. Keep guards and shared middleware in index.

---

## 2. Duplicated Error-Handling Pattern

**Files:** [kitchen/server/index.js](kitchen/server/index.js)

**Smell:** Every route repeats:
```js
try {
  // ...
  res.json(...);
} catch (err) {
  console.error("[kitchen] ...", err);
  res.status(X).json({ error: formatError(err) });
}
```

**Impact:** Changes to logging or error formatting require edits in many places. Status code logic (400 vs 502) is duplicated.

**Recommendation:** Wrap route handlers in a `withErrorHandler(fn, defaultStatus)` that catches, logs, and responds. Or use Express error-handling middleware that receives errors from `next(err)`.

---

## 3. Duplicated Guard Pattern

**File:** [kitchen/server/index.js](kitchen/server/index.js)

**Smell:** Many ticket routes repeat the same sequence:
```js
if (guardInvalidTeamId(teamId, res)) return;
if (guardInvalidTicketId(ticketId, res)) return;
if (guardDemoTeam(teamId, res)) return;
```

**Impact:** Adding a new guard (e.g. for rate limiting) means updating many routes.

**Recommendation:** Create `requireValidTicketRoute(req, res, next)` middleware that runs all three guards. Use it for ticket-related routes.

---

## 4. Magic Numbers

**Files:** [kitchen/server/index.js](kitchen/server/index.js), [kitchen/server/activity.js](kitchen/server/activity.js)

**Smell:** Literals without named constants:
- `65536` (dispatch max length) — only documented in error message
- `200` (activity max limit) — also in activity.js as `MAX_EVENTS`, but index.js uses `200` directly
- `3456` (port)
- `60 * 1000`, `100` (rate limit)

**Impact:** Changes require hunting for literals. Intent is unclear.

**Recommendation:** Add `const DISPATCH_MAX_LENGTH = 65536`, `ACTIVITY_MAX_LIMIT = 200`, and use them. Some already exist (e.g. `MAX_MATCH_VALUE_LENGTH`); align the rest.

---

## 5. Regex Duplication

**Files:** [kitchen/server/index.js](kitchen/server/index.js), [kitchen/server/openclaw.js](kitchen/server/openclaw.js)

**Smell:** Same regex defined in multiple places:
- `TEAM_ID_RE` in index.js (`/^[a-zA-Z0-9_-]+$/`)
- `ID_RE` in openclaw.js (same pattern)
- Inline `/^[a-zA-Z0-9_-]+$/` in scaffold-agent for agentId
- `/^[\w\s.-]+$/` for agent name (only place)

**Impact:** Changing validation rules requires updates in several files.

**Recommendation:** Export shared regexes from a `validation.js` (or constants module) and import in both index and openclaw.

---

## 6. Demo-Team Branching Scattered

**Files:** index.js (7 places), openclaw.js (7 places), BoardPage.tsx, TicketDetail.tsx, TeamPicker.tsx

**Smell:** `teamId === "demo-team"` appears in many locations. Logic for “is this demo?” is not centralized.

**Impact:** Adding demo behavior or changing the demo ID touches many files.

**Recommendation:** Use `const DEMO_TEAM_ID = "demo-team"` (already in api.ts) everywhere. Consider `isDemoTeam(teamId)` helper. Optionally centralize demo routing (e.g. middleware that delegates to demo handlers when teamId is demo).

---

## 7. OpenClaw: Duplicated CLI Error Handling

**File:** [kitchen/server/openclaw.js](kitchen/server/openclaw.js)

**Smell:** Every `spawnSync` / `runOpenClaw` call repeats:
```js
if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(result.stderr || result.stdout || `openclaw exited with ${result.status}`);
}
```

**Impact:** Changing error handling (e.g. logging, message format) requires many edits.

**Recommendation:** `runOpenClaw` already centralizes this. Ensure all CLI calls go through it. `checkOpenClaw` and `getWorkspaceRoot` use `execSync` with different handling — consider migrating to a single helper.

---

## 8. OpenClaw: getWorkspaceRoot vs checkOpenClaw

**File:** [kitchen/server/openclaw.js](kitchen/server/openclaw.js)

**Smell:** `getWorkspaceRoot()` and `checkOpenClaw()` both run `execSync("openclaw config get agents.defaults.workspace", ...)`. Same command, different return types.

**Impact:** Duplicated logic and maintenance.

**Recommendation:** Have `checkOpenClaw` call `getWorkspaceRoot` (or a shared internal helper) and return `!!getWorkspaceRoot()?.trim()`.

---

## 9. api.ts: Duplicated Fetch Pattern

**File:** [kitchen/app/src/api.ts](kitchen/app/src/api.ts)

**Smell:** Every function follows:
```ts
const res = await fetch(url, options);
if (!res.ok) throw new Error(await parseApiError(res));
return res.json();
```

**Impact:** Adding retries, auth headers, or logging would require many edits.

**Recommendation:** Extract `async function apiFetch(url, init?): Promise<Response>` that throws on !res.ok with parsed error. Or a generic `fetchJson<T>(url, init?)` that returns `res.json()`.

---

## 10. RecipesPage: Too Many State Variables

**File:** [kitchen/app/src/pages/RecipesPage.tsx](kitchen/app/src/pages/RecipesPage.tsx) (~630 lines)

**Smell:** 20+ `useState` calls in one component: health, recipes, selectedRecipe, scaffold modal, scaffold-agent modal, install state, etc.

**Impact:** Component is hard to follow. Related state (e.g. scaffold team form) is spread across multiple variables.

**Recommendation:** Group related state into objects (e.g. `scaffoldForm: { recipe, teamId, overwrite, loading, error }`). Extract sub-components (e.g. `RecipeDetailModal`, `ScaffoldTeamModal`). Consider `useReducer` for scaffold flows.

---

## 11. RecipesPage: Repeated useFetch Pattern

**File:** [kitchen/app/src/pages/RecipesPage.tsx](kitchen/app/src/pages/RecipesPage.tsx)

**Smell:** Multiple `useEffect` blocks with the same structure:
- `cancelled` flag
- `setLoading(true)`, `setError(null)`
- `fetchX().then(...).catch(...).finally(...)`
- `return () => { cancelled = true; }`

**Impact:** Verbose, easy to forget cancellation or error handling.

**Recommendation:** Extract `useFetch(url, deps)` or `useAsync(fn, deps)` that returns `{ data, loading, error, retry }` and handles cancellation.

---

## 12. BoardPage: Similar Complexity

**File:** [kitchen/app/src/pages/BoardPage.tsx](kitchen/app/src/pages/BoardPage.tsx)

**Smell:** Many state variables, repeated fetch/effect patterns, similar to RecipesPage.

**Impact:** Same as RecipesPage — harder maintenance and testing.

**Recommendation:** Same approaches as RecipesPage: group state, extract hooks, split into smaller components.

---

## 13. demo-workspace: Stage Directory Mapping

**File:** [kitchen/server/demo-workspace.js](kitchen/server/demo-workspace.js)

**Smell:** Stage-to-directory mapping duplicated in two places with a long if/else chain:
```js
t.stage === "backlog" ? "work/backlog" : t.stage === "in-progress" ? ...
```

**Impact:** Adding a stage requires updates in multiple branches.

**Recommendation:** `const STAGE_DIR = { backlog: "work/backlog", "in-progress": "work/in-progress", ... }; const stageDir = STAGE_DIR[t.stage] ?? "work/done";`

---

## 14. Inconsistent Error Status Logic

**File:** [kitchen/server/index.js](kitchen/server/index.js)

**Smell:** Status code choice is inconsistent: `err?.message?.includes("Invalid") ? 400 : 502` in some places, fixed 400 or 502 elsewhere.

**Impact:** Similar errors can produce different status codes. Hard to reason about.

**Recommendation:** Centralize: e.g. `getErrorStatus(err)` returning 400 for validation errors, 502 for upstream/CLI errors. Use it in the shared error handler.

---

## Summary: Priority

| Priority | Smell | Effort | Impact | Status |
|---------|-------|--------|--------|--------|
| High | #2 Error-handling wrapper | Low | Reduces duplication, easier to change | ✅ Done |
| High | #4 Magic numbers | Low | Clarity, single source of truth | ✅ Done |
| Medium | #5 Regex consolidation | Low | Validation consistency | ✅ Done |
| Medium | #9 api.ts fetch wrapper | Low | Cleaner client code | ✅ Done |
| Medium | #7 #8 OpenClaw CLI cleanup | Medium | Cleaner openclaw layer | ✅ Done |
| Medium | #6 Demo-team centralization | Medium | Easier demo changes | ✅ Done |
| Low | #3 Guard middleware | Medium | Cleaner route definitions | ✅ Done |
| Low | #13 demo-workspace stage map | Low | Minor clarity | ✅ Done |
| Low | #14 Error status logic | Low | Consistent status codes | ✅ Done |
| Low | #1 Route extraction | High | Better structure, testability | Done |
| Low | #10 #11 RecipesPage refactor | High | Component maintainability | Done |

---

## 15. BoardPage: Same complexity as pre-refactor RecipesPage (unchanged)

**File:** [kitchen/app/src/pages/BoardPage.tsx](kitchen/app/src/pages/BoardPage.tsx) (~372 lines)

**Smell:** 16+ `useState` calls, manual `useEffect` with `cancelled` flag for teams and tickets fetch. Same patterns we refactored in RecipesPage.

**Impact:** Harder to maintain, duplicate fetch/cancellation logic.

**Recommendation:** Apply useAsync for teams and tickets. Extract RemoveTeamModal as a sub-component. Consider grouping related state.

---

## 16. Frontend: demo-team string still hardcoded

**Files:** BoardPage.tsx (3 places), TicketDetail.tsx, TeamPicker.tsx

**Smell:** `selectedTeamId === "demo-team"` and `teamId === "demo-team"` instead of using `DEMO_TEAM_ID` from api.ts.

**Impact:** Changing demo ID requires edits in multiple frontend files.

**Recommendation:** Import `DEMO_TEAM_ID` from api and use `selectedTeamId === DEMO_TEAM_ID` everywhere.

---

## 17. BindingsPage: Duplicate health + fetch pattern

**File:** [kitchen/app/src/pages/BindingsPage.tsx](kitchen/app/src/pages/BindingsPage.tsx)

**Smell:** Same health-check-then-fetch pattern as RecipesPage had. Uses `load()` in useEffect with no cancellation. No retry for health.

**Impact:** SetState on unmount risk if user navigates away during fetch. Duplicate loading/error UI.

**Recommendation:** Use useAsync for health and bindings. Add cancellation in load() or use the hook.

---

## 18. InboxList & TicketDetail: Repeated useFetch pattern

**Files:** InboxList.tsx, TicketDetail.tsx

**Smell:** Same `cancelled` + fetch + retry-trigger pattern. Could use useAsync.

**Impact:** Verbose, easy to forget cancellation.

**Recommendation:** Use useAsync for inbox items and inbox content; for TicketDetail content.

---

## 19. CleanupModal: No fetch cancellation

**File:** [kitchen/app/src/components/CleanupModal.tsx](kitchen/app/src/components/CleanupModal.tsx)

**Smell:** useEffect fetches plan when `show` is true, but has no cancellation. If user closes modal before fetch completes, setState on unmounted component.

**Impact:** React warning, potential memory leak.

**Recommendation:** Add `let cancelled = false` and check before setState; `return () => { cancelled = true; }`.

---

## 20. Duplicate loading/health UI across pages

**Files:** RecipesPage, BindingsPage, (BoardPage via TeamPicker)

**Smell:** Nearly identical "Checking...", "Loading...", "Connect OpenClaw" screens with same structure (Container, Spinner, alert).

**Impact:** UI changes require edits in multiple files. Inconsistent copy possible.

**Recommendation:** Extract `<HealthGuard>` or `<PageLoadingState>` component that handles health check + loading + OpenClaw-unavailable states.

---

## 21. BindingsPage: Unstable list key

**File:** [kitchen/app/src/pages/BindingsPage.tsx](kitchen/app/src/pages/BindingsPage.tsx) line 145

**Smell:** `key={i}` for bindings list. Index as key can cause stale UI if list reorders.

**Impact:** Minor — bindings list rarely reorders, but keys should be stable.

**Recommendation:** Use `key={\`${b.agentId}-${b.match.channel}\`}` or similar composite key.

---

## 22. TicketDetail: Import order

**File:** [kitchen/app/src/components/TicketDetail.tsx](kitchen/app/src/components/TicketDetail.tsx)

**Smell:** API and constants imports appear after the TicketContent component definition. Unusual grouping.

**Impact:** Minor — readability. Imports typically grouped at top.

**Recommendation:** Move all imports to top of file.

---

## Summary: Additional findings (post-refactor)

| # | Smell | Effort | Impact |
|---|-------|--------|--------|
| 15 | BoardPage: useAsync, extract modals | High | Same as RecipesPage refactor |
| 16 | Frontend: use DEMO_TEAM_ID constant | Low | Single source for demo ID |
| 17 | BindingsPage: useAsync, add cancellation | Medium | Consistency, no unmount leak |
| 18 | InboxList, TicketDetail: use useAsync | Low | Less boilerplate |
| 19 | CleanupModal: add fetch cancellation | Low | Avoid setState-on-unmount |
| 20 | Extract HealthGuard / PageLoadingState | Medium | DRY loading UI |
| 21 | BindingsPage: stable list keys | Low | Correct React keys |
| 22 | TicketDetail: fix import order | Low | Readability |

---

## Additional findings (second pass)

### 23. ActivityFeed: Manual fetch + no useAsync

**File:** [kitchen/app/src/components/ActivityFeed.tsx](kitchen/app/src/components/ActivityFeed.tsx)

**Smell:** Manual `useEffect` with `load()` + `setInterval`, same pattern as other pages. Uses `.catch(() => {})` which swallows errors silently. No retry on failure.

**Impact:** Inconsistent with useAsync pattern. Failures are invisible to the user. Duplicate polling logic.

**Recommendation:** Switch to `useAsync` with `refetchInterval: 5000`. At minimum, surface errors or log them instead of swallowing. Consider `fallbackOnError: []` if activity is non-critical.

---

### 24. ActivityFeed: Magic numbers

**File:** [kitchen/app/src/components/ActivityFeed.tsx](kitchen/app/src/components/ActivityFeed.tsx)

**Smell:** `fetchActivity(50)` hardcoded. `setTimeout(..., 1500)` for new-item highlight. `POLL_INTERVAL_MS = 5000` is good. Width values `260px` / `44px` inline.

**Impact:** Activity limit (50) not aligned with server default. Highlight duration buried in component.

**Recommendation:** Export `ACTIVITY_FETCH_LIMIT = 50` from constants (or import from api if server exposes). Extract `NEW_ITEM_HIGHLIGHT_MS = 1500`. Consider CSS variables for sidebar widths.

---

### 25. ActivityFeed: formatTime inline

**File:** [kitchen/app/src/components/ActivityFeed.tsx](kitchen/app/src/components/ActivityFeed.tsx)

**Smell:** `formatTime` is defined inline with magic numbers (`60`, `3600`, `86400`). Reusable relative-time logic.

**Impact:** Minor — if other components need "Xm ago" style formatting, it would be duplicated.

**Recommendation:** Extract `formatRelativeTime(ts: string)` to `utils/formatTime.ts` (or `constants.ts`). Use named constants for `SEC_PER_MIN`, `SEC_PER_HOUR`, `SEC_PER_DAY`.

---

### 26. Layout: Document title logic

**File:** [kitchen/app/src/components/Layout.tsx](kitchen/app/src/components/Layout.tsx)

**Smell:** `useEffect` with if/else chain for `document.title` by path. `demoMode` is destructured but not used in the effect.

**Impact:** Adding a new route requires editing Layout. `demoMode` in destructure suggests it was intended for something.

**Recommendation:** Consider a route config: `{ path: "/board", title: "Board" }` and derive title from `location.pathname`. Remove unused `demoMode` if not needed.

---

### 27. CleanupModal: Could use useAsync for plan

**File:** [kitchen/app/src/components/CleanupModal.tsx](kitchen/app/src/components/CleanupModal.tsx)

**Smell:** Plan fetch now has cancellation (per #19) but still uses manual useState + useEffect. Many related state vars: `plan`, `planError`, `planLoading`, `executing`, `executeResult`, `confirming`.

**Impact:** Consistent with useAsync would simplify. Execute flow (two-step confirm) is inherently stateful but could be clearer.

**Recommendation:** Use `useAsync` for plan fetch with `enabled: show`. Keeps execute flow manual but reduces plan boilerplate.

---

### 28. Duplicated “Loading...” + Spinner UI

**Files:** InboxList, TicketDetail, RecipeDetailModal, CleanupModal, KanbanBoard

**Smell:** Same pattern in many places:
```tsx
<div className="text-center py-4 text-muted">
  <Spinner animation="border" size="sm" className="me-2" />
  Loading...
</div>
```
(With minor variants: `py-3`, `py-5`, different messages.)

**Impact:** UI tweaks (e.g. aria attributes, spacing) require edits in many files. Inconsistent messaging ("Loading...", "Loading inbox...", "Loading recipes...").

**Recommendation:** Extract `<LoadingSpinner message="Loading..." />` component. Or extend PageLoadingState to support inline (non-full-page) usage.

---

### 29. core.js health route: Silent catch

**File:** [kitchen/server/routes/core.js](kitchen/server/routes/core.js)

**Smell:** `router.get("/health", async (_req, res) => { try { ... } catch { res.status(503)... } })` — `catch` block has no logging. Error is swallowed.

**Impact:** When health check fails (e.g. openclaw not found), no server log. Harder to debug.

**Recommendation:** `catch (err) { console.error("[kitchen] Health check failed:", err); res.status(503)... }`

---

### 30. TicketCard: Magic number for flash

**File:** [kitchen/app/src/components/TicketCard.tsx](kitchen/app/src/components/TicketCard.tsx)

**Smell:** `setTimeout(..., 800)` for flash duration. No named constant.

**Impact:** Minor. Changing animation timing requires finding the literal.

**Recommendation:** `const FLASH_DURATION_MS = 800;`

---

### 31. Inline SVG icons duplicated

**Files:** RemoveTeamModal, CleanupModal, TeamPicker (empty state), RecipeCard, TicketCard, ActivityFeed, HealthGuard

**Smell:** Same warning/exclamation SVG path appears in RemoveTeamModal and CleanupModal. Chevron SVGs in ActivityFeed. Various icons inline.

**Impact:** Duplicated SVG markup. Changing icon style requires edits in multiple files. Bundle size.

**Recommendation:** Extract icon components (e.g. `IconWarning`, `IconChevronLeft`) or use an icon library. Lower priority given icons are small.

---

### 32. Duplicate form modal patterns

**Files:** DispatchModal, ScaffoldTeamModal, ScaffoldAgentModal, Add Binding modal (BindingsPage)

**Smell:** All follow: `useState` for form fields + loading + error, `handleSubmit` async with setLoading/setError, `onClose` guarded by `!loading`, similar Modal layout.

**Impact:** Boilerplate repeated. Adding validation or accessibility (e.g. focus trap) would require edits in each.

**Recommendation:** Consider `useFormSubmit` hook or a base `FormModal` that handles loading/error/close guard. Optional — may be overkill for 4 modals.

---

### 33. App.tsx: Missing trailing newline

**File:** [kitchen/app/src/App.tsx](kitchen/app/src/App.tsx)

**Smell:** Trivial — no newline at EOF. Some linters flag this.

**Impact:** None. Cosmetic.

**Recommendation:** Add newline at EOF. Often auto-fixed by format-on-save.

---

## Summary: Second-pass findings

| #  | Smell | Effort | Impact | Status |
|----|-------|--------|--------|--------|
| 23 | ActivityFeed: use useAsync, stop swallowing errors | Low | Consistency, debuggability | ✅ Done |
| 24 | ActivityFeed: magic numbers (50, 1500, widths) | Low | Clarity | ✅ Done |
| 25 | ActivityFeed: extract formatTime | Low | Reusability | ✅ Done |
| 26 | Layout: route-based title config | Low | Maintainability | ✅ Done |
| 27 | CleanupModal: use useAsync for plan | Low | Consistency | ✅ Done |
| 28 | Extract LoadingSpinner component | Low | DRY | ✅ Done |
| 29 | core.js health: log caught errors | Trivial | Debuggability | ✅ Done |
| 30 | TicketCard: FLASH_DURATION_MS constant | Trivial | Clarity | ✅ Done |
| 31 | Extract icon components | Medium | DRY, bundle | ✅ Done |
| 32 | useFormSubmit / FormModal pattern | Medium | Less boilerplate | ✅ Done |
| 33 | EOF newlines | Trivial | Lint hygiene | ✅ Done |
