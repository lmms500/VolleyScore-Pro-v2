# TeamManagerModal - Troubleshooting & Common Issues

**Quick Reference for Debugging the Most Complex Component**

---

## Issue #1: Player Not Appearing After "Add"

### Symptoms:
- User clicks "Add Player", enters name, clicks "+", form closes
- **BUT**: Player doesn't appear in the team roster

### Root Causes & Fixes:

#### Cause 1A: Profile creation failed (async race condition)
**Diagnostic**:
```typescript
// Check: Is upsertProfile() being called INSIDE setQueueState()?
// In usePlayerQueue.addPlayer():

❌ WRONG:
const profile = upsertProfile(name, skill); // Outside setQueueState
setQueueState(prev => {
  const player = createPlayer(name, ..., profile, ...);
  // Profile might not exist yet!
  return {...}
});

✅ CORRECT:
setQueueState(prev => {
  const profile = upsertProfile(name, skill); // INSIDE setQueueState
  const player = createPlayer(name, ..., profile, ...);
  return {...}
});
```

**Fix**: Move `upsertProfile()` call inside `setQueueState()` callback.

#### Cause 1B: Player array not updated
**Diagnostic**:
```bash
# Open Chrome DevTools Console
# Type:
JSON.stringify(window.gameState.courtA.players, null, 2)
# Should show the new player

# If empty or doesn't include new player:
# Check if setQueueState() is actually being called
```

**Fix**: Verify `setQueueState()` is receiving new state with updated `players` array.

#### Cause 1C: Component not re-rendering
**Diagnostic**:
```bash
# Open React DevTools → Components tab
# Find TeamManagerModal
# Check "Highlight re-renders" (checkbox)
# Add a player
# Does TeamColumn flash?

# If NO re-render:
# - onAddPlayer prop might be stale (closure issue)
# - Modal is not re-rendering (parent issue)
```

**Fix**: Ensure `onAddPlayer` is memoized with correct dependencies in App.tsx.

#### Cause 1D: Name sanitization breaking input
**Diagnostic**:
```typescript
// In usePlayerQueue.addPlayer():
const safeName = sanitizeInput(name);

// Check if sanitizeInput() is too aggressive
// e.g., removing accents ("João" → "Jo")
```

**Fix**: Review `utils/security.ts` → `sanitizeInput()` function. May need to whitelist accented characters.

---

## Issue #2: Drag & Drop Not Working

### Symptoms:
- Click on player grip (GripVertical icon)
- Drag across screen
- **BUT**: Nothing happens, player doesn't move

### Root Causes & Fixes:

#### Cause 2A: DndContext not wrapping content
**Diagnostic**:
```tsx
// Check TeamManagerModal render structure:
// Should be:

<DndContext sensors={sensors} onDragStart={...} onDragOver={...} onDragEnd={...}>
  <div className="grid ...">
    <TeamColumn id="A" ... />  {/* ✅ Inside DndContext */}
    <TeamColumn id="B" ... />
  </div>
</DndContext>

// If DndContext wraps nothing or wraps only one column:
// ❌ Drag between teams won't work
```

**Fix**: Ensure `<DndContext>` wraps ALL columns (A, B, and queue).

#### Cause 2B: SortableContext not wrapping players
**Diagnostic**:
```tsx
// Inside TeamColumn:

❌ WRONG:
<div>
  {team.players.map(p => <PlayerCard {...} />)}
</div>

✅ CORRECT:
<SortableContext items={team.players.map(p => p.id)} strategy={verticalListSortingStrategy}>
  {team.players.map(p => <PlayerCard {...} />)}
</SortableContext>
```

**Fix**: Wrap player list in `<SortableContext>` with correct `items` array.

#### Cause 2C: PlayerCard useSortable() not called
**Diagnostic**:
```bash
# In Chrome DevTools Console:
# (assuming React DevTools installed)
# Click PlayerCard component
# Check if it's using useSortable() hook

# If error "useSortable() called outside SortableContext":
# → SortableContext not wrapping this player
```

**Fix**: Ensure PlayerCard is a direct child of SortableContext.

#### Cause 2D: Player has isFixed = true
**Diagnostic**:
```typescript
// In PlayerCard:
const { useSortable, ... } = useSortable({
  id: player.id,
  disabled: player.isFixed,  // ← If true, drag disabled
  ...
});

// Check: Is player.isFixed = true?
// If yes: User must click the Pin icon to unlock first
```

**Fix**: Verify player is not locked (Pin icon should not be filled).

