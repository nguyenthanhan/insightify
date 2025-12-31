import { create } from "zustand";

interface UIState {
  isDialogOpen: boolean;
  isProcessing: boolean;
  isStreaming: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isDegradedMode: boolean;
}

interface UIActions {
  toggleChatDialog: () => void;
  setDialogOpen: (open: boolean) => void;
  setProcessing: (value: boolean) => void;
  setStreaming: (value: boolean) => void;
  setError: (message: string | null) => void;
  setDegradedMode: (value: boolean) => void;
  clearError: () => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()((set, get) => ({
  // Initial state
  isDialogOpen: false,
  isProcessing: false,
  isStreaming: false,
  hasError: false,
  errorMessage: null,
  isDegradedMode: true, // Start in degraded mode until provider is configured

  // Actions
  toggleChatDialog: () => {
    set({ isDialogOpen: !get().isDialogOpen });
  },

  setDialogOpen: (open: boolean) => {
    set({ isDialogOpen: open });
  },

  setProcessing: (value: boolean) => {
    set({ isProcessing: value });
  },

  setStreaming: (value: boolean) => {
    set({ isStreaming: value });
  },

  setError: (message: string | null) => {
    set({
      hasError: message !== null,
      errorMessage: message,
    });
  },

  setDegradedMode: (value: boolean) => {
    set({ isDegradedMode: value });
  },

  clearError: () => {
    set({ hasError: false, errorMessage: null });
  },
}));

export default useUIStore;
