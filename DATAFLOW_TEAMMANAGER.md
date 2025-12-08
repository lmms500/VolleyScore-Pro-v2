# TeamManagerModal - Sequence Diagrams & Data Flow

**Purpose**: Visual documentation of critical data flows through the Modal ecosystem.

---

## 1. Add Player Flow (Complete Lifecycle)

```
┌─ UI Layer ─────────────────┐  ┌─ Business Layer ────────────┐  ┌─ Persistence ──────┐
│ AddPlayerInput Component  │  │ usePlayerQueue Hook         │  │ usePlayerProfiles  │
└──────────────────────────┬┘  └────────────────┬────────────┘  └────────────┬────────┘
                           │                    │                           │
User types "João"          │                    │                           │
User clicks [+]            │                    │                           │
                           │                    │                           │
(1) onAdd("João", "A", "10", 3)               │                           │
                     ├─────────────────────────>│                           │
                     │                         │                           │
                     │   (2) addPlayer()       │                           │
                     │   - sanitize name       │                           │
                     │   - validate skillLevel │                           │
                     │   - lookup profile      │                           │
                     │                         │                           │
                     │                         ├─ findProfileByName()      │
                     │                         │   (check if exists)       │
                     │                         │   └─> return null         │
                     │                         │                           │
                     │   (3) Profile missing!  │                           │
                     │   Create one sync       │                           │
                     │                         │                           │
                     │                         ├──────> upsertProfile()    │
                     │                         │        "João", skill: 3   │
                     │                         │        <─────────────────>│
                     │                         │        return { id, ... } │
                     │                         │                           │
        ┌─────────────────────────────────────┐                           │
        │ CRITICAL: Sync Profile Creation!    │                           │
        │ Do NOT call upsertProfile outside   │                           │
        │ setQueueState() or race condition   │                           │
        │ will occur (stale profileId)        │                           │
        └─────────────────────────────────────┘                           │
                     │                         │                           │
                     │   (4) setQueueState()   │                           │
                     │   - Create player:      │                           │
                     │     {                   │                           │
                     │       id: uuid(),       │                           │
                     │       name: "João",     │                           │
                     │       number: "10",     │                           │
                     │       profileId: "x1",  │ ◄─ LINKED!               │
                     │       skillLevel: 3,    │                           │
                     │       isFixed: false    │                           │
                     │     }                   │                           │
                     │   - Append to courtA    │                           │
                     │   - Persist to storage  │                           │
                     │                         │                           │
                     │   (5) Queue state       │                           │
                     │   updated ✓             │                           │
                     │                         │                           │
(6) React re-render <────────────────────────┼───────────────────────────┼────
    Modal sees new player in courtA           │                           │
    TeamColumn re-renders                     │                           │
    PlayerCard mounts                         │                           │
                                              │                           │
(7) SyncIndicator checks profile match        │                           │
    profile.name === "João" ✓                 │                           │
    profile.skillLevel === 3 ✓                │                           │
    Shows 🟢 SYNCED                           │                           │
                                              │                           │
End State:                                    │                           │
✓ Player exists in courtA                    │                           │
✓ Profile exists in master DB                │                           │
✓ ProfileID linked                           │                           │
✓ Persisted to storage                       │                           │
```

**Key Takeaway**: The entire profile creation MUST happen synchronously inside `setQueueState()` callback, not before it. This ensures the newly created profileId is captured in the same render cycle.

---

## 2. Drag & Drop Flow (Between Teams)

