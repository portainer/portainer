import { Checkbox } from '@@/form-components/Checkbox';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';

import { TableSettings } from './types';
import { TRUNCATE_LENGTH } from './datatable-store';

interface Props {
  isRefreshVisible?: boolean;
  settings: TableSettings;
}

export function ContainersDatatableSettings({
  isRefreshVisible,
  settings,
}: Props) {
  return (
    <>
      <Checkbox
        id="settings-container-truncate-nae"
        label="Truncate container name"
        checked={settings.truncateContainerName > 0}
        onChange={() =>
          settings.setTruncateContainerName(
            settings.truncateContainerName > 0 ? 0 : TRUNCATE_LENGTH
          )
        }
      />

      {isRefreshVisible && (
        <TableSettingsMenuAutoRefresh
          value={settings.autoRefreshRate}
          onChange={(value) => settings.setAutoRefreshRate(value)}
        />
      )}
    </>
  );
}
