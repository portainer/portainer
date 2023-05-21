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

export function systemResourcesSettings<T extends SystemResourcesTableSettings>(
  set: ZustandSetFunc<T>
): SystemResourcesTableSettings {
  return {
    showSystemResources: false,
    setShowSystemResources(showSystemResources: boolean) {
      set((s) => ({
        ...s,
        showSystemResources,
      }));
    },
  };
}

interface Props {
  settings: TableSettings;
  hideShowSystemResources?: boolean;
}

export function DefaultDatatableSettings({
  settings,
  hideShowSystemResources = false,
}: Props) {
  return (
    <>
      {!hideShowSystemResources && (
        <Checkbox
          id="show-system-resources"
          label="Show system resources"
          checked={settings.showSystemResources}
          onChange={(e) => settings.setShowSystemResources(e.target.checked)}
        />
      )}
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
