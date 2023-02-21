import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { Checkbox } from '@@/form-components/Checkbox';
import {
  BasicTableSettings,
  RefreshableTableSettings,
  ZustandSetFunc,
} from '@@/datatables/types';

interface SystemResourcesTableSettings {
  showSystemResources: boolean;
  setShowSystemResources: (value: boolean) => void;
}

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}

interface Props {
  settings: TableSettings;
}

export function systemResourcesSettings(
  set: ZustandSetFunc<SystemResourcesTableSettings>
): SystemResourcesTableSettings {
  return {
    showSystemResources: false,
    setShowSystemResources(showSystemResources: boolean) {
      set({
        showSystemResources,
      });
    },
  };
}

export function DefaultDatatableSettings({ settings }: Props) {
  return (
    <>
      <Checkbox
        id="show-system-resources"
        label="Show system resources"
        checked={settings.showSystemResources}
        onChange={(e) => settings.setShowSystemResources(e.target.checked)}
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
