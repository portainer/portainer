import {
  BasicTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
} from '@@/datatables/types';

export type TableSettings = {
  /** expanded is true (all expanded) or a record where each key value pair sets the state of the mentioned row */
  expanded: true | Record<string, boolean>;
  setExpanded(value: true | Record<string, boolean>): void;
} & SettableColumnsTableSettings &
  RefreshableTableSettings &
  BasicTableSettings;
