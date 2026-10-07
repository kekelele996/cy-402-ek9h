import { useEffect } from "react";
import { useUserStore } from "../stores/user";

export function useAuth() {
  const store = useUserStore();

  useEffect(() => {
    if (store.token && !store.currentUser) {
      void store.fetchMe();
    }
  }, [store]);

  return store;
}

