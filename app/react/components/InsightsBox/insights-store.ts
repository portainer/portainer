import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';

interface InsightsStore {
  insightIDsClosed: string[];
  addInsightIDClosed: (insightIDClosed: string) => void;
}

export const insightStore = createStore<InsightsStore>()(
  persist(
    (set) => ({
      insightIDsClosed: [],
      addInsightIDClosed: (insightIDClosed: string) => {
        set((state) => {
          const currentIDsClosed = state.insightIDsClosed || [];
          return { insightIDsClosed: [...currentIDsClosed, insightIDClosed] };
        });
      },
    }),
    {
      name: keyBuilder('insightIDsClosed'),
      getStorage: () => localStorage,
    }
  )
);
