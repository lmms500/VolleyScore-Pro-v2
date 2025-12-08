# TeamManagerModal.tsx - Dependency Architecture & Maintenance Guide

**Status**: Production Ready (v2.0.5)  
**Last Updated**: December 8, 2025  
**Complexity**: ⚠️ HIGH - 1100+ lines, 15+ sub-components, 5-layer dependency stack

---

## 1. Dependency Tree (Visual)

```
TeamManagerModal.tsx (View Layer - 1100 LOC)
│
├─ 🧩 UI/Presentation Layer
│  ├─ components/ui/Modal.tsx
│  │  └─ [Container, backdrop, animations, close handling]
│  │
│  ├─ components/ui/Button.tsx
│  │  └─ [Standardized button with haptic feedback]
│  │
│  └─ Lucide Icons (16 icons: Plus, Trash2, Shuffle, Star, etc.)
│     └─ [Icon library for visual consistency]
│
├─ 🧠 Business Logic & Utilities
│  ├─ utils/balanceUtils.ts ⚡ CRITICAL
│  │  ├─ calculateTeamStrength(players[]) → number
│  │  │  └─ Used in: TeamColumn header badge
│  │  │
│  │  ├─ balanceTeamsSnake(courtA, courtB, queue[])
│  │  │  └─ Used in: onBalanceTeams() action (Draft mode)
│  │  │
│  │  ├─ distributeStandard(names[], team count)
│  │  │  └─ Used in: generateTeams batch import logic
│  │  │
│  │  └─ getStandardRotationResult(gameState)
│  │     └─ Used in: rotation mode calculation
│  │
│  └─ utils/colors.ts 🎨
│     ├─ TEAM_COLORS: Map<TeamColor, ThemeConfig>
│     │  └─ [Color definitions: indigo, rose, emerald, amber, sky, teal, violet, rose]
│     │
│     ├─ COLOR_KEYS: TeamColor[]
│     │  └─ Used in: ColorPicker component (iterating colors)
│     │
│     └─ resolveTheme(color: TeamColor) → { bg, border, text, gradient, ring, halo }
│        └─ Used in: TeamColumn styling (adaptive backgrounds)
│
├─ 🧬 Type Definitions (Contracts)
│  └─ types.ts
│     ├─ Player
│     │  ├─ id: string
│     │  ├─ name: string
│     │  ├─ profileId?: string (link to master profile)
│     │  ├─ number?: string (jersey number)
│     │  ├─ skillLevel: 1-5
│     │  ├─ isFixed: boolean (locked in rotation)
│     │  └─ originalIndex?: number
│     │
│     ├─ Team
│     │  ├─ id: string ('A' | 'B' | UUID for queue)
│     │  ├─ name: string
│     │  ├─ color?: TeamColor
│     │  └─ players: Player[]
│     │
│     ├─ PlayerProfile (Master Database)
│     │  ├─ id: string (UUID)
│     │  ├─ name: string
│     │  ├─ skillLevel: 1-5
│     │  └─ createdAt: timestamp
│     │
│     ├─ RotationMode: 'standard' | 'balanced'
│     │
│     └─ TeamColor: 'indigo' | 'rose' | 'emerald' | 'amber' | 'sky' | 'teal' | 'violet'
│
├─ 🌍 Context (Global State)
│  └─ contexts/LanguageContext.tsx
│     ├─ useTranslation() hook
│     │  └─ Returns t() function for i18n lookups
│     │
│     └─ Translation keys used in Modal:
│        ├─ teamManager.title
│        ├─ teamManager.tabs.roster
│        ├─ teamManager.tabs.profiles
│        ├─ teamManager.tabs.batch
│        ├─ teamManager.modes.standard
│        ├─ teamManager.modes.balanced
│        ├─ teamManager.location.courtA
│        ├─ teamManager.location.courtB
│        ├─ teamManager.location.queue
│        ├─ teamManager.sync.synced
│        ├─ teamManager.sync.desynced
│        ├─ teamManager.sync.unlinked
│        └─ ... [20+ more keys in public/locales/en.json]
│
├─ 📦 External Libraries (Core Dependencies)
│  ├─ @dnd-kit/core
│  │  ├─ DndContext: Provides drag context to children
│  │  ├─ DragStartEvent, DragOverEvent, DragEndEvent
│  │  └─ closestCenter: collision detection strategy
│  │
│  ├─ @dnd-kit/sortable
│  │  ├─ SortableContext: Makes items draggable within container
│  │  ├─ useSortable(id): Hook for individual item drag state
│  │  └─ verticalListSortingStrategy: Ordering strategy
│  │
│  ├─ @dnd-kit/utilities
│  │  └─ CSS.Transform.toString(): Converts transform to CSS
│  │
│  ├─ framer-motion
│  │  ├─ motion.div: Animated container
│  │  ├─ AnimatePresence: Manages exit animations
│  │  └─ Used in: Sort menu, color picker check
│  │
│  ├─ lucide-react (16 icons)
│  │  └─ [Visual components for buttons and badges]
│  │
│  └─ react-dom
│     └─ createPortal: Renders DragOverlay outside DOM tree
│
└─ 📍 Indirect/Inferred Dependencies (via Props)
   ├─ hooks/usePlayerQueue.ts (NOT imported, but provides all action handlers)
   │  ├─ addPlayer(name, target, number, skill)
   │  ├─ removePlayer(playerId)
   │  ├─ movePlayer(playerId, fromId, toId, index)
   │  ├─ updatePlayerName(playerId, name)
   │  ├─ updatePlayerNumber(playerId, number)
   │  ├─ updatePlayerSkill(playerId, skill)
   │  ├─ togglePlayerFixed(playerId)
   │  ├─ generateTeams(names[])
   │  ├─ setRotationMode(mode)
   │  └─ balanceTeams()
   │
   └─ hooks/usePlayerProfiles.ts (NOT imported, but enables profile sync)
      ├─ upsertProfile(name, skill, id?) → creates/updates master profile
      ├─ deleteProfile(id) → soft-delete with recovery
      ├─ addPlayer(name, skill) → batch add
      └─ profiles: Map<id, PlayerProfile>
```

