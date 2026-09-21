import { create } from 'zustand';
import { workspaceAPI, projectAPI } from '../api/services.js';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  projects: [],
  loading: false,

  fetchWorkspaces: async () => {
    set({ loading: true });
    try {
      const { data } = await workspaceAPI.getAll();
      set({ workspaces: data, loading: false });
      // Auto-select first if none active
      if (!get().activeWorkspace && data.length > 0) {
        get().setActiveWorkspace(data[0]);
      }
    } catch {
      set({ loading: false });
    }
  },

  setActiveWorkspace: async (workspace) => {
    set({ activeWorkspace: workspace, projects: [] });
    if (workspace) {
      const { data } = await projectAPI.getAll(workspace._id);
      set({ projects: data });
    }
  },

  addWorkspace: (ws) => set((s) => ({ workspaces: [ws, ...s.workspaces] })),

  addProject: (proj) => set((s) => ({ projects: [proj, ...s.projects] })),

  removeProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p._id !== id) })),

  removeWorkspace: (id) => set((s) => {
    const remaining = s.workspaces.filter((w) => w._id !== id);
    // If we just deleted the active workspace, switch to the next one (or null)
    const activeWorkspace = s.activeWorkspace?._id === id
      ? (remaining[0] || null)
      : s.activeWorkspace;
    return {
      workspaces: remaining,
      activeWorkspace,
      // Clear projects if no active workspace
      projects: activeWorkspace ? s.projects : [],
    };
  }),
}));
