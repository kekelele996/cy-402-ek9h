import { create } from "zustand";
import * as authApi from "../api/auth";
import * as userApi from "../api/user";
import type { User } from "../types";
import type { PermissionKey, RoleName } from "../types/permissions";

type UserState = {
  token: string | null;
  currentUser: User | null;
  users: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  hasRole: (role: RoleName) => boolean;
  hasPermission: (permission: PermissionKey) => boolean;
};

export const useUserStore = create<UserState>((set, get) => ({
  token: localStorage.getItem("cylawcase.token"),
  currentUser: null,
  users: [],
  loading: false,
  async login(email, password) {
    set({ loading: true });
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem("cylawcase.token", data.token);
      set({ token: data.token, currentUser: data.user });
    } finally {
      set({ loading: false });
    }
  },
  logout() {
    localStorage.removeItem("cylawcase.token");
    set({ token: null, currentUser: null });
  },
  async fetchMe() {
    if (!get().token) return;
    const currentUser = await authApi.me();
    set({ currentUser });
  },
  async fetchUsers() {
    const users = await userApi.listUsers();
    set({ users });
  },
  hasRole(role) {
    return Boolean(get().currentUser?.roles?.includes("admin") || get().currentUser?.roles?.includes(role));
  },
  hasPermission(permission) {
    const user = get().currentUser;
    return Boolean(user?.roles?.includes("admin") || user?.permissions?.includes(permission));
  }
}));

