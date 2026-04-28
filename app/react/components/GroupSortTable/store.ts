import {
  type BasicTableSettings,
  hiddenColumnsSettings,
  type SettableColumnsTableSettings,
} from '@@/datatables/types';
import { useTableStateWithStorage } from '@@/datatables/useTableState';

export interface TableSettings
  extends BasicTableSettings,
    SettableColumnsTableSettings {}

const tableKey = 'environment_groups';

export function useStore() {
  return useTableStateWithStorage<TableSettings>(tableKey, 'Name', (set) => ({
    ...hiddenColumnsSettings(set),
  }));
}
