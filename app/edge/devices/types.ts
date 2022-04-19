import {
  PaginationTableSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  SortableTableSettings,
} from '@/portainer/components/datatables/types';

export interface EdgeDeviceTableSettings
  extends SortableTableSettings,
    PaginationTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings {}

export interface FDOProfilesTableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}

export enum DeviceAction {
  PowerOn = 'power on',
  PowerOff = 'power off',
  Restart = 'restart',
}

export enum PowerState {
  Running = 'Running',
  Sleep = 'Sleep',
  Off = 'Off',
  Hibernate = 'Hibernate',
  PowerCycle = 'Power Cycle',
}

export enum PowerStateCode {
  On = 2,
  SleepLight = 3,
  SleepDeep = 4,
  OffHard = 6,
  Hibernate = 7,
  OffSoft = 8,
  PowerCycle = 9,
  OffHardGraceful = 13,
}
