import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';

import { SystemResourcesSettings } from '../../datatables/SystemResourcesSettings';

import { type TableSettings } from './types';

export function StacksSettingsMenu({ settings }: { settings: TableSettings }) {
  return (
    <TableSettingsMenu>
      <SystemResourcesSettings
        value={settings.showSystemResources}
        onChange={(value) => settings.setShowSystemResources(value)}
      />

      <TableSettingsMenuAutoRefresh
        onChange={settings.setAutoRefreshRate}
        value={settings.autoRefreshRate}
      />
    </TableSettingsMenu>
  );
}