```
┌─ Drag Layer ────────────┐  ┌─ Collision Detection ─┐  ┌─ Move Logic ────────┐
│ DndContext              │  │ closestCenter          │  │ usePlayerQueue      │
└──────────────────────────┘  └───────────────────────┘  └─────────────────────┘
                 │                        │                        │
User presses PlayerCard                   │                        │
(finger/mouse down on grip)               │                        │
                 │                        │                        │
(1) handleDragStart()                     │                        │
    - Get playerId from event             │                        │
    - Lookup player from playersById map  │                        │
    - setActivePlayer(player)             │                        │
    - [Render DragOverlay copy]           │                        │
                 │                        │                        │
User moves finger to courtB                │                        │
                 │                        │                        │
(2) handleDragOver() triggered            │                        │
    active.id = playerId (from courtA)    │                        │
    over.id = courtB container ID         │                        │
                 │                        │                        │
                 │────> findContainer(playerId)                    │
                 │    └─> "A" (source)                             │
                 │                        │                        │
                 │────> findContainer(over.id)                     │
                 │    └─> "B" (target)                             │
                 │                        │                        │
    activeContainer !== overContainer ✓   │                        │
    (Moving between courts)               │                        │
                 │                        │                        │
    get overIndex from collision detect   │                        │
    (which position in courtB list?)      │                        │
                 │                        │                        │
                 │────> props.onMove()────────────────────────────>│
                 │      playerId, 'A', 'B', index=2               │
                 │                        │        │               │
                 │                        │        (3) movePlayer()│
                 │                        │        ├─ Remove from  │
                 │                        │        │  courtA       │
                 │                        │        ├─ Insert to    │
                 │                        │        │  courtB[2]    │
                 │                        │        └─ setQueueState│
                 │                        │                        │
    (4) React re-render                   │                        │
        Player disappears from courtA     │                        │
        Player appears in courtB at pos 2 │                        │
        [All PlayerCard memos prevent     │                        │
         unnecessary re-renders]          │                        │
                 │                        │                        │
User releases finger                       │                        │
                 │                        │                        │
(5) handleDragEnd()                       │                        │
    - setActivePlayer(null)               │                        │
    - DragOverlay hides                   │                        │
    - [Optional] Fire final move (if pos  │                        │
      changed)                            │                        │
                 │                        │                        │
End State:                                │                        │
✓ Player in courtB                        │                        │
✓ Original index from courtA removed      │                        │
✓ PlayerCard re-mounts in new location    │                        │
✓ SyncIndicator updates (status = 'B')    │                        │
```

**Performance Note**: The `forceDragStyle` opaque background (instead of `backdrop-blur`) reduces GPU load by 3x during drag.

---

## 3. Profile Sync & Save Flow

```
┌─ UI: PlayerCard ────────┐  ┌─ Mutation Logic ────────┐  ┌─ Persistence ─────┐
│ SyncIndicator           │  │ usePlayerQueue          │  │ SecureStorage      │
└──────────────────────────┘  └─────────────────────────┘  └────────────────────┘
                 │                        │                        │
Initial State:                            │                        │
Player: { name: "João", skill: 3 }        │                        │
Profile: { name: "João Silva", ... }      │                        │
                 │                        │                        │
Match check:                              │                        │
"João" !== "João Silva"? 🟡 DESYNCED      │                        │
                 │                        │                        │
(1) SyncIndicator shows 🟡 + Save button  │                        │
                 │                        │                        │
User edits player name                    │                        │
onUpdatePlayerName(playerId, "J Silva")   │                        │
  Player now: { name: "J Silva", ... }    │                        │
  Profile still: { name: "João Silva" }   │                        │
  Still desynced!                         │                        │
                 │                        │                        │
(2) User clicks Save button               │                        │
                 │                        │                        │
    onSaveProfile(playerId)──────────────>│                        │
                 │                        │ (3) saveProfile()       │
                 │                        │ ├─ Get player by ID     │
                 │                        │ ├─ Get profile by ID    │
                 │                        │ ├─ Sync:                │
                 │                        │ │   profile.name =      │
                 │                        │ │     "J Silva"         │
                 │                        │ │   profile.skillLevel =│
                 │                        │ │     player.skillLevel │
                 │                        │ └─ Persist to Zustand  │
                 │                        │                        │
                 │                        ├────> SecureStorage    │
                 │                        │      Save profile     │
                 │                        │      batch            │
                 │                        │ <────────────────────>│
                 │                        │      Persisted ✓      │
                 │                        │                        │
    (4) React re-render                   │                        │
    SyncIndicator recalculates:           │                        │
    "J Silva" === "J Silva" ✓             │                        │
    skillLevel === skillLevel ✓           │                        │
    Shows 🟢 SYNCED                       │                        │
                 │                        │                        │
End State:                                │                        │
✓ Player and Profile aligned              │                        │
✓ Both persisted to storage               │                        │
✓ Ready for match replay/export           │                        │
```

**Data Integrity**: The profile is the "source of truth". Players are snapshots that can diverge, but SaveProfile keeps them in sync.

---

## 4. Batch Import Flow (Generate Teams)

