import { useCurrentUser } from '@/react/hooks/useUser';

import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { Checkbox } from '@@/form-components/Checkbox';
import {
  BasicTableSettings,
  RefreshableTableSettings,
  ZustandSetFunc,
} from '@@/datatables/types';

export interface SystemResourcesTableSettings {
  showSystemResources: boolean;
  setShowSystemResources: (value: boolean) => void;
}

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}

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

interface Props {
  settings: TableSettings;
}

export function DefaultDatatableSettings({ settings }: Props) {
  return (
    <>
      <SystemResourcesSettings
        value={settings.showSystemResources}
        onChange={(value) => settings.setShowSystemResources(value)}
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

export function SystemResourcesSettings({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { isAdmin } = useCurrentUser();
  if (!isAdmin) {
    return null;
  }

  return (
    <Checkbox
      id="show-system-resources"
      label="Show system resources"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
