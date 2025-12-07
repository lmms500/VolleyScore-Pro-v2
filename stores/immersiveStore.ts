import { create } from 'zustand';

interface ImmersiveStore {
  isImmersive: boolean;
  toggleImmersive: () => void;
}

export const useImmersiveStore = create<ImmersiveStore>((set) => ({
  isImmersive: false,
  toggleImmersive: () => set((state) => ({ isImmersive: !state.isImmersive })),
}));
