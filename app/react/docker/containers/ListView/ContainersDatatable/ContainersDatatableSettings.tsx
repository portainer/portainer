import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  return (
    <>
      <Checkbox
        id="settings-container-truncate-name"
        data-cy="settings-container-truncate-name"
        label={t('docker_containers.truncate_name')}
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
