import { createStore } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';

type State = {
  isExpanded: boolean;
  setIsExpanded(expanded: boolean): void;
};

export const summaryStore = createStore<State>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        isExpanded: true,
        setIsExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
      }),
      {
        name: keyBuilder('kubernetes-summary-expanded'),
        getStorage: () => localStorage,
      }
    )
  )
);
