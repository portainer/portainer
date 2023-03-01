import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';

interface InsightsStore {
  insightIDsClosed: string[];
  addInsightIDClosed: (insightIDClosed: string) => void;
  isClosed: (insightID?: string) => boolean;
}

export const insightStore = createStore<InsightsStore>()(
  persist(
    (set, get) => ({
      insightIDsClosed: [],
      addInsightIDClosed: (insightIDClosed: string) => {
        set((state) => {
          const currentIDsClosed = state.insightIDsClosed || [];
          return { insightIDsClosed: [...currentIDsClosed, insightIDClosed] };
        });
      },
      isClosed: (insightID?: string) => {
        if (!insightID) {
          return false;
        }
        const currentIDsClosed = get().insightIDsClosed || [];
        return currentIDsClosed.includes(insightID);
      },
    }),
    {
      name: keyBuilder('insightIDsClosed'),
      getStorage: () => localStorage,
    }
  )
);