#### Cause 2E: Sensors not configured correctly
**Diagnostic**:
```typescript
// In TeamManagerModal:
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,  // ← If too high, drag won't trigger
    },
  }),
  useSensor(KeyboardSensor),
  useSensor(TouchSensor)
);

// If distance: 5 feels unresponsive, lower to 3
```

**Fix**: Adjust `distance` in PointerSensor activation constraint (lower = more sensitive).

---

## Issue #3: Profile Sync Shows Wrong Status

### Symptoms:
- Player: name="João", skill=3
- Profile: name="João", skill=3
- SyncIndicator shows 🟡 DESYNCED or ⚪ UNLINKED (should be 🟢 SYNCED)

### Root Causes & Fixes:

#### Cause 3A: profileId missing
**Diagnostic**:
```typescript
// In SyncIndicator:
const hasProfile = !!profile;
// If `profiles.get(player.profileId)` returns undefined:
// ❌ hasProfile = false → shows ⚪ UNLINKED

// Check: Does player.profileId exist?
player = { name: "João", skill: 3, profileId: ??? }
```

**Fix**: Ensure `addPlayer()` in usePlayerQueue creates profile SYNC and links it.

#### Cause 3B: profileId points to wrong profile
**Diagnostic**:
```bash
# Check if profileId UUID matches:
player.profileId = "abc123"
profiles.get("abc123") = { name: "Maria", skill: 4 }
# ❌ Names don't match!
```

**Fix**: In batch import, verify `generateTeams()` creates profiles and passes correct IDs to players.

#### Cause 3C: Name or skill mismatch
**Diagnostic**:
```typescript
// In SyncIndicator:
const profileMatch = hasProfile && profile!.name === player.name && profile!.skillLevel === player.skillLevel;

// If user edited player name but didn't save profile:
player.name = "João Silva" (edited inline)
profile.name = "João" (not saved)
// ❌ Strings don't match → shows 🟡 DESYNCED (correct!)

// User clicks Save → onSaveProfile()
// This should sync: profile.name = "João Silva"
```

**Fix**: User must click the Save button (💾 icon) to sync profile after editing.

#### Cause 3D: Profile deleted but player remains
**Diagnostic**:
```typescript
// If deleteProfile() was called but player still references it:
player.profileId = "abc123"
profiles.get("abc123") = undefined
// ❌ hasProfile = false → shows ⚪ UNLINKED

// Player is "orphaned" (no master profile)
```

**Fix**: When deleting a profile, also remove all players linked to it, OR revert deletion immediately (undo window).

---

## Issue #4: Color Picker Not Working

### Symptoms:
- Click on color circle
- **BUT**: Color doesn't change, or button appears disabled

### Root Causes & Fixes:

#### Cause 4A: Color already taken by another team
**Diagnostic**:
```typescript
// In ColorPicker:
const isTaken = usedColors.has(color) && !isSelected;

// usedColors should contain colors from:
// - courtA.color
// - courtB.color
// - queue[].color for each queue team

// If color shows as disabled (opacity-20):
// → Another team has that color

// Check usedColors:
console.log(Array.from(usedColors));
// Should show: ["indigo", "rose", ...]
```

**Fix**: User must first change the OTHER team's color, then this button will enable.

#### Cause 4B: onClick not firing
**Diagnostic**:
```tsx
// Check if button is disabled in TypeScript/HTML:
<button
  onClick={() => !isTaken && onChange(color)}
  disabled={isTaken}  // ← If true, onClick won't fire
  className={...}
>
```

**Fix**: Ensure `isTaken` is false. If truly false but still not working, check parent `onPointerDown` handler.

#### Cause 4C: onChange callback not defined
**Diagnostic**:
```typescript
// In ColorPicker:
const handleUpdateColor = useCallback((c: TeamColor) => onUpdateTeamColor(id, c), [onUpdateTeamColor, id]);

// If onChange callback is undefined:
// ❌ Color change silently fails
```

**Fix**: In TeamColumn, verify `handleUpdateColor` is properly memoized and passed to ColorPicker.

#### Cause 4D: Theme config doesn't match color
**Diagnostic**:
```typescript
// After color changes, check utils/colors.ts:
const TEAM_COLORS = {
  'indigo': { solid: 'bg-indigo-500', ... },
  'rose': { solid: 'bg-rose-500', ... },
  // ... all 8 colors
};

// If a color is missing from TEAM_COLORS:
// ❌ resolveTheme() returns undefined
```

**Fix**: Ensure new color is defined in `TEAM_COLORS` map.

---

## Issue #5: Batch Import Not Working

### Symptoms:
- Paste names in textarea
- Click [Shuffle Generate Teams]
- **BUT**: Nothing happens OR cryptic error

### Root Causes & Fixes:

