import { useSyncExternalStore } from "react";
import type { Store } from "../../state/store";

/** Stan magazynu z `state/`; komponent renderuje się przy każdej zmianie. */
export function useStore<S extends object>(store: Store<S>): S {
  return useSyncExternalStore(store.subscribe, store.getState);
}
