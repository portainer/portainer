import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { RefreshableTableSettings } from '@@/datatables/types';

interface Props {
  settings: RefreshableTableSettings;
}

export function EdgeDevicesDatatableSettings({ settings }: Props) {
  return (
    <TableSettingsMenuAutoRefresh
      value={settings.autoRefreshRate}
      onChange={handleRefreshRateChange}
    />
  );

  function handleRefreshRateChange(autoRefreshRate: number) {
    settings.setAutoRefreshRate(autoRefreshRate);
  }
}
