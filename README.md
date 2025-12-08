<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VolleyScore Pro v2 🏐

**Professional volleyball scoring system for Android and iOS**

A mobile-native application built with React, TypeScript, and Capacitor for real-time volleyball match scoring with advanced features like player statistics, voice control, and native haptic feedback.

---

## 🌟 Features

- ✅ **Native Mobile App** - 100% native for iOS and Android
- ⚡ **Real-time Scoring** - Instant score updates with haptic feedback
- 📊 **Player Statistics** - Track attacks, blocks, aces, and errors
- 🎙️ **Voice Control** - Score matches hands-free
- 🎨 **Modern UI** - Glass-morphism design with dark mode
- 🔄 **Team Management** - Auto-balancing and rotation system
- 📱 **Safe Areas** - Full support for notch/dynamic island
- 🎯 **TypeScript Strict** - Type-safe codebase
- 💾 **Secure Storage** - Tamper-proof data persistence
- 🌐 **Multi-language** - English and Portuguese

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- For Android: Android Studio
- For iOS: Xcode (macOS only)

### Installation

```bash
# Clone the repository
git clone https://github.com/lmms500/VolleyScore-Pro-v2.git
cd VolleyScore-Pro-v2

# Install dependencies
npm install

# Build the web app
npm run build

# Sync with native platforms
npx cap sync
```

### Development

```bash
# Web preview (quick iteration)
npm run dev

# Android
npx cap open android

# iOS
npx cap open ios
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Native-first architecture principles
- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide
- **[WORKFLOW.md](WORKFLOW.md)** - Development workflow and best practices
- **[services/README.md](services/README.md)** - Native services documentation

---

## 🏗 Architecture

This app follows a **mobile-native architecture** with strict separation of concerns:

```
hooks/       → Business logic and game rules
components/  → Pure UI components
services/    → Native plugin wrappers with fallbacks
stores/      → Zustand state management
contexts/    → Global settings (theme, language)
```

### Key Technologies

- **React** - UI framework
- **TypeScript** (strict mode) - Type safety
- **Capacitor** - Native bridge for iOS/Android
- **Framer Motion** - Performant animations
- **Zustand** - State management
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool

---

## 🔌 Native Capabilities

| Feature | Plugin | Status |
|---------|--------|--------|
| Haptic Feedback | `@capacitor/haptics` | ✅ |
| File Sharing | `@capacitor/share` | ✅ |
| Screen Orientation | `@capacitor/screen-orientation` | ✅ |
| Status Bar | `@capacitor/status-bar` | ✅ |
| Voice Control | `@capacitor-community/speech-recognition` | ✅ |
| Secure Storage | Native Web Crypto | ✅ |

---

## 🎯 Performance

- **60fps** animations using GPU-accelerated transforms
- **Minimal re-renders** with React.memo and memoization
- **Lazy-loaded plugins** to avoid bundle bloat
- **Optimized images** and assets
- **Service Worker** for offline capabilities (web)

---

## 🧪 Testing

```bash
# TypeScript compilation
npm run build

# Linting
npm run lint

# Test on Android device
npm run build && npx cap sync android && npx cap open android

# Test on iOS device
npm run build && npx cap sync ios && npx cap open ios
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Follow the **mobile-native architecture** principles in `ARCHITECTURE.md`
2. Use **TypeScript strict mode** (no `any`)
3. Wrap native plugins in `services/` with fallbacks
4. Test on both iOS and Android before submitting PR
5. Update documentation if needed

---

## 📄 License

[Add your license here]

---

## 🙏 Acknowledgments

Built with ❤️ for the volleyball community.

Special thanks to:
- Capacitor team for the amazing native bridge
- React and TypeScript communities
- All contributors and testers

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/lmms500/VolleyScore-Pro-v2/issues)
- **Documentation**: See `/docs` folder
- **Capacitor Docs**: [capacitorjs.com](https://capacitorjs.com)

---

**Made with React ⚛️ + Capacitor ⚡ + TypeScript 📘**
