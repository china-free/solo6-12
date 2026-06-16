import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { User } from '../../shared/types.js';

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await apiClient.getUsers();
      set({ users, loading: false });
    } catch (e: any) {
      set({ error: e.message || '加载用户失败', loading: false });
      console.warn('fetch users failed', e);
    }
  },
}));