```
┌─ UI: BatchInputSection ─┐  ┌─ balanceUtils ──────────┐  ┌─ Game State ────────┐
│ Textarea + Generate btn │  │ distributeStandard()    │  │ usePlayerQueue      │
└──────────────────────────┘  └─────────────────────────┘  └─────────────────────┘
                 │                        │                        │
User pastes names (one per line):         │                        │
  João                                    │                        │
  Maria                                   │                        │
  Carlos                                  │                        │
                 │                        │                        │
(1) handleGenerate()                      │                        │
    Split by '\n'                         │                        │
    Trim & filter empty                   │                        │
    names = ["João", "Maria", "Carlos"]   │                        │
                 │                        │                        │
    props.onGenerate(names)───────────────────────────────────────>│
                 │                        │        │               │
                 │                        │        (2) generateTeams()
                 │                        │        ├─ Clear courtA │
                 │                        │        ├─ Clear courtB │
                 │                        │        ├─ Clear queue  │
                 │                        │                        │
                 │                        │        For each name:  │
                 │                        │        ├─ Check if     │
                 │                        │        │  profile      │
                 │                        │        │  exists       │
                 │                        │        │  (by name)    │
                 │                        │        │               │
                 │                        │        │  If exists:   │
                 │                        │        │    Use it     │
                 │                        │        │               │
                 │                        │        │  If NOT:      │
                 │                        │        │    Create     │
                 │                        │        │    profile    │
                 │                        │        │    sync here! │
                 │                        │        │               │
    ┌──────────────────────────────────────────────┐               │
    │ profiles[] = [profile1, profile2, profile3]  │               │
    │ Each now has:                                │               │
    │   - name: "João", "Maria", "Carlos"          │               │
    │   - skillLevel: 3 (default)                  │               │
    │   - id: UUID                                 │               │
    │   - createdAt: timestamp                     │               │
    └──────────────────────────────────────────────┘               │
                 │                        │                        │
                 │                        │        (3) Create      │
                 │                        │        players linked  │
                 │                        │        to profiles     │
                 │                        │        each:           │
                 │                        │        {               │
                 │                        │          name,         │
                 │                        │          profileId,    │
                 │                        │          skillLevel    │
                 │                        │        }               │
                 │                        │        ├─ João → A     │
                 │                        │        ├─ Maria → A    │
                 │                        │        └─ Carlos → B   │
                 │                        │        (or use balance │
                 │                        │         algorithm)     │
                 │                        │                        │
                 │                        │        (4) Persist all │
                 │                        │        ├─ profiles to  │
                 │                        │        │  Zustand      │
                 │                        │        ├─ players to   │
                 │                        │        │  team state   │
                 │                        │        └─ Sync to FS   │
                 │                        │                        │
    (5) React re-render                   │                        │
    Modal switches to 'roster' tab        │                        │
    courtA shows 2 players                │                        │
    courtB shows 1 player                 │                        │
    All with 🟢 Synced indicators         │                        │
                 │                        │                        │
End State:                                │                        │
✓ 3 new profiles created                 │                        │
✓ 3 players distributed to teams         │                        │
✓ All linked to master profiles          │                        │
✓ Ready to play or further customize     │                        │
```

**Batch Workflow**: Profiles created first → Players created and linked → All persisted atomically.

---

## 5. Rotation & Balance Flow

```
┌─ UI Controls ───────────┐  ┌─ Algorithm ────────────┐  ┌─ State Update ──────┐
│ Mode buttons            │  │ balanceUtils.ts        │  │ usePlayerQueue      │
│ Global Balance button   │  │ balanceTeamsSnake()    │  │ setRotationMode()   │
└──────────────────────────┘  └─────────────────────────┘  └─────────────────────┘
                 │                        │                        │
User clicks [BALANCED] toggle             │                        │
                 │                        │                        │
(1) onSetRotationMode('balanced')        │                        │
                 │                        │                        │
                 │───────────────────────────────────────────────>│
                 │                        │        (2) setRotationMode()
                 │                        │        state.rotationMode =
                 │                        │        'balanced'
                 │                        │        Re-render all
                 │                        │        TeamColumn headers
                 │                        │                        │
UI shows [BALANCED] button selected       │                        │
Global Balance button text changes:       │                        │
"Restore Order" → "Global Balance"        │                        │
                 │                        │                        │
User clicks [GLOBAL BALANCE]              │                        │
                 │                        │                        │
(3) onBalanceTeams()                     │                        │
                 │                        │                        │
    If rotationMode === 'balanced':       │                        │
                 │                        │                        │
    ├─> balanceTeamsSnake()───────────────>│ HEAVY CALCULATION     │
    │   ├─ Read: courtA, courtB, queue    │ │ Distribute players  │
    │   ├─ Calculate team strength        │ │ snake pattern       │
    │   ├─ Rebalance teams (diff)         │ │                     │
    │   ├─ Rotate players                 │ │                     │
    │   └─ Return new court config        │ │                     │
    │   <────────────────────────────────<┤ │                     │
                 │   Result:              │                        │
                 │   {                   │                        │
                 │     courtA: [P1, P4]  │                        │
                 │     courtB: [P2, P3]  │                        │
                 │     queue: []          │                        │
                 │   }                   │                        │
                 │                        │                        │
                 │────────────────────────────────────────────────>│
                 │                        │        (4) setState()  │
                 │                        │        Apply new dist. │
                 │                        │        Persist to FS   │
                 │                        │                        │
(5) React re-render                       │                        │
    All TeamColumn children update        │                        │
    PlayerCard list refreshes             │                        │
    Star badges recalculate               │                        │
    (if strength distribution changed)    │                        │
                 │                        │                        │
End State:                                │                        │
✓ Teams rebalanced evenly                 │                        │
✓ State persisted                         │                        │
✓ Ready for next rotation                 │                        │
```

