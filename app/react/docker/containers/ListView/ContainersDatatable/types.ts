import {
  PaginationTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  SortableTableSettings,
} from '@/react/components/datatables/types';

export type QuickAction = 'attach' | 'exec' | 'inspect' | 'logs' | 'stats';

export interface SettableQuickActionsTableSettings<TAction> {
  hiddenQuickActions: TAction[];
  setHiddenQuickActions: (hiddenQuickActions: TAction[]) => void;
}

export interface TableSettings
  extends SortableTableSettings,
    PaginationTableSettings,
    SettableColumnsTableSettings,
    SettableQuickActionsTableSettings<QuickAction>,
    RefreshableTableSettings {
  truncateContainerName: number;
  setTruncateContainerName: (value: number) => void;
}
