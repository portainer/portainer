export interface EdgeDeviceTableSettings {
  hiddenColumns: string[];
  autoRefreshRate: number;
  pageSize: number;
  sortBy: { id: string; desc: boolean };
}
