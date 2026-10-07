import { create } from "zustand";
import * as caseApi from "../api/case";
import type { CaseQuery } from "../api/case";
import type { CaseRecord } from "../types";

type CaseState = {
  cases: CaseRecord[];
  selectedCase: CaseRecord | null;
  loading: boolean;
  fetchCases: (params?: CaseQuery) => Promise<void>;
  fetchCase: (id: string) => Promise<void>;
};

export const useCaseStore = create<CaseState>((set) => ({
  cases: [],
  selectedCase: null,
  loading: false,
  async fetchCases(params) {
    set({ loading: true });
    try {
      set({ cases: await caseApi.listCases(params) });
    } finally {
      set({ loading: false });
    }
  },
  async fetchCase(id) {
    set({ selectedCase: await caseApi.getCase(id) });
  }
}));

