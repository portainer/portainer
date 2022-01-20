export interface EdgeDeviceTableSettings {
  hiddenColumns: string[];
  autoRefreshRate: number;
  pageSize: number;
  sortBy: { id: string; desc: boolean };
}

export interface FDOProfilesTableSettings {
  pageSize: number;
  sortBy: { id: string; desc: boolean };
}

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
