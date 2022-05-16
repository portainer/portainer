import { TableSettingsMenuAutoRefresh } from '@/react/components/datatables/TableSettingsMenuAutoRefresh';
import { useTableSettings } from '@/react/components/datatables/useTableSettings';

import { EdgeDeviceTableSettings } from './types';

export function EdgeDevicesDatatableSettings() {
  const { settings, setTableSettings } =
    useTableSettings<EdgeDeviceTableSettings>();

  return (
    <TableSettingsMenuAutoRefresh
      value={settings.autoRefreshRate}
      onChange={handleRefreshRateChange}
    />
  );

  function handleRefreshRateChange(autoRefreshRate: number) {
    setTableSettings({ autoRefreshRate });
  }
}
