import { create } from "zustand";

const STORAGE_KEY = "loan-ai-auth";

const useAuthStore = create((set) => {
  let initialState = { user: null, token: null, isAuthenticated: false };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        initialState = { user: state.user || null, token: state.token, isAuthenticated: true };
      }
    }
  } catch (_) {}

  return {
    ...initialState,

    setAuth: (user, token) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { user, token } }));
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

export default useAuthStore;