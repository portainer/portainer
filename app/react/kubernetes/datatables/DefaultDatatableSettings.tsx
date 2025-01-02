import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import {
  SystemResourcesSettings,
  SystemResourcesTableSettings,
} from './SystemResourcesSettings';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}

export function DefaultDatatableSettings({
  settings,
}: {
  settings: TableSettings;
}) {
  return (
    <>
      <SystemResourcesSettings
        value={settings.showSystemResources}
        onChange={(value) => {
          settings.setShowSystemResources(value);
        }}
      />

      <TableSettingsMenuAutoRefresh
        value={settings.autoRefreshRate}
        onChange={handleRefreshRateChange}
      />
    </>
  );

  function handleRefreshRateChange(autoRefreshRate: number) {
    settings.setAutoRefreshRate(autoRefreshRate);
  }
}
