import { createStore } from 'zustand';

import { RepositoryTagViewModel } from './view-model';

interface Store {
  updates: Record<string, RepositoryTagViewModel>;
  setName(originalName: string, value?: RepositoryTagViewModel): void;
  count: number;
  getUpdate(originalName: string): RepositoryTagViewModel | undefined;
  clear(): void;
}

export const newNamesStore = createStore<Store>()((set, get) => ({
  updates: {},
  count: 0,
  setName(originalName: string, value?: RepositoryTagViewModel) {
    const { updates } = get();
    if (typeof value === 'undefined') {
      delete updates[originalName];
    } else {
      updates[originalName] = value;
    }

    set({ updates, count: Object.keys(updates).length });
  },
  getUpdate(originalName: string) {
    const { updates } = get();
    return updates[originalName];
  },
  clear() {
    set({ updates: {}, count: 0 });
  },
}));
