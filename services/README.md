# 🔌 Native Services Layer

This directory contains **service wrappers** for all Capacitor native plugins used in the VolleyScore Pro v2 app.

## 📋 Purpose

Services provide:
1. **Type-safe abstractions** over Capacitor plugins
2. **Graceful fallbacks** for unsupported platforms
3. **Consistent error handling** without crashing the app
4. **Lazy-loading** to avoid build errors on missing plugins

---

## 🛡 Design Principles

Every service MUST follow these principles:

### 1. **Platform Detection**
```typescript
const isAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};
```

### 2. **Lazy Plugin Loading**
```typescript
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
```

### 3. **Fallback Strategy**
```typescript
if (plugin) {
  // Native implementation
} else {
  // Web API fallback or silent no-op
}
```

---

## 📦 Available Services

### **NativeHaptics.ts**
Provides native haptic feedback for iOS and Android.

**Plugin**: `@capacitor/haptics`  
**Status**: ⚠️ Needs installation (`npm install @capacitor/haptics`)

**Methods**:
- `impact(style: ImpactStyle)` - Touch feedback (light/medium/heavy)
- `notification(type: NotificationType)` - Event feedback (success/warning/error)
- `vibrate(pattern)` - Custom vibration pattern

**Fallback**: `navigator.vibrate()` API

**Example**:
```typescript
import { NativeHaptics, ImpactStyle } from '@/services/NativeHaptics';

await NativeHaptics.impact(ImpactStyle.Light);
await NativeHaptics.notification(NotificationType.Success);
```

---

### **SecureStorage.ts**
Secure localStorage wrapper with SHA-256 integrity checks.

**Plugin**: Native Web Crypto API  
**Status**: ✅ Implemented

**Methods**:
- `save<T>(key, data)` - Save with integrity hash
- `load<T>(key)` - Load and verify integrity
- `remove(key)` - Remove item

**Security**:
- Prevents data tampering with SHA-256 hashing
- Graceful degradation in insecure contexts (HTTP)
- Automatic corruption recovery

**Example**:
```typescript
import { SecureStorage } from '@/services/SecureStorage';

await SecureStorage.save('user_data', { name: 'John' });
const data = await SecureStorage.load<UserData>('user_data');
```

---

### **io.ts**
Legacy I/O utilities (to be migrated to dedicated services).

**Status**: 🔄 Refactoring needed

---

## 🚀 Adding a New Service

Follow this template:

```typescript
/**
 * ServiceName Service
 * Brief description of what it does.
 * 
 * @module services/ServiceName
 * @requires @capacitor/plugin-name
 */

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
    console.warn('ServiceName: Plugin unavailable', error);
    return null;
  }
};

export const ServiceName = {
  async doSomething(params: Params): Promise<Result> {
    const plugin = await getPlugin();
    
    if (plugin) {
      try {
        return await plugin.action(params);
      } catch (error) {
        console.warn('ServiceName.doSomething failed:', error);
        // Fallback logic here
      }
    }
    
    // Web fallback
    return fallbackImplementation(params);
  },
};
```

### Steps:
1. Create new file in `services/`
2. Install required Capacitor plugin
3. Implement service wrapper with fallback
4. Run `npx cap sync`
5. Test on both Android and iOS

---

## ⚠️ Common Pitfalls

### ❌ DON'T: Import plugins directly in components
```tsx
import { Haptics } from '@capacitor/haptics'; // BAD!

const MyComponent = () => {
  const handleClick = () => {
    Haptics.impact({ style: ImpactStyle.Light }); // Will crash on web
  };
};
```

### ✅ DO: Use services with fallbacks
```tsx
import { NativeHaptics, ImpactStyle } from '@/services/NativeHaptics'; // GOOD!

const MyComponent = () => {
  const handleClick = () => {
    NativeHaptics.impact(ImpactStyle.Light); // Safe on all platforms
  };
};
```

---

## 🔄 Sync Requirements

After installing/updating any Capacitor plugin:

```bash
npx cap sync
```

This command:
- Copies the build to `android/` and `ios/`
- Installs/updates native dependencies
- Configures permissions in native manifests

---

## 📚 Further Reading

- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Plugin Development Guide](https://capacitorjs.com/docs/plugins/creating-plugins)
- [iOS Capabilities](https://capacitorjs.com/docs/ios/configuration)
- [Android Permissions](https://capacitorjs.com/docs/android/configuration)
