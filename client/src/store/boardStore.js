import { create } from 'zustand';
import { columnAPI, taskAPI } from '../api/services.js';

export const useBoardStore = create((set, get) => ({
  columns: [],
  tasks: [],        // flat list, grouped by column on the fly
  loading: false,
  activeProject: null,

  loadBoard: async (projectId) => {
    set({ loading: true, activeProject: projectId, columns: [], tasks: [] });
    try {
      const [colRes, taskRes] = await Promise.all([
        columnAPI.getAll(projectId),
        taskAPI.getAll(projectId),
      ]);
      set({ columns: colRes.data, tasks: taskRes.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // Columns
  addColumn: (col) => set((s) => ({ columns: [...s.columns, col] })),
  updateColumn: (col) =>
    set((s) => ({ columns: s.columns.map((c) => (c._id === col._id ? col : c)) })),
  removeColumn: (id) =>
    set((s) => ({
      columns: s.columns.filter((c) => c._id !== id),
      tasks: s.tasks.filter((t) => t.column !== id),
    })),
  setColumns: (columns) => set({ columns }),

  // Tasks
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (task) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t._id === task._id ? task : t)) })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) })),

  // Move task (optimistic)
  moveTask: (taskId, newColumnId, newOrder) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t._id === taskId ? { ...t, column: newColumnId, order: newOrder } : t
      ),
    })),

  getTasksForColumn: (columnId) =>
    get().tasks.filter((t) => t.column === columnId || t.column?._id === columnId)
      .sort((a, b) => a.order - b.order),
}));