#### Cause 5A: Empty textarea
**Diagnostic**:
```typescript
// In BatchInputSection:
const names = rawNames.split('\n').map(n => n.trim()).filter(n => n);
if (names.length > 0) {
  onGenerate(names);
} else {
  // ❌ Silent failure if names.length === 0
}
```

**Fix**: Ensure at least 1 non-empty line in textarea.

#### Cause 5B: Newline format issue
**Diagnostic**:
```bash
# If pasted on Windows:
# May have \r\n (CRLF) instead of \n (LF)

# Test in console:
const text = "João\r\nMaria\r\nCarlos";
const names = text.split('\n').map(n => n.trim()).filter(n => n);
// Result: ["João\r", "Maria\r", "Carlos"]
// ❌ Names have trailing \r!
```

**Fix**: In BatchInputSection, use: `split(/\r?\n/)` to handle both LF and CRLF.

#### Cause 5C: onGenerate not calling usePlayerQueue
**Diagnostic**:
```typescript
// handleGenerate callback:
const handleGenerate = useCallback((names: string[]) => {
  props.onGenerate(names);  // ← Must call hook action
  setActiveTab('roster');
}, [props.onGenerate]);

// If props.onGenerate is undefined:
// ❌ No-op
```

**Fix**: Ensure `onGenerate` prop is passed from App.tsx (from useVolleyGame hook).

#### Cause 5D: Profiles not created for batch
**Diagnostic**:
```typescript
// In usePlayerQueue.generateTeams():
// CRITICAL: Must create profiles BEFORE creating players

❌ WRONG:
const players = names.map(name => createPlayer(name, ...));

✅ CORRECT:
const profiles = names.map(name => 
  profiles.has(name) ? profiles.get(name) : upsertProfile(name, 3)
);
const players = names.map((name, idx) => 
  createPlayer(name, ..., profiles[idx].id, ...)
);
```

**Fix**: Ensure `generateTeams()` creates profiles synchronously before creating players.

---

## Issue #6: Translations Missing or Incorrect

### Symptoms:
- Some text shows "undefined" or "teamManager.title"
- Language changes but some text doesn't update

### Root Causes & Fixes:

#### Cause 6A: Translation key doesn't exist
**Diagnostic**:
```bash
# Check public/locales/en.json for key:
grep -r "teamManager.addPlayerPlaceholder" public/locales/

# If not found: key is missing from JSON files
```

**Fix**: Add the key to all 3 locale files:
- `public/locales/en.json`
- `public/locales/pt.json`
- `public/locales/es.json`

Example:
```json
{
  "teamManager": {
    "addPlayerPlaceholder": "Enter player name..."
  }
}
```

#### Cause 6B: useTranslation() hook used incorrectly
**Diagnostic**:
```tsx
// ❌ WRONG (called in sub-component without context):
const Component = () => {
  const { t } = useTranslation(); // May return stale context
  return <span>{t('key')}</span>;
};

// ✅ CORRECT (called inside component):
const Component = () => {
  const { t } = useTranslation(); // Fresh on each render
  return <span>{t('key')}</span>;
};
```

**Fix**: Ensure `useTranslation()` is called at component root level, not in callbacks.

#### Cause 6C: Language not persisting
**Diagnostic**:
```bash
# Check localStorage:
localStorage.getItem('volleyscore-lang')
# Should return: 'en' or 'pt' or 'es'

# If undefined:
# ❌ Language preference not saved
```

**Fix**: Ensure LanguageContext saves to localStorage on `setLanguage()`.

#### Cause 6D: Nested key path wrong
**Diagnostic**:
```typescript
// Keys use dot notation:
t('teamManager.tabs.roster') // ✅ Correct

// If you write:
t('teamManagerTabsRoster') // ❌ Wrong (no dots)

// Check JSON structure:
{
  "teamManager": {
    "tabs": {
      "roster": "Roster"
    }
  }
}
```

**Fix**: Use correct dot-notation path matching JSON nesting.

---

## Issue #7: Modal Stuck Closed or Won't Close

### Symptoms:
- Modal `isOpen` appears true but not visible
- OR: Click [X] but modal doesn't close
- OR: Clicking backdrop doesn't close

### Root Causes & Fixes:

#### Cause 7A: isOpen prop not changing
**Diagnostic**:
```typescript
// In App.tsx, check if isOpen state updates:
const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

// Button to open:
<button onClick={() => setIsTeamManagerOpen(true)}>
  Manage Squad
</button>

// If button doesn't work:
// → onClick handler broken or not attached
```

**Fix**: Verify button has `onClick` handler that actually calls `setIsTeamManagerOpen(true)`.

