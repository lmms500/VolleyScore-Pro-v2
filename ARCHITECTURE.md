# 🏗 VolleyScore Pro v2 - Arquitetura Nativa Mobile

## 📱 Filosofia: Mobile-First Radical

O **VolleyScore Pro v2** é uma aplicação **100% nativa** construída com **React Native + Capacitor**. Não é um PWA, não é um site responsivo, não é desktop-first adaptado. É um **app móvel premium** para Android e iOS.

---

## 🎯 Princípios Fundamentais

### 1. **Performance Nativa**
- Competir com apps totalmente nativos (Kotlin/Swift)
- Tempo de resposta < 16ms para interações críticas (60fps)
- Animações fluidas usando Reanimated
- Minimizar re-renders com `useMemo`, `useCallback`, `React.memo`

### 2. **Integração Capacitor Obrigatória**
- Usar plugins nativos para:
  - Haptics (feedback tátil)
  - Storage (persistência segura)
  - Share (compartilhamento nativo)
  - Filesystem (acesso a arquivos)
  - Audio (sons procedurais via Web Audio API)
- Sempre implementar fallback gracioso para plataformas não suportadas

### 3. **TypeScript Strict**
- `"strict": true` em `tsconfig.json`
- **Jamais** usar `any`
- Todas as funções devem ter tipos de entrada/saída explícitos
- Interfaces e Enums para toda estrutura de dados

### 4. **Clean Architecture**
Separação rigorosa de responsabilidades:

```
hooks/       → Lógica de negócio e regras de jogo
components/  → UI pura, atomic design, HUDs e modais
contexts/    → Temas, idioma, configurações globais
stores/      → Zustand (persistência e estados pesados)
services/    → Wrappers para plugins nativos do Capacitor
types.ts     → Definições de tipos centralizadas
```

---

## 🔌 Camada de Serviços Nativos (`services/`)

Toda interação com APIs nativas do Capacitor deve ser encapsulada em serviços.

### Estrutura Padrão de um Serviço

```typescript
/**
 * Nome do Serviço
 * Descrição breve da responsabilidade
 * 
 * @module services/NomeDoServico
 * @requires @capacitor/plugin-name
 */

import { Capacitor } from '@capacitor/core';

// 1. Verificar disponibilidade
const isAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

// 2. Lazy-load do plugin
const getPlugin = async () => {
  if (!isAvailable()) return null;
  
  try {
    const { Plugin } = await import('@capacitor/plugin-name');
    return Plugin;
  } catch (error) {
    console.warn('Plugin não disponível:', error);
    return null;
  }
};

// 3. API Pública com Fallback
export const NomeDoServico = {
  async metodo(parametros): Promise<void> {
    const plugin = await getPlugin();
    
    if (plugin) {
      try {
        await plugin.action(parametros);
      } catch (error) {
        console.warn('Falha na ação nativa:', error);
        // Fallback (Web API ou silencioso)
      }
    } else {
      // Fallback para plataformas não suportadas
    }
  }
};
```

### Serviços Implementados

#### **NativeHaptics** (`services/NativeHaptics.ts`)
- **Plugin**: `@capacitor/haptics`
- **Responsabilidade**: Feedback tátil nativo (iOS/Android)
- **Fallback**: `navigator.vibrate()`
- **Métodos**:
  - `impact(style: ImpactStyle)` - Feedback de toque (light/medium/heavy)
  - `notification(type: NotificationType)` - Feedback de notificação (success/warning/error)
  - `vibrate(pattern)` - Vibração customizada

#### **SecureStorage** (`services/SecureStorage.ts`)
- **Plugin**: `localStorage` + crypto integrity checks
- **Responsabilidade**: Persistência segura com anti-tampering
- **Fallback**: Modo bypass em contextos inseguros (HTTP)
- **Métodos**:
  - `save<T>(key, data)` - Salvar com hash SHA-256
  - `load<T>(key)` - Carregar e verificar integridade
  - `remove(key)` - Remover item

#### **NativeShare** (`native/share.ts`)
- **Plugin**: `@capacitor/share`
- **Responsabilidade**: Compartilhamento nativo de conteúdo
- **Fallback**: Web Share API → Clipboard
- **Métodos**:
  - `shareContentNatively(title, text, url)` - Compartilhar texto/link

