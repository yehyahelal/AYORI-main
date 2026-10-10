import { create } from 'zustand';

interface UIStore {
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
    toggleAuthModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isAuthModalOpen: false,
    openAuthModal: () => set({ isAuthModalOpen: true }),
    closeAuthModal: () => set({ isAuthModalOpen: false }),
    toggleAuthModal: () => set((state) => ({ isAuthModalOpen: !state.isAuthModalOpen })),
}));
