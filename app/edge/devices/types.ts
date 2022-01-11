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