---

## 🎨 Design System: Neo-Glass Mobile Premium

### Paleta de Cores

```css
/* Fundo Principal (OLED-friendly) */
bg-slate-950: #020617  /* Evita smearing em OLEDs */

/* Times */
Team A (Home):  violet-500 glow
Team B (Guest): rose-500 glow

/* Vidro Fosco (GPU-conscious) */
backdrop-blur-xl: Apenas em modais/overlays
bg-white/10:      Para elementos fixos (reduz uso de GPU)
```

### Safe Areas (CRÍTICO)

**Sempre** respeitar as safe areas do iOS e Android:

```tsx
import { useSafeAreaInsets } from '@/hooks/useSafeAreaInsets';

const { top, bottom } = useSafeAreaInsets();

<div style={{ paddingTop: top, paddingBottom: bottom }}>
  Conteúdo seguro
</div>
```

Ou usando Tailwind:

```tsx
<div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
  Conteúdo
</div>
```

### Tamanhos de Toque

- **Mínimo**: 44px × 44px (iOS Human Interface Guidelines)
- **Recomendado**: 48px × 48px (Android Material Design)
- Zonas de toque devem ter espaçamento adequado (8px+ de margem)

---

## ⚡ Performance - Diretrizes Obrigatórias

### 1. Evitar Re-renders Desnecessários

```tsx
// ❌ MAU: Cria nova função a cada render
<Button onClick={() => handleClick(id)} />

// ✅ BOM: useCallback + deps
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
<Button onClick={handleClick} />
```

### 2. Memoização de Cálculos Pesados

```tsx
// ❌ MAU: Recalcula a cada render
const sortedPlayers = players.sort((a, b) => b.skill - a.skill);

// ✅ BOM: useMemo
const sortedPlayers = useMemo(() => 
  players.sort((a, b) => b.skill - a.skill)
, [players]);
```

### 3. Animações Performáticas

```tsx
// ❌ MAU: Anima propriedades que causam reflow
<motion.div animate={{ top: 100, width: 200 }} />

// ✅ BOM: Usa transform e opacity
<motion.div animate={{ y: 100, scale: 1.2, opacity: 1 }} />
```

### 4. Backdrop-blur Consciente

```tsx
// ❌ MAU: blur em todos os elementos
<div className="backdrop-blur-xl bg-white/10">

// ✅ BOM: blur apenas em overlays/modais
{isModalOpen && (
  <div className="backdrop-blur-xl bg-black/60">
    Modal
  </div>
)}
```

---

## 🧪 Hooks - Padrões e Responsabilidades

### Hooks de Lógica de Jogo
- `useVolleyGame` - Motor principal do jogo de vôlei
- `useScoreGestures` - Detecção de gestos para pontuação
- `useMvp` - Cálculo de MVP baseado em estatísticas

### Hooks de Interface Nativa
- `useHaptics` - Wrapper para NativeHaptics service
- `useGameAudio` - Sintetizador de áudio procedural
- `useScreenOrientationLock` - Bloqueio de orientação
- `useSafeAreaInsets` - Safe areas (notch/dynamic island)

### Hooks de Persistência
- `usePlayerProfiles` - Gerenciamento de perfis de jogadores
- `useHistoryStore` - Histórico de partidas (Zustand)

### Padrão de Hook

```typescript
export const useNomeDoHook = (params: Params) => {
  // 1. Estado local
  const [state, setState] = useState<Type>(initialValue);
  
  // 2. Referências para valores que não causam re-render
  const ref = useRef<Type>(initialValue);
  
  // 3. Callbacks memoizados
  const handleAction = useCallback(() => {
    // lógica
  }, [dependencies]);
  
  // 4. Efeitos colaterais
  useEffect(() => {
    // setup
    return () => {
      // cleanup
    };
  }, [dependencies]);
  
  // 5. Valores computados
  const computedValue = useMemo(() => {
    return expensiveCalculation(state);
  }, [state]);
  
  // 6. API pública
  return {
    state,
    handleAction,
    computedValue,
  };
};
```

---

## 🔄 Fluxo de Build e Deploy

### 1. Desenvolvimento Local

```bash
npm install
npm run dev
```

### 2. Build para Produção

```bash
npm run build
```

