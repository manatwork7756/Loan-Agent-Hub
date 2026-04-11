import { create } from 'zustand'

const useLoanStore = create((set) => ({
  applications: [],
  currentApplication: null,
  loading: false,
  error: null,

  setApplications: (apps) => set({ applications: apps }),
  setCurrentApplication: (app) => set({ currentApplication: app }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),

  addApplication: (app) =>
    set((s) => ({ applications: [app, ...s.applications] })),

  updateApplication: (id, updates) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
}))

export default useLoanStore
