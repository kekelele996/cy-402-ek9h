import { create } from "zustand";
import * as clientApi from "../api/client";
import type { Client } from "../types";

type ClientState = {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  fetchClients: (q?: string) => Promise<void>;
  fetchClient: (id: string) => Promise<void>;
};

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  selectedClient: null,
  loading: false,
  async fetchClients(q) {
    set({ loading: true });
    try {
      set({ clients: await clientApi.listClients(q) });
    } finally {
      set({ loading: false });
    }
  },
  async fetchClient(id) {
    set({ selectedClient: await clientApi.getClient(id) });
  }
}));

