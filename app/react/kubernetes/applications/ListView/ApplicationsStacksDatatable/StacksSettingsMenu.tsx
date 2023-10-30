import { SystemResourcesSettings } from '@/react/kubernetes/datatables/SystemResourcesSettings';

import { TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';

import { type TableSettings } from './types';

export function StacksSettingsMenu({
  settings,
  setSystemResources,
}: {
  settings: TableSettings;
  setSystemResources(showSystem: boolean): void;
}) {
  return (
    <TableSettingsMenu>
      <SystemResourcesSettings
        value={settings.showSystemResources}
        onChange={(value) => {
          setSystemResources(value);
          settings.setShowSystemResources(value);
        }}
      />

      <TableSettingsMenuAutoRefresh
        onChange={settings.setAutoRefreshRate}
        value={settings.autoRefreshRate}
      />
    </TableSettingsMenu>
  );
}