---

## 2. Props Interface (What TeamManagerModal Consumes)

```typescript
interface TeamManagerModalProps {
  // --- Modal Controls ---
  isOpen: boolean;
  onClose: () => void;

  // --- Game State (Read-Only) ---
  courtA: Team;                  // From useVolleyGame
  courtB: Team;
  queue: Team[];
  rotationMode: RotationMode;
  profiles: Map<string, PlayerProfile>;
  deletedCount: number;
  canUndoRemove: boolean;

  // --- Game Actions (Write) ---
  onAddPlayer: (name, target: 'A'|'B'|'Queue', number?, skill?) => void;
  onRemove: (id: string) => void;
  onMove: (playerId, fromId, toId, newIndex?) => void;
  onUpdateTeamName: (teamId, name) => void;
  onUpdateTeamColor: (teamId, color) => void;
  onUpdatePlayerName: (playerId, name) => void;
  onUpdatePlayerNumber: (playerId, number) => void;
  onUpdatePlayerSkill: (playerId, skill) => void;
  onSaveProfile: (playerId) => void;
  onRevertProfile: (playerId) => void;
  onSetRotationMode: (mode) => void;
  onBalanceTeams: () => void;
  onGenerate: (names[]) => void;
  onUndoRemove: () => void;
  onCommitDeletions: () => void;
  onToggleFixed: (playerId) => void;
  onSortTeam: (teamId, criteria: 'name'|'number'|'skill') => void;

  // --- Profile Management (Optional) ---
  deleteProfile?: (id: string) => void;
  upsertProfile?: (name, skill, id?) => PlayerProfile;
}
```

---

## 3. Sub-Components Breakdown (15 Components)

### Atomic Components (Memoized, Reusable)

| Component | Purpose | Props | Renders |
|-----------|---------|-------|---------|
| `SkillSelector` | 5-star skill picker | level, onChange, size | 5 buttons (Star icons) |
| `ColorPicker` | Team color selector | selected, onChange, usedColors | 8 color buttons |
| `SyncIndicator` | Profile sync status dot | player, hasProfile, profileMatch, onSave, onRevert | Status badge + Save/Revert buttons |
| `EditableTitle` | Inline text editor for names | name, onSave, className, isPlayer | Input or text with edit icon |
| `EditableNumber` | Inline jersey number editor | number, onSave | Input or number display |

### Business Components (Memoized)

