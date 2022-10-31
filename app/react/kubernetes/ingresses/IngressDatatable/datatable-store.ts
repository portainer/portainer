import create from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/portainer/hooks/useLocalStorage';
import {
  paginationSettings,
  sortableSettings,
} from '@/react/components/datatables/types';

import { TableSettings } from '../types';

export const TRUNCATE_LENGTH = 32;

export function createStore(storageKey: string) {
  return create<TableSettings>()(
    persist(
      (set) => ({
        ...sortableSettings(set),
        ...paginationSettings(set),
      }),
      {
        name: keyBuilder(storageKey),
      }
    )
  );
}
