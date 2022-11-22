import {
  BasicTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
} from '@@/datatables/types';

export interface TableSettings
  extends BasicTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings {}
