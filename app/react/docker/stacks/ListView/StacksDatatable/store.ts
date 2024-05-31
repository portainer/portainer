import {
  type BasicTableSettings,
  type FilteredColumnsTableSettings,
  type RefreshableTableSettings,
  type SettableColumnsTableSettings,
  hiddenColumnsSettings,
  refreshableSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';
import { useTableStateWithStorage } from '@@/datatables/useTableState';

export interface TableSettings
  extends BasicTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings,
    FilteredColumnsTableSettings {
  showOrphanedStacks: boolean;
  setShowOrphanedStacks(value: boolean): void;
}

const tableKey = 'docker_stacks';

export function useStore() {
  return useTableStateWithStorage<TableSettings>(tableKey, 'name', (set) => ({
    ...hiddenColumnsSettings(set),
    ...refreshableSettings(set),
    ...filteredColumnsSettings(set),
    showOrphanedStacks: false,
    setShowOrphanedStacks(showOrphanedStacks) {
      set((s) => ({ ...s, showOrphanedStacks }));
    },
  }));
}
