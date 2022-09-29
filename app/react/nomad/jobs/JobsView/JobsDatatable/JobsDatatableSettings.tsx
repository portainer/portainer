import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useTableSettings } from '@@/datatables/useTableSettings';

import { JobsTableSettings } from './types';

export function JobsDatatableSettings() {
  const { settings, setTableSettings } = useTableSettings<JobsTableSettings>();

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
