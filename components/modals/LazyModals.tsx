/**
 * Lazy-loaded Modal Wrappers (Fase 3.1)
 * 
 * Code-split all modals to reduce initial bundle.
 * React.lazy() with Suspense creates separate chunks for each modal.
 * 
 * USAGE in App.tsx:
 * import { LazySettingsModal, LazyTeamManagerModal, ... } from './components/modals/LazyModals';
 * 
 * Benefits:
 * - Initial bundle reduced by ~50KB (modals are ~8KB each)
 * - Modals loaded on-demand when user opens them
 * - Fallback UI prevents loading flicker
 */

import { lazy, Suspense, ComponentType } from 'react';

// Lazy-loaded modal components
const SettingsModalComponent = lazy(() => import('./SettingsModal').then(m => ({ default: m.SettingsModal })));
const TeamManagerModalComponent = lazy(() => import('./TeamManagerModal').then(m => ({ default: m.TeamManagerModal })));
const MatchOverModalComponent = lazy(() => import('./MatchOverModal').then(m => ({ default: m.MatchOverModal })));
const ConfirmationModalComponent = lazy(() => import('./ConfirmationModal').then(m => ({ default: m.ConfirmationModal })));
const HistoryModalComponent = lazy(() => import('./HistoryModal').then(m => ({ default: m.HistoryModal })));
const TutorialModalComponent = lazy(() => import('./TutorialModal').then(m => ({ default: m.TutorialModal })));

/**
 * Minimal loading fallback - invisible, no layout shift
 */
const ModalSuspenseFallback = () => null;

/**
 * Lazy-loaded SettingsModal wrapper
 */
export const LazySettingsModal: ComponentType<any> = (props: any) => (
  <Suspense fallback={<ModalSuspenseFallback />}>
    <SettingsModalComponent {...props} />
  </Suspense>
);

/**
 * Lazy-loaded TeamManagerModal wrapper
 */
export const LazyTeamManagerModal: ComponentType<any> = (props: any) => (
  <Suspense fallback={<ModalSuspenseFallback />}>
    <TeamManagerModalComponent {...props} />
  </Suspense>
);

/**
 * Lazy-loaded MatchOverModal wrapper
 */
export const LazyMatchOverModal: ComponentType<any> = (props: any) => (
  <Suspense fallback={<ModalSuspenseFallback />}>
    <MatchOverModalComponent {...props} />
  </Suspense>
);

/**
 * Lazy-loaded ConfirmationModal wrapper
 */
export const LazyConfirmationModal: ComponentType<any> = (props: any) => (
  <Suspense fallback={<ModalSuspenseFallback />}>
    <ConfirmationModalComponent {...props} />
  </Suspense>
);

/**
 * Lazy-loaded HistoryModal wrapper
 */
export const LazyHistoryModal: ComponentType<any> = (props: any) => (
  <Suspense fallback={<ModalSuspenseFallback />}>
    <HistoryModalComponent {...props} />
  </Suspense>
);

/**
 * Lazy-loaded TutorialModal wrapper
 */
export const LazyTutorialModal: ComponentType<any> = (props: any) => (
  <Suspense fallback={<ModalSuspenseFallback />}>
    <TutorialModalComponent {...props} />
  </Suspense>
);
