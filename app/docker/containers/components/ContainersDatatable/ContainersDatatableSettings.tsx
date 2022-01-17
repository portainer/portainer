import { TableSettingsMenuAutoRefresh } from '@/portainer/components/datatables/components/TableSettingsMenuAutoRefresh';
import { useTableSettings } from '@/portainer/components/datatables/components/useTableSettings';
import { Checkbox } from '@/portainer/components/form-components/Checkbox';
import type { ContainersTableSettings } from '@/docker/containers/types';

interface Props {
  isRefreshVisible: boolean;
}

export function ContainersDatatableSettings({ isRefreshVisible }: Props) {
  const { settings, setTableSettings } =
    useTableSettings<ContainersTableSettings>();

  return (
    <>
      <Checkbox
        id="settings-container-truncate-nae"
        label="Truncate container name"
        checked={settings.truncateContainerName > 0}
        onChange={() =>
          setTableSettings((settings) => ({
            ...settings,
            truncateContainerName: settings.truncateContainerName > 0 ? 0 : 32,
          }))
        }
      />

      {isRefreshVisible && (
        <TableSettingsMenuAutoRefresh
          value={settings.autoRefreshRate}
          onChange={handleRefreshRateChange}
        />
      )}
    </>
  );

  function handleRefreshRateChange(autoRefreshRate: number) {
    setTableSettings({ autoRefreshRate });
  }
}