#### Cause 7B: onClose callback undefined
**Diagnostic**:
```tsx
// In Modal:
<button onClick={onClose}>[X]</button>

// If onClose is undefined:
// ❌ Click does nothing
```

**Fix**: Ensure `onClose` prop is passed from App.tsx.

#### Cause 7C: z-index too high (stuck on top)
**Diagnostic**:
```bash
# Open Chrome DevTools Inspector
# Select modal backdrop element
# Check computed z-index

# If z-index is 9999:
# ❌ Might be stuck above everything else
```

**Fix**: Check Modal component z-index in `components/ui/Modal.tsx`. Should be reasonable (e.g., 40-50).

#### Cause 7D: Backdrop click not propagating
**Diagnostic**:
```tsx
// In Modal.tsx backdrop:
<div
  className="... fixed inset-0 ..."
  onClick={onClose}  // ← Must be on backdrop, not on content
>
  <div
    className="... relative ..."
    onClick={(e) => e.stopPropagation()}  // ← Prevent close when clicking content
  >
    {/* Modal content */}
  </div>
</div>
```

**Fix**: Ensure backdrop onClick handler is on outer div, and content stops propagation.

---

## Issue #8: Performance Lag During Drag

### Symptoms:
- Dragging a player is slow/stuttering
- FPS drops to 20-30 while dragging
- Desktop: smooth, Mobile: very laggy

### Root Causes & Fixes:

#### Cause 8A: Drag overlay using backdrop-blur
**Diagnostic**:
```tsx
// In PlayerCard with forceDragStyle:
❌ WRONG:
const containerClass = forceDragStyle
  ? `bg-slate-100/40 dark:bg-slate-800/40 backdrop-blur-xl ...`
  //                                           ^^^^^^^^^^^^^^
  //                                         Very GPU-expensive!

✅ CORRECT:
const containerClass = forceDragStyle
  ? `bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500 ...`
  //                               No blur = 3x faster
```

**Fix**: Change drag overlay to use opaque `bg-slate-100` instead of `backdrop-blur-xl`.

#### Cause 8B: Too many re-renders during drag
**Diagnostic**:
```bash
# Open React DevTools → Profiler
# Record drag action
# Check which components re-render

# If entire <TeamColumn> re-renders:
# ❌ PlayerCard memo not working correctly
```

**Fix**: Ensure `PlayerCard = memo(..., customComparator)` has correct dependency comparison.

#### Cause 8C: DragOverlay not using Portal
**Diagnostic**:
```tsx
// Should use createPortal:
✅ CORRECT:
{createPortal(
  <DragOverlay>
    {activePlayer ? <PlayerCard {...} forceDragStyle /> : null}
  </DragOverlay>,
  document.body  // ← Portal to body, not inside Modal
)}
```

**Fix**: Ensure DragOverlay is portaled to `document.body` (outside React tree).

#### Cause 8D: Mobile browser limitations
**Diagnostic**:
```bash
# Safari mobile:
# - Doesn't support backdrop-filter well
# - GPU memory limited
# - JavaScript slower

# Chrome mobile:
# - Better performance
# - Still need opaque colors (not blur)
```

**Fix**: Test on Android/iOS physical device, not emulator. Emulator is often 10x slower.

---

## Quick Checklist: Before Submitting PR

```bash
# 1. Build passes TypeScript
npm run build
# Expected: ✅ 0 errors

# 2. No console errors in browser
# Open DevTools Console while using Modal
# Should see no [ERROR] messages

# 3. Drag & drop works
# - Drag player from A to B
# - Drag from queue to A
# - Verify player position changes

# 4. Add player works
# - Fill name, click [+]
# - Verify player appears
# - Verify 🟢 Synced indicator shows

# 5. Batch import works
# - Paste 3 names in textarea
# - Click [Shuffle Generate]
# - Verify teams populated
# - Modal switches to Roster tab

# 6. Translations show
# - Check all buttons have labels
# - No "undefined" or key names visible
# - Try switching languages in Settings

# 7. Responsive on mobile
# - Test on Android (Capacitor)
# - Test on iOS (if available)
# - No layout issues

# 8. Capacitor synced
npx cap sync android
# Expected: ✅ 9 plugins recognized

# 9. Git status clean
git status
# Expected: Only changed files listed

# 10. Commit message clear
git log --oneline | head -1
# Example: "feat: add team strength calculation to roster view"
```

---

**Document Version**: 1.0  
**Last Updated**: December 8, 2025  
**Maintainer**: AI Lead Engineer  
**Support**: Use ARCHITECTURE_TEAMMANAGER.md for component overview first