### 3. Sincronizar com Capacitor (OBRIGATÓRIO após mudanças em plugins)

```bash
npx cap sync
```

Este comando:
- Copia o build (`dist/`) para `android/` e `ios/`
- Instala/atualiza plugins nativos
- Configura permissões no `AndroidManifest.xml` e `Info.plist`

### 4. Build Nativo

**Android**:
```bash
npx cap open android
# Build via Android Studio
```

**iOS**:
```bash
npx cap open ios
# Build via Xcode
```

---

## 📦 Plugins Capacitor Instalados

| Plugin | Versão | Uso |
|--------|--------|-----|
| `@capacitor/core` | ^6.2.1 | Runtime Capacitor |
| `@capacitor/android` | ^6.2.1 | Plataforma Android |
| `@capacitor/ios` | ^6.2.1 | Plataforma iOS |
| `@capacitor/haptics` | - | Feedback tátil (PENDENTE INSTALAÇÃO) |
| `@capacitor/share` | ^6.0.0 | Compartilhamento nativo |
| `@capacitor/filesystem` | ^6.0.0 | Acesso a arquivos |
| `@capacitor/status-bar` | ^6.0.0 | Customização da status bar |
| `@capacitor/splash-screen` | ^7.0.3 | Tela de splash |
| `@capacitor/screen-orientation` | ^6.0.0 | Controle de orientação |
| `@capacitor/camera` | ^7.0.2 | Permissões de galeria |
| `@capacitor-community/speech-recognition` | ^7.0.1 | Controle por voz |

### ⚠ Instalação Pendente

```bash
npm install @capacitor/haptics
npx cap sync
```

---

## 🛡 Segurança

### 1. Proteção de Dados
- Usar `SecureStorage` para dados sensíveis
- Nunca commitar chaves de API ou secrets
- Validar integridade de dados persistidos (SHA-256)

### 2. Permissões Nativas
- Solicitar permissões just-in-time (quando necessário)
- Explicar claramente ao usuário o motivo da permissão
- Sempre implementar fallback para permissões negadas

---

## 📚 Recursos e Referências

### Documentação Oficial
- [Capacitor Docs](https://capacitorjs.com/docs)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://m3.material.io/)

### Ferramentas
- [Framer Motion](https://www.framer.com/motion/) - Animações performáticas
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

## 🚀 Checklist de Qualidade Nativa

Antes de cada release, validar:

- [ ] TypeScript compila sem erros (`npm run build`)
- [ ] Sem uso de `any` no código
- [ ] Todos os serviços nativos têm fallback
- [ ] Safe areas implementadas em todas as telas
- [ ] Animações usam `transform`/`opacity` (não `top`/`width`)
- [ ] Haptics em ações críticas (ponto, undo, reset)
- [ ] Áudio habilitado/desabilitável
- [ ] Orientação bloqueada conforme contexto
- [ ] Build Android funcional (`npx cap open android`)
- [ ] Build iOS funcional (`npx cap open ios`)
- [ ] Testado em dispositivos físicos (não apenas emulador)

---

## 👨‍💻 Manutenção e Evolução

### Adicionando um Novo Plugin Capacitor

1. Instalar o plugin:
   ```bash
   npm install @capacitor/plugin-name
   ```

2. Criar serviço wrapper em `services/`:
   ```typescript
   // services/NomeDoServico.ts
   export const NomeDoServico = { ... };
   ```

3. Criar hook se necessário em `hooks/`:
   ```typescript
   // hooks/useNomeDoHook.ts
   export const useNomeDoHook = () => { ... };
   ```

4. Sincronizar com plataformas nativas:
   ```bash
   npx cap sync
   ```

5. Testar em Android e iOS.

### Atualizando Capacitor

```bash
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest @capacitor/ios@latest
npx cap sync
```

---

## 🎓 Conclusão

O **VolleyScore Pro v2** não é apenas um app que funciona em mobile.  
É um **app nativo premium** que:
- Respeita as diretrizes de cada plataforma
- Oferece performance competitiva com apps nativos
- Fornece feedback sensorial (haptics + audio)
- Adapta-se a diferentes tamanhos e safe areas
- Mantém código limpo, tipado e testável

**Qualquer modificação deve seguir esses princípios.**
