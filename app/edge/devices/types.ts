export interface EdgeDeviceTableSettings {
  hiddenColumns: string[];
  autoRefreshRate: number;
  pageSize: number;
  sortBy: { id: string; desc: boolean };
}

export enum DeviceAction {
  POWER_ON = 'power on',
  POWER_OFF = 'power off',
  RESTART = 'restart',
}

export enum PowerState {
  RUNNING = 'Running',
  SLEEP = 'Sleep',
  OFF = 'Off',
  HIBERNATE = 'Hibernate',
  POWER_CYCLE = 'Power Cycle',
}

export enum PowerStateCode {
  ON = 2,
  SLEEP_LIGHT = 3,
  SLEEP_DEEP = 4,
  OFF_HARD = 6,
  HIBERNATE = 7,
  OFF_SOFT = 8,
  POWER_CYCLE = 9,
  OFF_HARD_GRACEFUL = 13,
}
