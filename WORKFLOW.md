# 🔄 Native Development Workflow

This guide explains the complete workflow for developing, building, and deploying the VolleyScore Pro v2 native app.

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Sync Capacitor | `npx cap sync` |
| Open Android | `npx cap open android` |
| Open iOS | `npx cap open ios` |
| Lint code | `npm run lint` |

---

## 📱 Development Cycle

### 1. **Code Changes** (Web/TypeScript/React)

Make changes to:
- Components (`components/`)
- Hooks (`hooks/`)
- Services (`services/`)
- Contexts (`contexts/`)

### 2. **Test in Browser** (Quick Iteration)

```bash
npm run dev
```

Open `http://localhost:5173` and test your changes.

**⚠️ Limitations**:
- Native plugins may not work fully
- Safe areas won't be accurate
- Performance won't match native

### 3. **Build Web Bundle**

```bash
npm run build
```

This compiles TypeScript and bundles everything into `dist/`.

### 4. **Sync with Native Platforms**

```bash
npx cap sync
```

**When to run `npx cap sync`**:
- ✅ After installing/updating Capacitor plugins
- ✅ After modifying `capacitor.config.ts`
- ✅ After making changes to native code
- ✅ After building web bundle (`npm run build`)
- ❌ Not needed for pure web code changes in dev mode

### 5. **Test on Native Platform**

#### Android

```bash
npx cap open android
```

In Android Studio:
- Select device/emulator
- Click Run (▶️)
- Test your changes

#### iOS

```bash
npx cap open ios
```

In Xcode:
- Select simulator/device
- Click Run (▶️)
- Test your changes

---

## 🔌 Working with Native Plugins

### Adding a New Plugin

1. **Install the plugin**:
   ```bash
   npm install @capacitor/plugin-name
   ```

2. **Create a service wrapper** in `services/`:
   ```typescript
   // services/PluginName.ts
   import { Capacitor } from '@capacitor/core';

   const isAvailable = (): boolean => {
     return Capacitor.isNativePlatform();
   };

   const getPlugin = async () => {
     if (!isAvailable()) return null;
     
     try {
       const { Plugin } = await import('@capacitor/plugin-name');
       return Plugin;
     } catch (error) {
       console.warn('Plugin unavailable:', error);
       return null;
     }
   };

   export const PluginName = {
     async doSomething(): Promise<void> {
       const plugin = await getPlugin();
       
       if (plugin) {
         try {
           await plugin.action();
         } catch (error) {
           console.warn('Action failed:', error);
         }
       } else {
         // Fallback for web/unsupported platforms
       }
     }
   };
   ```

3. **Sync with native platforms**:
   ```bash
   npx cap sync
   ```

4. **Configure permissions** (if needed):
   
   **Android** (`android/app/src/main/AndroidManifest.xml`):
   ```xml
   <uses-permission android:name="android.permission.PERMISSION_NAME" />
   ```
   
   **iOS** (`ios/App/App/Info.plist`):
   ```xml
   <key>NSPermissionUsageDescription</key>
   <string>We need this permission to...</string>
   ```

5. **Test on both platforms**.

---

## 🎨 UI/UX Development

### Safe Areas (Notch, Dynamic Island, Home Bar)

Always respect safe areas:

```tsx
import { useSafeAreaInsets } from '@/hooks/useSafeAreaInsets';

const MyComponent = () => {
  const { top, bottom } = useSafeAreaInsets();
  
  return (
    <div style={{ paddingTop: top, paddingBottom: bottom }}>
      Content
    </div>
  );
};
```

Or with Tailwind:
```tsx
<div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
  Content
</div>
```

### Touch Targets

Minimum touch target size:
- **iOS**: 44px × 44px
- **Android**: 48px × 48px

```tsx
// ❌ Too small
<button className="p-1">Tap</button>

// ✅ Proper size
<button className="p-3 min-w-[48px] min-h-[48px]">Tap</button>
```

### Performance Optimization

#### Avoid Re-renders

```tsx
// ❌ Bad: Creates new function every render
<Button onClick={() => handleClick(id)} />

// ✅ Good: Memoized callback
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
<Button onClick={handleClick} />
```

#### Memoize Expensive Computations

```tsx
// ❌ Bad: Recalculates every render
const sorted = items.sort((a, b) => b.score - a.score);

// ✅ Good: Memoized
const sorted = useMemo(() => 
  items.sort((a, b) => b.score - a.score)
, [items]);
```

#### Optimize Animations

```tsx
// ❌ Bad: Causes layout reflow
<motion.div animate={{ top: 100, width: 200 }} />

// ✅ Good: GPU-accelerated
<motion.div animate={{ y: 100, scale: 1.2 }} />
```

---

## 🧪 Testing Strategy

### 1. Browser Testing (Quick)

```bash
npm run dev
```

Test logic and UI in Chrome/Safari DevTools.

### 2. iOS Simulator

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Test:
- Safe areas (notch, dynamic island)
- Haptics (requires device)
- Performance
- Gestures

### 3. Android Emulator

```bash
npm run build
npx cap sync android
npx cap open android
```

Test:
- Safe areas (navigation bar)
- Haptics
- Performance
- Different screen sizes

### 4. Physical Devices (Critical)

Always test on real devices before release:
- iOS: iPhone with notch/dynamic island
- Android: Multiple screen sizes and Android versions

---

## 🏗 Build Process

### Development Build

```bash
npm run build
npx cap sync
```

### Production Build

#### Android

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

#### iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
- Product → Archive
- Distribute App → App Store Connect

---

## 🐛 Debugging

### Web Console

In browser DevTools:
- Check for TypeScript errors
- Monitor network requests
- Test service workers

### Android (Logcat)

In Android Studio:
- View → Tool Windows → Logcat
- Filter by app package: `com.volleyscore.pro`

Or via CLI:
```bash
adb logcat | grep VolleyScore
```

### iOS (Console)

In Xcode:
- View → Debug Area → Show Debug Area
- Console shows native logs and JavaScript errors

---

## 📊 Performance Monitoring

### React DevTools

Install React DevTools browser extension:
- Monitor component renders
- Profile performance
- Check props/state

### Profiler

```tsx
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={callback}>
  <MyComponent />
</Profiler>
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] `npm run build` succeeds with no errors
- [ ] `npm run lint` passes
- [ ] TypeScript compiles (`npx tsc`)
- [ ] Tested on iOS device (not just simulator)
- [ ] Tested on Android device (not just emulator)
- [ ] Safe areas work on all devices
- [ ] Haptics work correctly
- [ ] Audio works correctly
- [ ] All permissions requested with explanations
- [ ] App icons and splash screen configured
- [ ] Version number updated in `package.json`
- [ ] Changelog updated
- [ ] No console errors in production build

---

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Performance](https://react.dev/learn/render-and-commit)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://m3.material.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 💡 Best Practices

1. **Always test on real devices** before release
2. **Use TypeScript strict mode** to catch errors early
3. **Wrap native plugins** in services with fallbacks
4. **Respect safe areas** on all screens
5. **Optimize for 60fps** animations
6. **Minimize re-renders** with memoization
7. **Test edge cases** (low battery, airplane mode, etc.)
8. **Handle permissions gracefully** with clear explanations

---

**Happy Coding! 🏐**
