import { create } from "zustand";
import * as billingApi from "../api/billing";
import type { BillingQuery } from "../api/billing";
import type { Billing, BillingSummary } from "../types";

type BillingState = {
  billings: Billing[];
  summary: BillingSummary;
  loading: boolean;
  fetchBillings: (params?: BillingQuery) => Promise<void>;
  fetchSummary: () => Promise<void>;
};

export const useBillingStore = create<BillingState>((set) => ({
  billings: [],
  summary: { receivable: 0, received: 0, pending: 0 },
  loading: false,
  async fetchBillings(params) {
    set({ loading: true });
    try {
      set({ billings: await billingApi.listBillings(params) });
    } finally {
      set({ loading: false });
    }
  },
  async fetchSummary() {
    set({ summary: await billingApi.getBillingSummary() });
  }
}));

