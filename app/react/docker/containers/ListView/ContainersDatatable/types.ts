import {
  BasicTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
} from '@@/datatables/types';

export type QuickAction = 'attach' | 'exec' | 'inspect' | 'logs' | 'stats';

export interface SettableQuickActionsTableSettings<TAction> {
  hiddenQuickActions: TAction[];
  setHiddenQuickActions: (hiddenQuickActions: TAction[]) => void;
}

export interface TableSettings
  extends BasicTableSettings,
    SettableColumnsTableSettings,
    SettableQuickActionsTableSettings<QuickAction>,
    RefreshableTableSettings {
  truncateContainerName: number;
  setTruncateContainerName: (value: number) => void;
}
