import { createStore } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { keyBuilder } from '@/react/hooks/useLocalStorage';

import { EnvironmentId } from '../portainer/environments/types';

export const environmentStore = createStore<{
  environmentId?: number;
  setEnvironmentId(id: EnvironmentId): void;
  clear(): void;
}>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        environmentId: undefined,
        setEnvironmentId: (id: EnvironmentId) => set({ environmentId: id }),
        clear: () => set({ environmentId: undefined }),
      }),
      {
        name: keyBuilder('environmentId'),
        getStorage: () => sessionStorage,
      }
    )
  )
);