**Heavy Lifting**: `balanceTeamsSnake()` is computationally expensive but async-safe (returns new state, doesn't mutate).

---

## 6. Color Theme Resolution (Chameleon Effect)

```
┌─ TeamColumn Props ──┐  ┌─ colors.ts ────────────┐  ┌─ Tailwind Classes ──┐
│ team.color          │  │ resolveTheme()         │  │ Applied to DOM      │
│ (e.g., 'indigo')    │  │ TEAM_COLORS map        │  │                     │
└──────────────────────┘  └────────────────────────┘  └─────────────────────┘
                 │                   │                        │
TeamColumn render with color          │                        │
"indigo"                              │                        │
                 │                   │                        │
(1) colorConfig = resolveTheme('indigo')                      │
                 │                   │                        │
                 ├──────────────────>│ TEAM_COLORS['indigo'] │
                 │                   │   = {                  │
                 │                   │     solid: "bg-indigo-500"
                 │                   │     bg: "bg-indigo-500/20"
                 │                   │     border: "border-indigo-500/30"
                 │                   │     text: "text-indigo-600"
                 │                   │     textDark: "dark:text-indigo-400"
                 │                   │     ring: "ring-indigo-500"
                 │                   │     halo: "bg-indigo-500"
                 │                   │     gradient: "from-indigo-500/10 to-indigo-300/5"
                 │                   │   }                    │
                 │                   │<─────────────────────>│
                 │                   │                        │
(2) colorConfig = {                   │                        │
      solid: "bg-indigo-500",         │                        │
      ...                             │                        │
    }                                 │                        │
                 │                   │                        │
(3) Apply to classes:                 │                        │
    <div className={`                 │                        │
      ... ${colorConfig.gradient}`    │                        │
    >                                 │                        │
    <button className={               │                        │
      `... ${colorConfig.border}`     │                        │
    >                                 │                        │
                 │                   │                        │
(4) Tailwind compiles:                │                        │
    to CSS:                           │                        │
    .from-indigo-500\/10 { ... }      │                        │
    .border-indigo-500\/30 { ... }    │                        │
                 │                   │                        │
(5) Render result:                     │                        │
    Team card displays with:          │                        │
    ├─ Gradient background (blue)     │                        │
    ├─ Border (blue tint)             │                        │
    ├─ Halo glow (blue)               │                        │
    └─ Text (blue)                    │                        │
                 │                   │                        │
User selects different color:         │                        │
(e.g., from ColorPicker 'rose')       │                        │
                 │                   │                        │
onUpdateTeamColor(id, 'rose')         │                        │
  ├─ courtA.color = 'rose'            │                        │
  └─ Re-render TeamColumn             │                        │
                 │                   │                        │
(6) New colorConfig = resolveTheme('rose')                    │
                 │                   │                        │
                 ├──────────────────>│ TEAM_COLORS['rose']   │
                 │                   │   = { ... red/pink }  │
                 │                   │<─────────────────────>│
                 │                   │                        │
(7) Entire team card updates:         │                        │
    Gradient → Pink                   │                        │
    Border → Pink                     │                        │
    Halo → Pink                       │                        │
    [Smooth Framer Motion transition] │                        │
                 │                   │                        │
End State:                            │                        │
✓ Color applied dynamically           │                        │
✓ All variants (solid, bg, border,    │                        │
  text, gradient, ring, halo) sync    │                        │
✓ Ready for screenshot/export         │                        │
```

**Design Pattern**: The `resolveTheme()` function is the single source of truth for all color variants, ensuring consistency.

---

## 7. i18n (Internationalization) Flow

```
┌─ Component ─────────────┐  ┌─ LanguageContext ──────┐  ┌─ JSON Files ────────┐
│ TeamManagerModal        │  │ useTranslation hook     │  │ public/locales/     │
│                         │  │                         │  │   en.json           │
│ (or any sub-component)  │  │                         │  │   pt.json           │
└──────────────────────────┘  └────────────────────────┘  └─────────────────────┘
                 │                   │                        │
Component mounts                      │                        │
                 │                   │                        │
(1) useTranslation()                  │                        │
                 │                   │                        │
                 ├──────────────────>│ Get current language    │
                 │                   │ (from localStorage or   │
                 │                   │  browser detection)     │
                 │                   │                        │
                 │                   ├─> Load locale file     │
                 │                   │                        │
                 │                   ├────────────────────────>│
                 │                   │  Fetch locale JSON      │
                 │                   │<────────────────────────┤
                 │                   │  {                      │
                 │                   │    "teamManager": {     │
                 │                   │      "title": "...",    │
                 │                   │      "tabs": {          │
                 │                   │        "roster": "..."  │
                 │                   │      }                  │
                 │                   │    }                    │
                 │                   │  }                      │
                 │                   │                        │
                 │<──────────────────┤ Return t() function    │
                 │                   │ with JSON data cache    │
                 │                   │                        │
(2) Render:                           │                        │
    <span>                            │                        │
      {t('teamManager.title')}        │                        │
    </span>                           │                        │
                 │                   │                        │
    t() lookup:                       │                        │
    "teamManager" → "title" →         │                        │
    en.json["teamManager"]["title"]   │                        │
                 │                   │                        │
    Returns: "Squad Manager"          │                        │
    (in English)                      │                        │
                 │                   │                        │
(3) Render output:                    │                        │
    <span>Squad Manager</span>        │                        │
                 │                   │                        │
                 │                   │                        │
User changes language (in Settings)   │                        │
  localStorage.setItem('volleyscore-lang', 'pt')              │
                 │                   │                        │
(4) Context re-renders                │                        │
    useTranslation() gets new lang    │                        │
                 │                   │                        │
                 ├──────────────────>│ Load pt.json            │
                 │                   │                        │
                 │                   ├────────────────────────>│
                 │                   │  Load Portuguese        │
                 │                   │<────────────────────────┤
                 │                   │  {                      │
                 │                   │    "teamManager": {     │
                 │                   │      "title":           │
                 │                   │        "Gestor de Elenco"
                 │                   │    }                    │
                 │                   │  }                      │
                 │                   │                        │
(5) Component re-renders:             │                        │
    t('teamManager.title') → returns  │                        │
    "Gestor de Elenco"                │                        │
                 │                   │                        │
    <span>Gestor de Elenco</span>     │                        │
                 │                   │                        │
End State:                            │                        │
✓ Modal text in Portuguese            │                        │
✓ All nested i18n keys updated        │                        │
✓ No page reload required             │                        │
✓ User preference persisted           │                        │
```

**Key Pattern**: Translation keys are nested dot-notation (`"teamManager.title"`), enabling tree-structured organization in JSON files.

---

## 8. Performance Monitoring Checklist

### Render Optimization Verifications:

```typescript
// ✅ All sub-components wrapped in React.memo
PlayerCard = memo(..., customComparator)
SkillSelector = memo(...)
TeamColumn = memo(...)

// ✅ All callbacks stabilized with useCallback
const handleAddA = useCallback((n, num, s) => ..., [deps])

// ✅ Expensive calculations memoized
const teamStrength = useMemo(() => calculateTeamStrength(...), [deps])

// ✅ Drag overlay uses opaque colors (not backdrop-blur)
forceDragStyle ? bg-slate-100 : ... // GPU-friendly

// ✅ Batch input separated from main modal
BatchInputSection = memo(...) // Prevents keystroke re-renders
```

### Performance Testing:

```bash
# Check bundle size
npm run build
# Output: TeamManagerModal-XXX.js chunk size

# Profile in Chrome DevTools:
# 1. Open Chrome DevTools (F12)
# 2. Go to "Performance" tab
# 3. Click record
# 4. Drag a player between teams
# 5. Stop recording
# Expected: No red frames (60 FPS consistent)

# Check React re-renders (React DevTools):
# 1. Install "React DevTools" extension
# 2. Open Component tree
# 3. Check "Highlight re-renders" option
# 4. Perform action (e.g., add player)
# Expected: Only affected components flash (not entire Modal)
```

---

**Document Version**: 1.0  
**Last Updated**: December 8, 2025  
**Next Review**: When adding new data flows or refactoring critical paths