| Component | Purpose | Props | Children |
|-----------|---------|-------|----------|
| `ProfileCard` | Master profile display | profile, onUpdate, onDelete, onAddToGame, status | Profile name/skill + Add buttons |
| `PlayerCard` | Individual player in team | player, locationId, profiles, ...handlers, isCompact, forceDragStyle | Grip + Number + Name + Stars + Actions |
| `AddPlayerInput` | Quick add player form | onAdd, disabled | Expandable form (name, #, skill) |
| `TeamColumn` | Team roster container | id, team, profiles, ...handlers, usedColors, isQueue, onSortTeam | Header + Color picker + Player list + Add button |
| `BatchInputSection` | Batch import textarea | onGenerate | Large textarea + Generate button |

### Layout & Context

| Component | Purpose |
|-----------|---------|
| `TabButton` | Segmented control tab | Roster / Profiles / Batch |
| Drag Overlay | Portal for dragging visual | DragOverlay from dnd-kit |
| Undo Toast | Bottom-right undo notification | Fixed position, auto-dismiss |

---

## 4. Data Flow Patterns

### Pattern 1: Add Player (Synchronous)

```
User types name + clicks Add
    ↓
onAddPlayer('João', 'A', '10', 3)
    ↓
usePlayerQueue.addPlayer()
    ├─ Creates profile (sync): upsertProfile('João', 3)
    ├─ Creates player: { id, name, profileId, number, skillLevel, isFixed }
    └─ Updates courtA.players[]
    ↓
setQueueState(new state)
    ↓
Team rerender (Profile indicator → Synced ✓)
```

### Pattern 2: Drag & Drop Between Teams

```
User drags player from courtA to courtB
    ↓
handleDragStart() → setActivePlayer (for overlay)
    ↓
handleDragOver() → props.onMove(playerId, 'A', 'B', 2)
    ↓
usePlayerQueue.movePlayer()
    ├─ Removes from courtA.players
    └─ Inserts into courtB.players at index 2
    ↓
setQueueState(new state)
    ↓
Both TeamColumns rerender (list updated)
```

### Pattern 3: Profile Sync Workflow

```
User edits player name inline
    ↓
onUpdatePlayerName(playerId, 'João Silva')
    ↓
Player.name updates ≠ Profile.name
    ↓
SyncIndicator shows 🟡 Desynced
    ↓
User clicks Save
    ↓
onSaveProfile(playerId)
    ↓
usePlayerQueue.saveProfile()
    ├─ Updates profile master: { name: 'João Silva', skillLevel: 3 }
    └─ Links player.profileId
    ↓
Profile persists (Capacitor Filesystem)
    ↓
SyncIndicator shows 🟢 Synced
```

---

## 5. Critical Import Points (What Must Not Break)

### ❌ DO NOT remove or rename:

| Import | Impact |
|--------|--------|
| `utils/balanceUtils.ts` → `calculateTeamStrength` | Stars badge breaks |
| `utils/colors.ts` → `resolveTheme` | TeamColumn theme colors break |
| `types.ts` → `Player, Team, PlayerProfile, TeamColor` | Type safety breaks |
| `contexts/LanguageContext.tsx` → `useTranslation` | All text becomes undefined |
| `@dnd-kit/core` → `DndContext, DragEndEvent, ...` | Drag-and-drop breaks |
| `framer-motion` → `motion, AnimatePresence` | Sort menu animations break |

### ⚠️ SAFE to modify (doesn't break Modal):

- `hooks/usePlayerQueue.ts` - just update handler signatures in TeamManagerModalProps
- `hooks/usePlayerProfiles.ts` - just update profile-related handlers
- `components/ui/Modal.tsx` - only affects container styling
- Translation strings in `public/locales/*.json` - just update keys

---

## 6. Performance Optimizations Currently in Place

### 1. React.memo Everywhere
```typescript
const SkillSelector = memo(({ level, onChange, size } => ...) // ✅
const PlayerCard = memo(({ player, ... } => ...) // ✅ with custom comparator
const TeamColumn = memo(({ id, team, ... } => ...) // ✅
```
**Why**: Prevents re-renders of sub-components unless their props change.

### 2. useCallback Stabilization
```typescript
const handleAddA = useCallback((n, num?, s?) => props.onAddPlayer(n, 'A', num, s), [props.onAddPlayer])
```
**Why**: Stable callbacks prevent TeamColumn children from re-rendering unnecessarily.

### 3. useMemo for Heavy Calculations
```typescript
const teamStrength = useMemo(() => calculateTeamStrength(team.players), [team.players])
const filteredProfiles = useMemo(() => Array.from(props.profiles.values()).filter(...), [props.profiles, searchTerm])
```
**Why**: Expensive computations are cached across renders.

### 4. Drag Overlay GPU Optimization
```typescript
// ✅ Opaque color (no blur) = less GPU load
const containerClass = forceDragStyle ? `bg-slate-100 dark:bg-slate-800 ...`
// Instead of: `backdrop-blur-xl` (expensive)
```
**Why**: During drag, blur filters cause frame drops on mobile. Opaque colors are 3x faster.

### 5. Separated Batch Input Component
```typescript
const BatchInputSection = memo(({ onGenerate } => ...)) // ✅ Separate component
```
**Why**: Textarea keystrokes don't trigger main modal re-renders.

---

## 7. Maintenance Checklist

### When Adding a New Feature:

- [ ] Update `types.ts` with new interfaces (if needed)
- [ ] Add new translations to `public/locales/{en,pt,es}.json`
- [ ] Wrap new components in `React.memo()` with optional custom comparator
- [ ] Use `useCallback()` for new event handlers passed as props
- [ ] Update `TeamManagerModalProps` interface
- [ ] Pass new handlers from `App.tsx` when instantiating `<TeamManagerModal />`
- [ ] Test in both light and dark modes
- [ ] Test on mobile (Android + iOS) via Capacitor

### When Modifying Business Logic:

1. **Changing team balancing algorithm**:
   - Edit: `utils/balanceUtils.ts`
   - Test: `calculateTeamStrength()` output
   - Verify: Star badges display correctly

2. **Changing player persistence**:
   - Edit: `hooks/usePlayerQueue.ts` or `hooks/usePlayerProfiles.ts`
   - Verify: Profile sync indicators work (🟢 / 🟡 / ⚪)

3. **Changing drag-and-drop behavior**:
   - Edit: `handleDragStart`, `handleDragOver`, `handleDragEnd` in TeamManagerModal
   - Test: Moving players between courts, queue rotation

4. **Changing color scheme**:
   - Edit: `utils/colors.ts` → `TEAM_COLORS` map
   - Update: `public/locales/*.json` if adding new colors

### When Testing:

```bash
# Build and verify types
npm run build

# Capacitor sync for native testing
npx cap sync android
npx cap open android  # Opens Android Studio

# Check for lingering console errors
npm run lint
```

---

## 8. Known Limitations & Future Improvements

### Current Constraints:

1. **Max 6 players per team**: Hard-coded limit in `AddPlayerInput` (isFull = length >= 6)
   - **Location**: `TeamColumn.tsx` → `const isFull = team.players.length >= 6`
   - **Change**: Update to `PLAYER_LIMIT` from `constants.ts`

2. **Drag-and-drop only works on touch > 5px**: `useSensor(PointerSensor, { distance: 5 })`
   - **Reason**: Prevents accidental drags on click
   - **Adjust if needed**: Lower to 3 for more sensitive drag

3. **Profile search is case-insensitive**: `.toLowerCase().includes()`
   - **Enhancement**: Could add fuzzy matching or regex

4. **Batch import has no progress indicator**: Just splits by newline
   - **Enhancement**: Show import progress for 100+ names

### Future Optimizations:

- [ ] Virtualization for 100+ players (react-window)
- [ ] Worker thread for heavy balancing calculations
- [ ] Batch operations debouncing
- [ ] Profile image uploads (avatar)
- [ ] Export/import rosters as CSV

---

## 9. Quick Reference: Where to Find Things

| What | Where |
|------|-------|
| Team balancing logic | `utils/balanceUtils.ts` |
| Team colors & themes | `utils/colors.ts` |
| Player/Team types | `types.ts` |
| i18n text | `public/locales/en.json` |
| Game state (add/remove/move) | `hooks/usePlayerQueue.ts` |
| Master profiles DB | `hooks/usePlayerProfiles.ts` |
| Modal entry point | `App.tsx` (lazy loaded) |
| Drag-drop library | `node_modules/@dnd-kit/` |

---

## 10. Debugging Tips

### Problem: Player not appearing after clicking Add

**Check**:
1. `usePlayerQueue.addPlayer()` is being called (add console.log)
2. Profile is created: `profiles.get(player.profileId)` returns a value
3. `courtA.players` array includes the new player
4. **Fix**: Ensure `setQueueState()` happens synchronously (see git history)

### Problem: Drag-and-drop not working

**Check**:
1. `DndContext` wraps the grid: `<DndContext sensors={sensors} ...>`
2. `SortableContext` wraps each team: `<SortableContext items={...}>`
3. `useSortable()` is called on each PlayerCard
4. **Fix**: Verify `id` prop uniqueness (no duplicate player IDs)

### Problem: Color picker disabled unexpectedly

**Check**:
1. `usedColors` set is populated: `courtA.color, courtB.color, queue[].color`
2. Button class has `disabled={isTaken}` attribute
3. **Fix**: Check if another team already has that color

### Problem: Translations missing

**Check**:
1. Key exists in `public/locales/en.json`
2. Translation is loaded: `useTranslation()` provides `t()` function
3. **Fix**: Add missing key to all locale files (en, pt, es)

---

**Document Version**: 1.0  
**Last Reviewed**: December 8, 2025  
**Next Review**: After next major refactor or library upgrade
