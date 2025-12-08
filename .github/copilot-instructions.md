# VolleyScore Pro v2 - AI Coding Instructions

## Architecture Overview

**VolleyScore Pro** is a cross-platform PWA/native volleyball scorekeeping app built with React + Vite, supporting web, Android (Capacitor), and iOS. The codebase separates **persistent data** (player profiles, match history) from **volatile game state** (active match scores, court roster).

### Three-Tier Data Model

1. **Master Profiles** (`stores/historyStore.ts`, `usePlayerProfiles`): Persistent player database stored via Capacitor Filesystem (mobile) / localStorage (web)
2. **Game Instances** (`useVolleyGame` hook): Volatile per-match state including scores, teams, court roster
3. **Court Queue** (`usePlayerQueue` hook): Rotation management and side-switching logic; syncs player changes from master profiles automatically

### Core Data Flow

```
Master Profiles → [Create/Link] → Game Instance Players → [Rotate] → Court Queue (courtA, courtB, queue array)
                                           ↓
                                    ActionLog (undo/redo)
                                           ↓
                                   Match Save → History Store
```

## Development Workflows

### Build & Run
```bash
npm install
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # Production build (dist/ + Vite PWA manifest)
npm run lint       # ESLint with strict TypeScript checks
npm run preview    # Test production build locally
```

### Mobile Deployment (Capacitor)
- **Web assets** build to `dist/` (pulled by Capacitor)
- **Android**: `npx cap sync && npx cap open android` (Android Studio)
- **iOS**: `npx cap open ios` (Xcode)
- **SplashScreen config** in `capacitor.config.ts` - disable `splashImmersive` to prevent orientation jumps

### State Persistence
- **Match history**: Capacitor Filesystem (`stores/historyStore.ts` with `persist` middleware)
- **Player profiles**: Zustand + Capacitor/localStorage via `usePlayerProfiles` hook
- **LocalStorage keys**: `volleyscore-lang` (language), Zustand prefixes for state

## Key Patterns & Conventions

### Game State Management
- **`useVolleyGame()`** returns mutable action functions (`addPoint`, `subtractPoint`, `undo`, etc.) and immutable state
- **ActionLog**: Typed discriminated union (`type: 'POINT' | 'TIMEOUT' | ...`) with metadata for replay/undo
- **Sudden Death**: Tracked in state (`inSuddenDeath` flag); always check this before scoring logic
- **Sets Logic**: `currentSet` increments after set win; `setsA/setsB` count set wins; match ends when `SETS_TO_WIN_MATCH(config.maxSets)` is reached

### Roster & Rotation
- **Player objects** have `profileId` (link to master) + `originalIndex` (for reset)
- **Fixed players** (`isFixed: true`) stay in place during auto-balance; never moved during rotations
- **Rotation modes**: `'standard'` (sequential out/in) vs `'balanced'` (snake distribution); logic in `balanceUtils.ts`
- **Deleted players**: Soft-deleted with recovery window in `usePlayerQueue` (`deletedHistory` array)

### i18n Pattern
- **Translation keys**: Nested dot-notation (`'errors.genericTitle'`) loaded from `public/locales/{en,pt,es}.json`
- **Runtime substitution**: `t('key', { var: 'value' })` replaces `{{var}}` in translations
- **Language detection**: Auto-detects browser language; persists user choice to localStorage

### Component Patterns
- **Modal lifecycle**: Modals are **always rendered** (`display: none` when hidden) to preserve state; controlled via boolean flags
- **Error boundaries**: `ErrorBoundary` class component wraps critical sections; shows reload prompt on error
- **Gesture handling**: `useScoreGestures` hook encapsulates swipe/tap logic; preventDefault on touchstart to avoid conflicts
- **Responsive layout**: `useAdaptiveLayout` detects fullscreen/orientation; `useHudMeasure` calculates SafeArea insets for notches

### Security & Validation
- **Input sanitization**: `sanitizeInput()` in `utils/security.ts` - trim, check length, avoid injection
- **Validation functions**: `isValidScoreOperation()`, `isValidTimeoutRequest()` before state mutations
- **Capacitor plugins**: Always wrapped in `try-catch`; handle "native is unavailable" (web fallback)

### Audio & Haptics
- **Game audio** (`useGameAudio`): Muted on web by default (user gesture required); auto-enables on mobile
- **Haptics** (`useHaptics`): Wraps Capacitor Haptics with fallback; safe to call on non-native platforms
- **Voice control** (`useVoiceControl`): Speech Recognition API (Capacitor plugin); respects `config.enableVoiceControl`

## Important Files & Their Roles

| File | Purpose |
|------|---------|
| `hooks/useVolleyGame.ts` | Game state machine; scoring, timeouts, set logic |
| `hooks/usePlayerQueue.ts` | Roster management, rotations, player deletion/recovery |
| `stores/historyStore.ts` | Persistent match history with Capacitor file storage |
| `hooks/usePlayerProfiles.ts` | Master player database; Zustand + encryption (SecureStorage) |
| `types.ts` | All TypeScript interfaces (TeamId, Player, Team, GameState, ActionLog) |
| `constants.ts` | Game rules (MIN_LEAD_TO_WIN, SETS_TO_WIN_MATCH, PLAYER_LIMIT) |
| `utils/balanceUtils.ts` | Rotation algorithms (snake distribution, standard rotation) |
| `App.tsx` | Root layout; modal state orchestration; Capacitor initialization |
| `vite.config.ts` | Code-split chunks (react-core, ui-libs, dnd-kit, heavy-utils); PWA config |

## Testing & Debugging

- **No Jest/Vitest setup** - currently manual testing only
- **Console logs** stripped in production (Vite terser config)
- **Dev tips**: Use React DevTools to inspect Zustand store; check localStorage/Capacitor Filesystem via DevTools
- **Locale testing**: Override `localStorage.setItem('volleyscore-lang', 'pt')` and reload

## Avoid These Pitfalls

1. **Don't mutate ActionLog directly** - always create new action objects; state management relies on immutability
2. **Don't bypass `sanitizeInput()`** - even on calculated values; security boundary for Capacitor interop
3. **Don't modify Player objects without updating Game state** - triggers re-render inconsistencies
4. **Don't hard-code team colors** - use config from state; ThemeContext provides override capability
5. **Don't call Capacitor plugins on unmounted components** - wrap in `if (Capacitor.isNative) { ... }`

## Adding New Features

- **New scoring type**: Add to `SkillType` union in `types.ts`; update ActionLog variant
- **New game mode**: Extend `GameMode` type; add config to DEFAULT_CONFIG; update rotation logic
- **New language**: Add JSON to `public/locales/`; no code changes needed (auto-loaded)
- **New Capacitor plugin**: Wrap in try-catch; fallback for web; check `Capacitor.isNative` before calling

---

**Last updated**: December 8, 2025 | **Branch**: ai-update | **Version**: 2.0.5
