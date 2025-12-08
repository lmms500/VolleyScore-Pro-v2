# 🚀 VolleyScore Pro v2 - Setup & Installation Guide

## 📱 Visão Geral

O **VolleyScore Pro v2** é uma aplicação mobile nativa construída com:
- **React** (UI framework)
- **TypeScript Strict** (type safety)
- **Capacitor** (native bridge para iOS/Android)
- **Vite** (build tool)
- **Tailwind CSS** (styling)

---

## 🛠 Pré-requisitos

### Desenvolvimento Geral
- **Node.js** 18+ (recomendado: 20 LTS)
- **npm** 9+ ou **yarn** 1.22+

### Desenvolvimento Android
- **Android Studio** (Hedgehog 2023.1.1+)
- **Java JDK** 17+
- **Android SDK** (API Level 33+)
- **Gradle** 8.0+

### Desenvolvimento iOS (apenas macOS)
- **Xcode** 15+
- **CocoaPods** 1.12+
- **iOS Simulator** ou dispositivo físico

---

## 📦 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/lmms500/VolleyScore-Pro-v2.git
cd VolleyScore-Pro-v2
```

### 2. Instalar Dependências

```bash
npm install
```

**Nota**: Se encontrar conflitos de dependências, use:
```bash
npm install --legacy-peer-deps
```

### 3. Verificar Instalação

```bash
npm run build
```

Se o build for bem-sucedido, você está pronto para desenvolver.

---

## 🔧 Desenvolvimento Local (Web Preview)

Para desenvolvimento rápido sem build nativo:

```bash
npm run dev
```

Isso inicia o servidor Vite em `http://localhost:5173`.

**⚠️ Limitações do Modo Web**:
- Plugins nativos podem não funcionar (haptics, filesystem, etc.)
- Safe areas não serão detectadas
- Performance não representa a versão nativa

**Use apenas para UI/UX rápido. Para testes reais, use builds nativos.**

---

## 📱 Build Nativo

### Preparar Assets e Plugins

Sempre que modificar plugins ou configurações do Capacitor:

```bash
npx cap sync
```

Este comando:
1. Copia `dist/` para `android/` e `ios/`
2. Instala/atualiza plugins nativos
3. Configura permissões nos manifestos

### Android

#### 1. Build Web

```bash
npm run build
npx cap sync android
```

#### 2. Abrir no Android Studio

```bash
npx cap open android
```

#### 3. Build e Run

No Android Studio:
- Selecione um dispositivo/emulador
- Clique em **Run** (▶️)
- Aguarde o build Gradle e instalação

**Atalho via CLI** (requer dispositivo conectado via ADB):

```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### iOS

#### 1. Build Web

```bash
npm run build
npx cap sync ios
```

#### 2. Instalar CocoaPods

```bash
cd ios/App
pod install
cd ../..
```

#### 3. Abrir no Xcode

```bash
npx cap open ios
```

#### 4. Build e Run

No Xcode:
- Selecione um simulador ou dispositivo conectado
- Clique em **Run** (▶️)
- Aguarde o build e instalação

---

## 🔌 Plugins Nativos

### Instalados e Configurados

| Plugin | Função | Status |
|--------|--------|--------|
| `@capacitor/core` | Runtime Capacitor | ✅ |
| `@capacitor/android` | Plataforma Android | ✅ |
| `@capacitor/ios` | Plataforma iOS | ✅ |
| `@capacitor/haptics` | Feedback tátil | ✅ |
| `@capacitor/share` | Compartilhamento nativo | ✅ |
| `@capacitor/filesystem` | Acesso a arquivos | ✅ |
| `@capacitor/status-bar` | Customização status bar | ✅ |
| `@capacitor/splash-screen` | Tela de splash | ✅ |
| `@capacitor/screen-orientation` | Controle de orientação | ✅ |
| `@capacitor/camera` | Permissões galeria | ✅ |
| `@capacitor-community/speech-recognition` | Controle por voz | ✅ |

### Como Adicionar um Novo Plugin

1. Instalar via npm:
   ```bash
   npm install @capacitor/plugin-name
   ```

2. Sincronizar com plataformas:
   ```bash
   npx cap sync
   ```

3. Configurar permissões (se necessário):
   - **Android**: Edite `android/app/src/main/AndroidManifest.xml`
   - **iOS**: Edite `ios/App/App/Info.plist`

4. Criar serviço wrapper em `services/`:
   ```typescript
   // services/PluginName.ts
   export const PluginName = {
     async method() { ... }
   };
   ```

---

## 🧪 Testes

### Build de Produção

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Preview de Produção (Web)

```bash
npm run preview
```

---

## 🐛 Troubleshooting

### Erro: `Cannot find module '@capacitor/haptics'`

**Solução**:
```bash
npm install @capacitor/haptics
npx cap sync
```

### Erro: `Gradle build failed`

**Soluções**:
1. Limpar cache do Gradle:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. Invalidar cache do Android Studio:
   - File → Invalidate Caches → Restart

3. Verificar versão do JDK:
   ```bash
   java -version  # Deve ser 17+
   ```

### Erro: `Pod install failed`

**Soluções**:
1. Atualizar CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

2. Limpar cache:
   ```bash
   cd ios/App
   pod deintegrate
   pod install
   cd ../..
   ```

### Erro: `TypeScript compilation failed`

**Solução**:
O projeto usa **TypeScript strict mode**. Verifique:
- Nenhum uso de `any`
- Todos os tipos explicitamente definidos
- Use `override` em métodos de classes que sobrescrevem

Compile manualmente para ver erros:
```bash
npx tsc
```

---

## 📚 Estrutura de Pastas

```
VolleyScore-Pro-v2/
├── android/              # Projeto Android Studio
├── ios/                  # Projeto Xcode
├── public/               # Assets estáticos
├── components/           # Componentes React (UI pura)
├── hooks/                # Custom hooks (lógica de negócio)
├── services/             # Wrappers nativos Capacitor
├── stores/               # Zustand state management
├── contexts/             # React contexts (tema, idioma)
├── types.ts              # Definições TypeScript centralizadas
├── constants.ts          # Constantes da aplicação
├── capacitor.config.ts   # Configuração Capacitor
├── vite.config.ts        # Configuração Vite
├── tsconfig.json         # Configuração TypeScript (strict)
└── ARCHITECTURE.md       # Documentação arquitetural
```

---

## 🔐 Segurança

### SecureStorage

Dados sensíveis são salvos com SHA-256 hash:

```typescript
import { SecureStorage } from '@/services/SecureStorage';

await SecureStorage.save('key', data);
const loaded = await SecureStorage.load<DataType>('key');
```

### Permissões Nativas

Sempre solicite permissões just-in-time:

```typescript
// Exemplo: Camera/Gallery
const permissions = await Camera.checkPermissions();
if (permissions.photos !== 'granted') {
  await Camera.requestPermissions();
}
```

---

## 🚀 Deploy

### Android (Google Play)

1. Build release:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. O AAB estará em:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

3. Assine com sua keystore e faça upload no Play Console.

### iOS (App Store)

1. Abra o projeto no Xcode
2. Configure Signing & Capabilities
3. Archive → Distribute App → Upload to App Store Connect

---

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/lmms500/VolleyScore-Pro-v2/issues)
- **Documentação**: `ARCHITECTURE.md`
- **Capacitor Docs**: [capacitorjs.com](https://capacitorjs.com)

---

## 📄 Licença

[Verificar LICENSE file no repositório]

---

**Desenvolvido com ❤️ para a comunidade de vôlei**
