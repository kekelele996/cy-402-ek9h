import { create } from "zustand";
import * as documentApi from "../api/document";
import type { DocumentQuery } from "../api/document";
import type { DocumentRecord } from "../types";

type DocumentState = {
  documents: DocumentRecord[];
  loading: boolean;
  fetchDocuments: (params?: DocumentQuery) => Promise<void>;
};

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  loading: false,
  async fetchDocuments(params) {
    set({ loading: true });
    try {
      set({ documents: await documentApi.listDocuments(params) });
    } finally {
      set({ loading: false });
    }
  }
}));

